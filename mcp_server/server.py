"""MCP Server for local-ai-packaged - n8n workflow execution."""
import os
import json
import httpx
from typing import Any
from mcp.server import Server
from mcp.types import TextContent, Tool

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
                    "workflow_id": {"type": "string", "description": "n8n workflow ID to execute"},
                    "data": {"type": "object", "description": "Input data for the workflow"}
                },
                "required": ["workflow_id"]
            }
        ),
        Tool(
            name="list_workflows",
            description="List available n8n workflows",
            inputSchema={
                "type": "object",
                "properties": {
                    "active_only": {"type": "boolean", "description": "Only show active workflows"}
                }
            }
        ),
        Tool(
            name="get_workflow_status",
            description="Check workflow execution status",
            inputSchema={
                "type": "object",
                "properties": {
                    "execution_id": {"type": "string", "description": "Execution ID to check"}
                },
                "required": ["execution_id"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Execute MCP tool."""
    headers = {"X-N8N-API-KEY": N8N_API_KEY} if N8N_API_KEY else {}
    
    async with httpx.AsyncClient() as client:
        if name == "execute_workflow":
            workflow_id = arguments.get("workflow_id")
            data = arguments.get("data", {})
            
            response = await client.post(
                f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}/execute",
                headers=headers,
                json=data
            )
            result = response.json()
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        elif name == "list_workflows":
            active_only = arguments.get("active_only", False)
            url = f"{N8N_BASE_URL}/api/v1/workflows"
            if active_only:
                url += "?active=true"
                
            response = await client.get(url, headers=headers)
            workflows = response.json()
            return [TextContent(type="text", text=json.dumps(workflows, indent=2))]
            
        elif name == "get_workflow_status":
            execution_id = arguments.get("execution_id")
            
            response = await client.get(
                f"{N8N_BASE_URL}/api/v1/executions/{execution_id}",
                headers=headers
            )
            status = response.json()
            return [TextContent(type="text", text=json.dumps(status, indent=2))]
            
    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run MCP server."""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
