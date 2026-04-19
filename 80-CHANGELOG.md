# 80-CHANGELOG.md - Local AI Packaged Version History

## 80.1 Unreleased

### 80.1.1 Added
- 90-AGENTS.md (DSS-compliant documentation)
- 70-HANDOFF.md (agent state tracking)
- Cross-repo references to Master Agent ecosystem

### 80.1.2 Changed
- Documentation standardized to DSS v1.0

---

## 80.2 [Current] - 2026-04-17

### 80.2.1 Overview
- **Status**: Operational
- **Services**: 8 core services + MCP server

### 80.2.2 Services
| Service | Version | Status |
|---------|---------|--------|
| Ollama | Latest | ✅ Core |
| Open WebUI | Latest | ✅ Chat interface |
| n8n | Latest | ✅ Workflows |
| Supabase | Latest | ✅ Database |
| Flowise | Latest | ✅ Agent builder |
| Qdrant | Latest | ✅ Vectors |
| Neo4j | Latest | ✅ Graph |
| SearXNG | Latest | ✅ Search |
| Langfuse | Latest | ✅ Observability |

### 80.2.3 MCP Tools
| Tool | Purpose |
|------|---------|
| execute_workflow | Run n8n workflow |
| list_workflows | List available workflows |
| get_workflow_status | Check execution |

---

## 80.3 Integration Status

| System | Status | Notes |
|--------|--------|-------|
| MCP Catalog | 🔄 Pending | Register with mcpinfra |
| Master Agent | 🔄 Planned | Tool provider |
| Hermes | ✅ Ready | Chat via Open WebUI |

---

*Standard: DSS (Documentation Structure Standard) v1.0*
