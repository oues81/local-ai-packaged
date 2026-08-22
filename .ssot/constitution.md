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
