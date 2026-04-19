# 00-INDEX.md - local-ai-packaged

**Location**: ~/projects/local-ai-packaged/docs/00-INDEX.md  
**Part of**: Archon Ecosystem (19 projects)  
**Category**: Agent  
**Port Range**: 8000-8099

---

## 1. Project Overview

- **Name**: local-ai-packaged
- **Purpose**: AI Stack (n8n, OpenWebUI, Supabase, Flowise, Qdrant, Neo4j, SearXNG)
- **Key Services**: Multiple AI services

## 2. Service Information

| Service | Port | Health Check |
|---------|------|--------------|
| flowise | 8001 | curl http://localhost:8001/health |
| n8n | 8002 | curl http://localhost:8002/health |
| qdrant | 8003 | curl http://localhost:8003/health |
| neo4j-http | 8005 | curl http://localhost:8005 |
| neo4j-bolt | 8006 | - |
| searxng | 8008 | curl http://localhost:8008 |
| open-webui | 8050 | curl http://localhost:8050 |
| kong | 8030 | curl http://localhost:8030 |

## 3. Up-Links

- [AGENT-CENTRIC-INDEX](../../archon-v2/docs/AGENT-CENTRIC-INDEX.md)
- [CROSS_REPO_INDEX](../../main_archon/docs/CROSS_REPO_INDEX.md)

## 4. Cross-Repos

- [DevDocs](corpus://oues81/DevDocs)
- [DocumentationWorkflow](corpus://oues81/documentation-workflow)
- [AI Monitoring Tools](corpus://oues81/ai_monitoring_tools)
- [archon-v2](corpus://oues81/archon-v2)
- [main_archon](corpus://oues81/archon-v2)
- [Docker Infrastructure](corpus://oues81/docker-infrastructure-platform)
- [Hermes Agent](corpus://oues81/hermes-agent)
- [Hermes Archon Bridge](corpus://oues81/hermes-archon-bridge)
- [MCPInfra](corpus://oues81/mcpinfra)
- [Obsidian Research Factory](corpus://oues81/obsidian-research-factory)
- [Obsidian Generator](corpus://oues81/obsidian_generator)
- [RH CV Vector](corpus://oues81/rh_cv_vector)
- [Scaffold CI Stack](corpus://oues81/scaffold-ci-stack)
- [Windsurf Headless](corpus://oues81/windsurf-headless)
- [Windsurf Template Init](corpus://oues81/windsurf-template-init)
- [SpecKitBuilder](corpus://oues81/SpecKitBuilder)
- [Agent-MCP](corpus://oues81/Agent-MCP)
- [Universal Project Analyzer](corpus://oues81/universal-project-analyzer)
