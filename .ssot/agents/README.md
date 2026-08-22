# ACOS Canonical Agent Infrastructure

This directory is the editable source for client-neutral agent infrastructure.

- `clients.json`: six-client capability and compatibility contract, with multiple surfaces where required.
- `workflows.json`: stable IDs, visible order, source files, and projection targets.
- `entrypoints/*.md`: reusable task and lifecycle workflows.
- `rules/common.md`: shared project rules.
- `context/*.src.md`: generated root or client-specific instruction sources.
- `agents/*.md`: canonical subagent definitions projected to each client's native agent surface.
- `mcp.json`: canonical MCP server definitions projected to each client's native MCP configuration. Intentionally empty (`"mcpServers": {}`) — MCPInfra is the external source of truth for MCP servers; see `mcp.md` for details.
- `../infrastructure.md`: boundary and discovery status for the existing Harbor, cache, and MCP control plane.
- `../specifications.json`: optional explicit mappings from specifications to implementation and verification evidence.

Internal references use IDs such as `project.resume`. Users invoke the projected visible name such as `/0020-resume`, `$0020-resume`, or the client-specific file reference documented by `npx --no-install acos --report`.

Run `npx --no-install acos --validate` before projection, `npx --no-install acos --fix` to reconcile managed output, and `npx --no-install acos --check` to detect drift. ACOS removes only orphaned files that contain its generated marker; unrelated client files are preserved.
