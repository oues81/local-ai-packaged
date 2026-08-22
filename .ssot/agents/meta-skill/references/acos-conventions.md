# Reference: ACOS Conventions and Constraints

<overview>
This reference documents the ACOS canonical structure and the constraints that any generated migration skill must respect. Use it while generating `workflows/migrate.md` and `references/acos-cli-guide.md`.
</overview>

## 1. Canonical ACOS structure

After `npx acos init --adopt`, a project has:

```text
.ssot/
├── agents/
│   ├── agents/              # Agent definitions
│   ├── entrypoints/         # Workflow/entrypoint files
│   ├── rules/               # Rule files
│   ├── context/             # Context files
│   │   ├── AGENTS.src.md
│   │   └── CLAUDE.src.md
│   ├── clients.json         # Ecosystem configuration
│   ├── hooks.json           # Lifecycle hooks
│   ├── workflows.json       # Entrypoint registry
│   ├── mcp.json             # MCP configuration
│   ├── runtimes.json        # Runtime configuration
│   └── spec-engine.json     # Spec engine configuration
├── protected-paths.json     # Protected paths
├── decisions.md             # Decision log
├── status.md                # Current status
├── handoff.md               # Handoff notes
├── context-index.md         # Context index
├── architecture.md          # Architecture
├── constitution.md          # Constitution
├── infrastructure.md        # Infrastructure
└── specifications.json      # Specifications
```

## 2. workflows.json constraints

### Entrypoint fields

| Field | Required | Allowed values | Notes |
|---|---|---|---|
| `id` | Yes | any string | Stable identifier. |
| `order` | Yes | number | Numeric prefix; controls visible ordering. |
| `slug` | Yes | string | Short human-readable identifier. |
| `description` | Yes | string | Must match the entrypoint YAML frontmatter `description` exactly. |
| `source` | Yes | filename | Filename in `.ssot/agents/entrypoints/`. |
| `category` | Yes | `onboarding`, `delivery`, `maintenance`, `session` | Custom categories are rejected. |

### Description matching rule

The entrypoint file must have YAML frontmatter:

```yaml
---
description: <exact text>
---
```

The `<exact text>` must be identical to the `description` field in `workflows.json`.

## 3. clients.json constraints

- `ecosystemRole` must be `standalone` or `satellite`.
- `satellite` requires a valid `ecosystemParent` pointing to a parent project that is already ACOS-initialized.
- For a satellite whose parent is not yet ACOS, use `standalone`.

## 4. hooks.json constraints

- `clients` is an object mapping client names to their projection configurations.
- To prevent ACOS from projecting onto a native hook file, remove the client entry from `clients` or set the file as protected.
- Cursor hooks use the native keys: `sessionStart`, `preToolUse`, `postToolUse`, `beforeShellExecution`, `sessionEnd`.

## 5. protected-paths.json

Use `managed: false` for non-ACOS files that should be preserved:

```json
{
  "path": ".cursor/hooks.json",
  "managed": false,
  "level": "deny",
  "actions": ["write", "delete"],
  "reason": "Manually merged hooks; not managed by ACOS."
}
```

## 6. Rules files

- Rule files in `.ssot/agents/rules/` are plain Markdown.
- They can include YAML frontmatter with `trigger` and `description` for editor-specific rules.
- Common rule names: `common.md`, `claude.md`, `kilo.md`, `opencode.md`, `external-runtime.md`.

## 7. Agents files

- Agent files are Markdown with YAML frontmatter.
- Required frontmatter fields: `id`, `name`, `description`.
- Optional fields: `model`, `tools`, `mode`, `color`, `sandbox_mode`, `permission`.
- Do not create parallel files with suffixes like `reviewer-legacy.md`.

## 8. ACOS CLI commands

| Command | Purpose |
|---|---|
| `npx acos init --adopt` | Initialize canonical structure and adopt existing files. |
| `npx acos --fix` | Generate/repair projections from canonical sources. |
| `npx acos --validate` | Validate canonical structure. |
| `npx acos --check` | Check drift between canonical sources and projections. |
| `npx acos-doctor` | Health check including Git, stack, runtime. |

## 9. Common validation errors

| Error | Cause | Fix |
|---|---|---|
| `category must be equal to one of the allowed values` | Invalid `category` in `workflows.json`. | Use `onboarding`, `delivery`, `maintenance`, or `session`. |
| `source description differs from workflows.json` | Mismatch between YAML frontmatter and `workflows.json`. | Make them identical. |
| `Project already initialized` | `.ssot/agents/` already exists. | Rename or archive existing `.ssot/` before `init --adopt`. |
| `ecosystemRole must be standalone` | `satellite` set without valid parent. | Use `standalone` until parent is migrated. |
| `parent .ssot/agents/clients.json not found` | Parent path is not ACOS. | Use `standalone`. |

## 10. Non-blocking warnings

| Warning | Meaning | Action |
|---|---|---|
| `.windsurf/workflows` legacy path | ACOS uses `.windsurf/workflows/` for Devin Desktop projections. | Expected; ignore if files are ACOS-generated. |
| `git.status: warn` | Many Git changes in progress. | Expected during migration; ignore if ACOS checks pass. |
| `managed externally` | A protected path is not ACOS-managed. | Expected for manually merged files. |
