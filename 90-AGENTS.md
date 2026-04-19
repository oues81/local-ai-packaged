# 90-AGENTS.md - Guide for AI coding agents working on local-ai-packaged

## 0. Multi-Repo Context (Read First)

**Master Index**: `main_archon/docs/00-MASTER_ECOSYSTEM_INDEX.md`  
**Cross-Repo Hub**: `main_archon/docs/CROSS_REPO_INDEX.md`  
**Ecosystem Map**: See section 00.3 of Master Index

### This Repository in Ecosystem

| Property | Value |
|----------|-------|
| **Name** | local-ai-packaged |
| **Path** | `~/projects/local-ai-packaged` |
| **Primary Specs** | SPEC 001 (MCP server integration) |
| **Ports** | 8050, 8002, 8030, 8001, 8003, 8004, 8005, 8006, 8008, 3002, 8081, 8444 |
| **Integration** | MCP, HTTP, Docker |
| **Parent System** | Infrastructure layer |
| **Role** | Local AI stack (Ollama, OpenWebUI, n8n, Supabase, etc.) |

### Quick Navigation

- **README**: `../README.md`
- **Handoff**: `../70-HANDOFF.md` (to create)
- **Changelog**: `../80-CHANGELOG.md` (to create)
- **MCP Server**: `../mcp_server/server.py`

---

## 1. Project Overview

### 1.1 Purpose
Docker Compose template that bootstraps a fully-featured **local AI and low-code development environment**. Self-hosted alternative to cloud AI services.

### 1.2 Services & Ports

| Service | Port | Purpose |
|---------|------|---------|
| Open WebUI | 8050 | ChatGPT-like interface |
| n8n | 8002 | Workflow automation |
| Supabase Studio | 8030 | Database & auth UI |
| Flowise | 8001 | AI agent builder |
| Qdrant | 8003 / 8004 | Vector store |
| Neo4j | 8005 / 8006 | Knowledge graph |
| SearXNG | 8008 | Metasearch engine |
| Langfuse | 3002 | LLM observability |
| Caddy | 8081 / 8444 | Reverse proxy entrypoint |

### 1.3 Key Directories

```
local-ai-packaged/
├── docker-compose.yml           # Main orchestration
├── start_services.py            # Startup script
├── Caddyfile                    # Reverse proxy config
├── mcp_server/
│   ├── server.py               # MCP server (n8n tools)
│   └── __init__.py
├── supabase/docker/            # Supabase stack
│   └── docker-compose.yml
├── n8n/                        # Workflow backups
├── flowise/                    # Chatflow configs
└── caddy-addon/                # Caddy extensions
```

---

## 2. Development Environment

### 2.1 Prerequisites
- Docker Desktop 4.15+
- Docker Compose 2.13+
- Python 3.8+ (for startup script)
- WSL2 (Windows recommended)

### 2.2 Setup Commands
```bash
# Start all services
python3 start_services.py

# Or manual
docker-compose up -d

# Supabase only
docker-compose -f supabase/docker/docker-compose.yml up -d

# View logs
docker-compose logs -f [service]
```

### 2.3 Health Checks
```bash
# Quick check
curl http://localhost:8050/health  # Open WebUI
curl http://localhost:8002/health  # n8n
curl http://localhost:8030         # Supabase

# All services
docker-compose ps
```

---

## 3. Integration Points

### 3.1 MCP Server

The built-in MCP server exposes n8n workflows as MCP tools:

| Tool | Purpose |
|------|---------|
| execute_workflow | Run n8n workflow by ID |
| list_workflows | List available workflows |
| get_workflow_status | Check execution status |

### 3.2 Cross-Repo Integration

| Target | Protocol | Purpose |
|--------|----------|---------|
| Master Agent | MCP | Tool execution |
| mcpinfra | MCP | Catalog registration |
| Hermes | A2A | Chat via Open WebUI |

---

## 4. Configuration

### 4.1 Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
OLLAMA_BASE_URL=http://ollama:11434
N8N_ENCRYPTION_KEY=your_key
SUPABASE_JWT_SECRET=your_secret
QDRANT_API_KEY=your_key
NEO4J_AUTH=neo4j/password
```

### 4.2 MCP Configuration
```json
{
  "mcpServers": {
    "local-ai-packaged": {
      "command": "python",
      "args": ["-m", "mcp_server.server"],
      "env": {
        "N8N_API_KEY": "your-key"
      }
    }
  }
}
```

---

## 5. Troubleshooting

### 5.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Services won't start | Port conflict | Check .env ports |
| Supabase fails | Resource limits | Increase Docker memory |
| n8n webhooks fail | Network | Check caddy configuration |

---

## 6. Cross-Refs

### 6.1 Related Repositories
- **mcpinfra**: MCP catalog
- **hermes-agent**: Chat integration
- **archon-v2**: Master Agent orchestration

### 6.2 Specs
- **SPEC 001**: MCP server integration

---

## 7. Last Updated

**Date**: 2026-04-17  
**By**: Cascade Agent  
**Version**: 1.0.0

---

*Template based on DSS (Documentation Structure Standard) v1.0*
