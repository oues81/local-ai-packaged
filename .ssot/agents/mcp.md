# MCP server configuration (`mcp.json`)

## Why `mcp.json` is empty

`mcp.json` contains `"mcpServers": {}` (no server entries) by design. This is
not an oversight — it reflects the ACOS infrastructure architecture.

### Architecture: MCPInfra is the source of truth

The external development platform operates a dedicated MCP control plane called
**MCPInfra**. MCPInfra's own registry and catalogue are the authoritative source
for available MCP servers (filesystem, command, terminal, security,
observability, vectorize, memory, knowledge graph, vectorstore, etc.). ACOS
discovers and reports on MCPInfra at runtime rather than maintaining a divergent
per-project MCP server list.

This is documented in `../infrastructure.md` → "Integration rule":

> Store only a stable global profile reference in projects. Resolve current
> endpoints and health from `constantinople` at runtime, report provenance and
> observation time, redact secrets, and treat MCPInfra's own registry/catalogue
> as the source of truth rather than maintaining a divergent per-client MCP
> configuration.

And in the "Boundary" section:

> ACOS consumes this existing platform. It does not deploy replacements, copy
> the MCP catalogue, store credentials, or create divergent MCP client
> configuration.

### How MCP is configured per client

Although `mcp.json` carries no server definitions, every client still has an MCP
surface. The per-client MCP configuration is declared in `clients.json` under
each client's `projections.mcp` entry and `settingsFile` field. The sync engine
(`scripts/core/sync-clients.mjs`) projects the MCP surface into each client's
native configuration file:

| Client        | Native MCP file              | `clients.json` projection                          |
|---------------|------------------------------|----------------------------------------------------|
| Claude Code   | `.mcp.json`                  | `clients.clients.claude.projections.mcp`           |
| Cursor        | `.cursor/mcp.json`           | `clients.clients.cursor.projections.mcp`           |
| OpenCode      | `opencode.json`              | `clients.clients.opencode.projections.mcp`         |
| Kilo Code     | `kilo.jsonc`                 | `clients.clients.kilo.projections.mcp`             |
| OpenAI Codex  | `.codex/config.toml`         | `clients.clients.codex.projections.mcp`            |
| Devin CLI     | `.devin/config.json`         | `clients.clients.devin.projections.mcp`            |
| Devin Desktop | `.devin/mcp_config.json`     | `clients.clients.devinDesktop.projections.mcp`     |
| Eve           | `agent/connections/*.ts`     | `clients.clients.eve.projections.mcp`              |

Because `mcp.json` is empty, these projections produce empty MCP server blocks
per client — the client connects to MCPInfra at runtime through its own
environment/credential mechanism rather than through a static server list baked
into the SSOT.

### When to populate `mcp.json`

Populate `mcpServers` here only when a project genuinely owns standalone MCP
servers that are **not** provided by the shared MCPInfra control plane. Every
entry must conform to the `mcp-servers.json` schema (`schemas/mcp-servers.json`):
`command` + `args` for `stdio` servers, or `url` for `http`/`sse` servers.

### Schema note

The JSON schema (`schemas/mcp-servers.json`) sets `additionalProperties: false`
at the root, so explanatory keys like `_comment` or `_doc` cannot be added
directly to `mcp.json` without breaking validation. This companion Markdown file
is the documentation surface for that reason.
