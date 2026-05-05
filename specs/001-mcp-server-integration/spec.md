# local-ai-packaged — MCP Server Integration

**Status**: Draft  
**Created**: 2026-04-06  
**Parent**: MCPInfra `specs/004-external-mcp-catalog-onboarding/spec.md`

## Goal

Evaluate and implement **MCP server integration** for local-ai-packaged services, enabling catalog access to AI workflow capabilities.

## Current State

- **Project Type**: Docker compose template for self-hosted AI stack
- **Services**: n8n, Ollama, Supabase, Open WebUI, Flowise, Qdrant, Neo4j, SearXNG, Caddy, Langfuse
- **No MCP Server**: No existing MCP server or catalog integration
- **Architecture**: Service-oriented with HTTP APIs

## Requirements

### Phase 1: Feasibility Analysis (Immediate)
1. Evaluate which services should be exposed via MCP:
   - **n8n**: Workflow execution (high value)
   - **Ollama**: LLM inference (high value)
   - **Supabase**: Database/vector store (medium value)
   - **Flowise**: Agent builder (medium value)
   - **Neo4j**: Knowledge graph (low priority)
2. Determine integration approach:
   - Option A: Single MCP server aggregating multiple services
   - Option B: Separate MCP server per service
   - Option C: Wrapper per service (like current ai_monitoring_tools approach)
3. Assess security implications (internal vs external access)

### Phase 2: Proof of Concept (Short-term)
1. Create MCP server for n8n workflow execution:
   - Tool: `execute_workflow` - Execute n8n workflow by ID
   - Tool: `list_workflows` - List available workflows
   - Tool: `get_workflow_status` - Check workflow execution status
2. Test with existing n8n instance
3. Evaluate performance and usability

### Phase 3: Catalog Entry (After PoC)
1. Create catalog entry YAML following mcpinfra spec 004 format
2. Define slug: `local-ai-packaged-mcp` (or per-service slugs)
3. Document backend URLs and transport
4. List tools with input schemas
5. Define capabilities: workflow_execution, llm_inference, database_operations
6. Set trust_level: trusted (internal stack)
7. Create boundary contract referencing spec 004

### Phase 4: Integration (After Phase 3)
1. Provision entry to mcpinfra catalog
2. Test tools via catalog gateway (port 8020)
3. Update integration matrix (main_archon spec 009)
4. Document service dependencies

## Traceability

| Audit ID | Action |
|----------|--------|
| LAI-01 | Complete feasibility analysis |
| LAI-02 | Implement PoC for n8n MCP server |
| LAI-03 | Create catalog entry YAML |
| LAI-04 | Provision entry to mcpinfra catalog |
| LAI-05 | Update integration matrix |

## Success Criteria

- [x] Feasibility analysis completed with recommendation
- [x] PoC MCP server implemented (n8n)
- [x] Server runs successfully
- [ ] Catalog entry created and validated
- [ ] Entry provisioned to catalog (POST /catalog/entries)
- [ ] Tools accessible via mcpinfra gateway (port 8020)
- [ ] Integration matrix updated with row: `tool_local_ai_packaged_mcp`
- [ ] Boundary contract created with spec 004

## Dependencies

- mcpinfra spec 004: External MCP catalog onboarding
- mcpinfra registry service (port 8018)
- mcpinfra catalog gateway (port 8020)
- local-ai-packaged docker compose stack
- Selected service APIs (n8n, Ollama, etc.)

## Notes

local-ai-packaged is a service stack rather than a single application. The MCP integration approach needs careful consideration - either a single aggregating MCP server or multiple service-specific MCP servers. Start with a PoC on the highest-value service (likely n8n for workflow execution).
