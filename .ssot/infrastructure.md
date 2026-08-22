# Existing Development Infrastructure

## Boundary

This project consumes an existing shared development platform. ACOS integrates with it but does not own or recreate it.

Known capabilities, when configured:

- private Harbor registry;
- shared dependency, image, or build caches;
- MCP infrastructure with a server and tool catalogue — this catalogue is typically the control plane itself; do not assume a separate dedicated MCP client-management tool exists until discovery confirms one.
- agent tooling (for example Archon-style agent/work-order services) and a local RAG capability, when the platform provides them.

There is no default host. A project enables this adapter by creating `.ssot/infrastructure-profile.json` describing the actual platform; until that file exists, treat infrastructure as unconfigured and say so rather than guessing.

## Current integration status

Unconfigured by default. When `.ssot/infrastructure-profile.json` is present, `npx --no-install acos --validate` validates it against the packaged infrastructure-profile schema and rejects any credential-shaped key found anywhere in it. `npx --no-install acos-infra --profile .ssot/infrastructure-profile.json` performs the bounded, read-only SSH discovery declared by the profile's `transport` section and reports, per logical service: present-and-healthy, present-and-unhealthy/starting, or absent from the live snapshot — never a static assumption.

A profile's `transport.ssh` block names the read-only discovery command and the SSH client to use (OpenSSH or PuTTY/Plink, whichever the operator's environment actually has configured); ACOS does not assume either is installed. A profile's `mcpManagement` block records whatever the platform's actual MCP control plane is — often the infrastructure's own registry/catalogue rather than a separate tool — plus how ACOS should delegate reconciliation to it, if at all.

## Rules

1. Do not deploy or reimplement these services from a project workflow.
2. Do not store tokens, passwords, certificates, or copied client credentials in `.ssot`; `infrastructure-profile.json` is schema- and key-scanned to enforce this.
3. Treat the platform's own MCP registry/catalogue as the control plane unless discovery confirms a distinct management tool; avoid direct per-client configuration drift either way.
4. Prefer read-only discovery before mutation and report the source of every resolved capability.
5. If the infrastructure profile is unavailable or unconfigured, report that limitation and use a fallback only with explicit authorization.
