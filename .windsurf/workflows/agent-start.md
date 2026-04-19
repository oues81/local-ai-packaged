---
description: Agent Session Startup - Read handoff, understand system, get context and tasks
---

# Agent Session Startup Workflow

**Purpose**: Initialize a new agent session for the Local AI Package project.

**Repository**: local-ai-packaged
**Type**: Docker Compose AI Infrastructure
**Key Services**: Ollama, Open WebUI, n8n, Supabase, Flowise, Qdrant, Neo4j, SearXNG, Langfuse

---

## 70.1 Read Handoff File

**Action**: Read the handoff file from the repository.

**File locations**:
1. `70-HANDOFF.md` - Current state
2. `HANDOFF.md` - Legacy location
3. `71-NEXT-HANDOFF.md` - Detailed continuation

**Command**:
```bash
cat 70-HANDOFF.md || cat HANDOFF.md || cat 71-NEXT-HANDOFF.md
```

---

## 70.2 Verify Repository Context

**Repository**: local-ai-packaged (Self-hosted AI Package)
**Purpose**: Docker Compose template for Local AI and Low Code development environment

**Key Components**:
| Service | Default Port | Purpose |
|---------|-------------|---------|
| n8n | 5678 | Low-code workflow automation |
| Open WebUI | 3000 | Chat interface for local LLMs |
| Flowise | 3001 | AI agent builder |
| Supabase Studio | 8030 | Database and auth |
| Qdrant | 6333 | Vector store |
| Neo4j | 7474 / 7687 | Knowledge graph |
| SearXNG | 8081 | Metasearch engine |
| Langfuse | 3002 | LLM observability |

**Read AGENTS.md**:
```bash
cat AGENTS.md 2>/dev/null || cat ../main_archon/docs/CROSS_REPO_INDEX.md 2>/dev/null | head -50
```

---

## 70.3 Verify Current State

**Action**: Check Docker services and ports.

**Commands**:
```bash
# Check running services
docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "Docker not running or compose not available"

# Check service health (if running)
curl -s http://localhost:5678/healthz 2>/dev/null | head -1 || echo "n8n not responding"
curl -s http://localhost:3000/api/health 2>/dev/null | head -1 || echo "Open WebUI not responding"
curl -s http://localhost:8030 2>/dev/null | head -1 || echo "Supabase not responding"
curl -s http://localhost:6333/healthz 2>/dev/null | head -1 || echo "Qdrant not responding"

# Git status
git status --short 2>/dev/null
```

---

## 70.4 Check Multi-Repo Context

**If working with Archon ecosystem**:
```bash
cat ../main_archon/docs/CROSS_REPO_INDEX.md 2>/dev/null | grep -A5 "local-ai-packaged\|Tools" || echo "CROSS_REPO_INDEX not found"
```

**Note**: This repo is standalone but can integrate with main_archon via MCP.

---

## 70.5 Understand Task Context

**Common tasks in this repo**:
- Docker Compose service configuration
- n8n workflow development
- Ollama model management
- Supabase database operations
- Qdrant vector operations
- Open WebUI customization

---

## 70.6 Begin Work

**Before starting**:
- [ ] Handoff read
- [ ] Docker services status verified
- [ ] Required services identified
- [ ] First task clear

**Run at END**: `/agent-end`
