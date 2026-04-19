# Local AI Packaged Constitution

## Core Principles

### I. Self-Hosted First
All services must run locally via Docker Compose. No external cloud dependencies for core functionality. Users must be able to operate fully offline after initial image pulls.

### II. Security & Privacy
Never commit `.env` files. All sensitive configuration via environment variables. Supabase stack runs in its own isolated compose file. Caddy handles TLS termination for HTTPS.

### III. Service Modularity
Each service (Ollama, n8n, Open WebUI, Flowise, etc.) must be independently configurable and optional. Users should be able to enable/disable services via compose profiles or overrides.

### IV. Ecosystem Alignment
This project is part of the Archon multi-repo ecosystem. Follow conventions from `main_archon/docs/CROSS_REPO_INDEX.md`. MCP server in `mcp_server/` provides programmatic access to service operations.
