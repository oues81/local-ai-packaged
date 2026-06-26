"""HTTP/SSE transport wrapper for the local-ai-packaged MCP server.

This module exposes the stdio MCP server defined in ``mcp_server.server``
over Server-Sent Events (SSE) so that it can be run as a containerised
service inside Docker Compose. The original ``server.py`` remains usable
as a stdio MCP server for local clients (Claude Desktop, etc.).
"""

import os
import logging

from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from mcp.server.sse import SseServerTransport
import uvicorn

from mcp_server.server import app as mcp_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HOST = os.getenv("MCP_SERVER_HOST", "0.0.0.0")
PORT = int(os.getenv("MCP_SERVER_PORT", "8000"))

sse = SseServerTransport("/messages")


async def health(request):
    """Lightweight health endpoint for Docker and reverse proxies."""
    return JSONResponse({"status": "ok", "transport": "sse"})


async def handle_sse(request):
    """Establish an SSE stream backed by the MCP server."""
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp_app.run(
            streams[0], streams[1], mcp_app.create_initialization_options()
        )
    return Response()


starlette_app = Starlette(
    debug=False,
    routes=[
        Route("/health", endpoint=health),
        Route("/sse", endpoint=handle_sse),
        Mount("/messages", app=sse.handle_post_message),
    ],
)


if __name__ == "__main__":
    logger.info(f"Starting MCP HTTP/SSE server on {HOST}:{PORT}")
    uvicorn.run(starlette_app, host=HOST, port=PORT)
