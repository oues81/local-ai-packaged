"""MCP Server for local-ai-packaged - n8n workflow execution."""

import os
import json
import httpx
import logging
from typing import Any
from mcp.server import Server
from mcp.types import TextContent, Tool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Server("local-ai-packaged-mcp")

# n8n API configuration
N8N_BASE_URL = os.getenv("N8N_BASE_URL", "http://n8n:5678")
N8N_API_KEY = os.getenv("N8N_API_KEY", "")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools for n8n workflow execution."""
    return [
        Tool(
            name="execute_workflow",
            description="Execute an n8n workflow by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "workflow_id": {
                        "type": "string",
                        "description": "n8n workflow ID to execute",
                    },
                    "data": {
                        "type": "object",
                        "description": "Input data for the workflow",
                    },
                },
                "required": ["workflow_id"],
            },
        ),
        Tool(
            name="list_workflows",
            description="List available n8n workflows",
            inputSchema={
                "type": "object",
                "properties": {
                    "active_only": {
                        "type": "boolean",
                        "description": "Only show active workflows",
                    }
                },
            },
        ),
        Tool(
            name="get_workflow_status",
            description="Check workflow execution status",
            inputSchema={
                "type": "object",
                "properties": {
                    "execution_id": {
                        "type": "string",
                        "description": "Execution ID to check",
                    }
                },
                "required": ["execution_id"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Execute MCP tool."""
    logger.info(f"Calling tool: {name} with arguments: {arguments}")
    headers = {"X-N8N-API-KEY": N8N_API_KEY} if N8N_API_KEY else {}

    async with httpx.AsyncClient() as client:
        try:
            if name == "execute_workflow":
                workflow_id = arguments.get("workflow_id")
                if not workflow_id:
                    return [
                        TextContent(
                            type="text",
                            text=json.dumps(
                                {"error": "workflow_id is required"}, indent=2
                            ),
                        )
                    ]

                data = arguments.get("data", {})

                response = await client.post(
                    f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}/execute",
                    headers=headers,
                    json=data,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Workflow {workflow_id} executed successfully")
                return [TextContent(type="text", text=json.dumps(result, indent=2))]

            elif name == "list_workflows":
                active_only = arguments.get("active_only", False)
                url = f"{N8N_BASE_URL}/api/v1/workflows"
                if active_only:
                    url += "?active=true"

                response = await client.get(url, headers=headers)
                response.raise_for_status()
                workflows = response.json()
                logger.info(f"Listed {len(workflows)} workflows")
                return [TextContent(type="text", text=json.dumps(workflows, indent=2))]

            elif name == "get_workflow_status":
                execution_id = arguments.get("execution_id")
                if not execution_id:
                    return [
                        TextContent(
                            type="text",
                            text=json.dumps(
                                {"error": "execution_id is required"}, indent=2
                            ),
                        )
                    ]

                response = await client.get(
                    f"{N8N_BASE_URL}/api/v1/executions/{execution_id}", headers=headers
                )
                response.raise_for_status()
                status = response.json()
                logger.info(f"Retrieved status for execution {execution_id}")
                return [TextContent(type="text", text=json.dumps(status, indent=2))]

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP error calling n8n API: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            return [
                TextContent(
                    type="text", text=json.dumps({"error": error_msg}, indent=2)
                )
            ]
        except httpx.RequestError as e:
            error_msg = f"Request error calling n8n API: {str(e)}"
            logger.error(error_msg)
            return [
                TextContent(
                    type="text", text=json.dumps({"error": error_msg}, indent=2)
                )
            ]
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            return [
                TextContent(
                    type="text", text=json.dumps({"error": error_msg}, indent=2)
                )
            ]

    error_msg = f"Unknown tool: {name}"
    logger.warning(error_msg)
    return [TextContent(type="text", text=json.dumps({"error": error_msg}, indent=2))]


async def main():
    """Run MCP server."""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
