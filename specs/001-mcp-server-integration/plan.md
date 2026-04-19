# Implementation Plan: local-ai-packaged MCP Server Integration

**Branch**: `001-mcp-server-integration` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)

## Summary

Evaluate and implement MCP server integration for local-ai-packaged services, starting with n8n workflow execution as proof of concept. The project is a service stack requiring careful integration approach.

## Technical Context

**Language/Version**: Python 3.10+  
**Primary Dependencies**: FastAPI, n8n API client, Ollama client  
**Storage**: N/A (delegates to services)  
**Testing**: Manual tool invocation via catalog gateway  
**Target Platform**: Docker containers on mcpinfra network  
**Project Type**: MCP server aggregator (new implementation)  
**Performance Goals**: <3s response time for workflow execution  
**Constraints**: Must not interfere with existing service stack  
**Scale/Scope**: Initial 3 tools (n8n focus), expandable to other services

## Constitution Check

- **Reuse check**: New MCP server implementation; reuses mcpinfra spec 004 provisioning pattern
- **Gateway/catalog check**: Integrates via catalog provisioning, accessible through gateway port 8020
- **Security check**: Trust level: trusted (internal stack); service credentials via environment variables
- **Runtime validation check**: Health check via FastAPI /health; service connectivity validation
- **Documentation/config sync check**: Updates integration matrix in main_archon spec 009

## Phases

### Phase 1: Feasibility Analysis (Complete)
**Goal**: Determine integration approach

**Decision**: Single MCP server aggregating n8n, Ollama, and Supabase services

### Phase 2: n8n MCP Server PoC
**Goal**: Implement proof of concept for n8n workflow execution

**Tasks**:
- Create Python MCP server using FastMCP or mcp SDK
- Implement tools: execute_workflow, list_workflows, get_workflow_status
- Add n8n API client integration
- Test with existing n8n instance

### Phase 3: Catalog Entry
**Goal**: Create catalog-ready configuration

**Tasks**:
- Create catalog entry YAML
- Define tools with input schemas
- Set backend_url and transport
- Create boundary contract

### Phase 4: Integration
**Goal**: Provision to mcpinfra catalog

**Tasks**:
- Provision catalog entry
- Test tools via gateway
- Update integration matrix
- Document service dependencies
