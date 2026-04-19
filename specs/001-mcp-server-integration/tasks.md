# Tasks: local-ai-packaged MCP Server Integration

**Feature**: 001-mcp-server-integration  
**Status**: Not Started  
**Last Updated**: 2026-04-06

## Phase 1: Feasibility Analysis (Complete)

✅ Decision: Single MCP server aggregating multiple services, starting with n8n

## Phase 2: n8n MCP Server PoC

### T001: Create MCP server structure
**Priority**: P0  
**Effort**: M (3-4 hours)  
**Dependencies**: None

Create Python MCP server:
- Directory: `src/mcp_server/`
- Framework: FastMCP or mcp Python SDK
- Transport: stdio or SSE
- Health endpoint: `/health`

**Acceptance**:
- [ ] MCP server structure created
- [ ] Health endpoint functional
- [ ] Server starts successfully

### T002: Implement n8n tools
**Priority**: P0  
**Effort**: L (1 day)  
**Dependencies**: T001

Implement 3 n8n tools:
- `execute_workflow`: Execute n8n workflow by ID
- `list_workflows`: List available workflows
- `get_workflow_status`: Check workflow execution status

**Acceptance**:
- [ ] All 3 tools implemented
- [ ] n8n API client integrated
- [ ] Error handling complete

### T003: Test with n8n instance
**Priority**: P0  
**Effort**: M (2-3 hours)  
**Dependencies**: T002

Test tools with existing n8n instance:
- Verify workflow execution
- Check status retrieval
- Validate error cases

**Acceptance**:
- [ ] Workflows execute successfully
- [ ] Status updates correctly
- [ ] Errors handled properly

## Phase 3: Catalog Entry

### T004: Create catalog entry YAML
**Priority**: P0  
**Effort**: M (2 hours)  
**Dependencies**: T002

Create `contracts/catalog-entry.yaml`:
- slug: `local-ai-packaged-mcp`
- backend_url: TBD (depends on deployment)
- transport: stdio or http
- trust_level: trusted
- tools: 3 n8n tools with schemas

**Acceptance**:
- [ ] YAML validates against mcpinfra schema
- [ ] All tools defined with schemas
- [ ] Service dependencies documented

### T005: Create boundary contract
**Priority**: P1  
**Effort**: S (30 min)  
**Dependencies**: None

Create `contracts/boundary-mcpinfra-004.md`

**Acceptance**:
- [ ] Boundary contract created
- [ ] Scope separation clear

## Phase 4: Integration

### T006: Provision catalog entry
**Priority**: P0  
**Effort**: S (1 hour)  
**Dependencies**: T004

Provision to mcpinfra catalog

**Acceptance**:
- [ ] Entry provisioned successfully
- [ ] Tools appear in catalog

### T007: Update integration matrix
**Priority**: P1  
**Effort**: S (30 min)  
**Dependencies**: T006

Add row to main_archon spec 009 integration matrix

**Acceptance**:
- [ ] Matrix updated
- [ ] Status set to active

### T008: End-to-end validation
**Priority**: P0  
**Effort**: M (2 hours)  
**Dependencies**: T006

Test all tools via catalog gateway

**Acceptance**:
- [ ] All tools execute via gateway
- [ ] Workflows run successfully
- [ ] Documentation complete

## Summary

**Total Tasks**: 8  
**Estimated Effort**: 3-4 days  
**Critical Path**: T001 → T002 → T003 → T004 → T006 → T008
