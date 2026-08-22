# {{feature_id}} — Data Model

## Feature ID

`{{feature_id}}`

## Status

- **Spec phase**: plan | data-model | implement | verify
- **Last updated**: YYYY-MM-DD

## Entities

### {EntityName}

- **Identifier**: `{id}`
- **Attributes**:
  - `attr` (type): {description}
  - `attr` (type): {description}
- **Responsibilities**: {what this entity owns and why it exists}

### {EntityName}

- ...

## Relations

- `{EntityA}` **1:N** `{EntityB}` — {meaning of the relationship}
- `{EntityB}` **N:1** `{EntityC}` — {meaning of the relationship}

## Invariants

- **INV-001** — {Invariant}: enforced by {mechanism}.
- **INV-002** — {Invariant}: enforced by {mechanism}.

## API contracts

### {Endpoint or interface name}

- **Inputs**: `{type}` — validation: {rules}
- **Outputs**: `{type}` — guarantees: {post-conditions}
- **Errors**: `{error code}` — when: {condition}

## Migration notes

- {Data or schema migration required by this feature.}
- {Backwards-compatibility strategy.}

## Notes

- {Cross-references to `{{feature_id}}/spec.md` and `{{feature_id}}/plan.md`.}
