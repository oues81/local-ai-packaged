# local-ai-packaged — Integration Spec

## Status
active

## Rôle dans l'écosystème
local-ai-packaged fournit les **services AI locaux** de l'écosystème master-infra : Ollama (LLM local), Neo4j (graph database), Langfuse (observabilité LLM), et Qdrant (vector store). Ces services sont consommés par MCPInfra (knowledge_graph via Neo4j, vectorstore via Qdrant) et potentiellement par d'autres composants pour l'inférence locale.

local-ai-packaged est un **satellite ACOS v1.9.1**.

## Boundary contracts

| Contrat | Input | Output | API | Contraintes |
|---------|-------|--------|-----|-------------|
| Neo4j | Cypher queries | graph data | HTTP 8350 / Bolt 8351 | Utilisé par mcpinfra knowledge_graph |
| Qdrant | vector search | embeddings results | HTTP 8360 | Utilisé par mcpinfra vectorstore |
| Ollama | LLM prompts | générations locales | HTTP (port 11434) | LLM local, pas de coût API |
| Langfuse | LLM traces | observabilité | HTTP (port 3000) | Tracing LLM |

## Dependencies

| Projet | Service | Port | Contrat |
|--------|---------|------|---------|
| mcpinfra | Neo4j | 8350/8351 | `bolt://neo4j:7687` pour knowledge_graph |
| mcpinfra | Qdrant | 8360 | vectorstore backend |
| docker-infrastructures | (shared network) | — | Réseau Docker partagé |

## ACOS integration
- **Satellite** : oui, v1.9.1
- **Personalized** : 1 spec interne
- **Entrypoints pertinents** : `1460-integrate-project`, `0660-sync`

## Runtime

| Service | Port | Healthcheck | Notes |
|---------|------|-------------|-------|
| Neo4j | 8350 (HTTP), 8351 (Bolt) | `curl /` | Graph database |
| Qdrant | 8360 | `curl /` | Vector store |
| Ollama | 11434 | `curl /api/tags` | LLM local |
| Langfuse | 3000 | `curl /api/public/health` | LLM observabilité |

Réseau : `ai_network`, `mcpinfra` (external).

## Known issues
1. **Ollama models** : à pré-puller pour éviter cold start.
2. **Neo4j initialization** : schema à initialiser pour mcpinfra knowledge_graph.
3. **Langfuse integration** : pas encore wireé dans tous les composants LLM.
4. **8 test files** détectés.

## FR-017 compliance status (Wave 1 A3 audit, 2026-08-31)

**FR-017 (Infrastructure socle)** : ✅ COMPLIANT — tous les services requis (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy) sont présents et consommés, pas recréés par le pipeline.

**D-CYCLE-004 (WSL2 hardening)** : ❌ NON-COMPLIANT — 2 violations dans `docker-compose.yml` (base file) :

1. **4 services sans `mem_limit`** (D-CYCLE-004) :
   - `ollama-gpu` (L607-616) — hérite de `x-ollama` anchor mais override `deploy.resources` sans `limits.memory`
   - `ollama-pull-llama-cpu` (L626-630) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
   - `ollama-pull-llama-gpu` (L632-636) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
   - `ollama-pull-llama-gpu-amd` (L638-643) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
2. **2 services avec `restart: always`** (D-CYCLE-004) :
   - `neo4j` (L298) — `restart: always`
   - `langfuse-web` (L397) — `restart: always`

**Mitigation partielle** : `docker-compose.override.yml` corrige ces violations (ollama-gpu→512M, neo4j→on-failure:3, langfuse-web→on-failure:3, ollama-pull-llama-*→64M), mais le fichier **base** `docker-compose.yml` reste non-compliant. La conformité D-CYCLE-004 exige que le fichier base soit compliant (un override ne garantit pas la conformité si l'override n'est pas appliqué).

**Référence audit** : `AGENT_REPORTS/2026-08-31/auto-improve/wave-1/A3-infrastructure-routage-diagnose.md` (lines 62-63, 2.11-2.12).

## Références
- `local-ai-packaged/.ssot/status.md`
- `local-ai-packaged/specs/` (1 spec interne)
- `local-ai-packaged/README.md`
