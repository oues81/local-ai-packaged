# Project Constitution

1. Repository evidence outranks stale narrative documentation.
2. Canonical ACOS sources live under `.ssot/`; managed client projections are not edited directly.
3. Stable workflow IDs are used for internal references; numeric prefixes are presentation order only.
4. Existing user changes are preserved unless the user explicitly requests their removal.
5. External publication, deployment, messaging, and destructive operations require explicit authority.
6. Verification reports distinguish passed, failed, and not-run checks.
7. Durable status and handoff files contain facts, decisions, blockers, and reproducible next actions.
8. **Projection completeness.** All clients declared in `.ssot/agents/clients.json`
   MUST have complete projections (instructions, rules, hooks, commands, skills,
   workflows, file references, and MCP access through a declared `native` or
   `emulated` route). The declared set is not reduced without a recorded decision.
   The canonical ACOS distribution declares seven clients; consuming projects may
   enable a subset.
9. **Standardized prefix categories.** ACOS provides the most advanced, standardized,
   and flexible structure for orchestrating development work. Standardized means the same
   kind of operation carries the same prefix across all consuming projects, so a developer
   builds muscle memory. Core categories (0xx–12xx) cover universal operations; needs not
   covered by a core category must use `project` (1500+) or, for multi-project ecosystems,
   `ecosystem` (13xx–14xx) extensions rather than ad-hoc numbers. See
   `000-numbering-conventions/spec.md` for the canonical ranges and core-reserved slots.

## Project-specific principles

10. **Self-hosted AI stack.** Core AI inference runs locally via Ollama — no external
    API dependencies for LLM generation. External APIs (OpenAI, etc.) are optional
    add-ons, not core dependencies.
11. **Docker Compose as primary orchestration.** All services run in Docker Compose.
    There is no Kubernetes, no Nomad, no bare-metal service manager. The
    `docker-compose.yml` file is the source of truth for service topology.
12. **Caddy for TLS/HTTPS.** Caddy is the sole reverse proxy and TLS terminator.
    All public-facing traffic flows through Caddy (ports 8081/8444). Direct port
    exposure is for development only (private override binds to 127.0.0.1).
13. **Profile-based deployment.** Ollama runs under Compose profiles
    (`cpu`, `gpu-nvidia`, `gpu-amd`, `none`). Only one profile is active at a
    time. The `none` profile is for when Ollama runs externally (e.g. on Mac).
14. **Supabase: cloud over local.** The local Supabase stack is intentionally
    disabled in the main compose. The project uses a cloud Supabase instance
    provisioned by `archon-v2`. Local Supabase is available as a standalone
    option but is not the default.
15. **Never commit `.env` files.** Use `.env.example` as the template. The
    `.env` file contains secrets (database passwords, JWT keys, API keys) and
    is gitignored. `start_services.py` copies `.env` to `supabase/docker/.env`.
16. **Pin image versions.** No `:latest` tags for upstream images (0840 standard).
    All images use explicit version tags. The MCP server image is built from
    `Dockerfile.mcp` with pinned `requirements.txt` dependencies.
17. **External network required.** The `ai_network` Docker network must exist
    before starting services. It is shared with the `master-infra` ecosystem.
18. **Resource limits on all services.** Every service in `docker-compose.yml`
    has `deploy.resources` with CPU and memory limits. The minimal override
    reduces these for development on constrained hosts.
