# {{feature_id}} — Quality Checklist

## Feature ID

`{{feature_id}}`

## Status

- **Spec phase**: checklist | analyze | implement | verify
- **Last updated**: YYYY-MM-DD

## Completeness

- [ ] Every requirement in `spec.md` has an acceptance criterion.
- [ ] Every acceptance criterion has a verification method.
- [ ] All known failure modes are documented.
- [ ] Dependencies and blockers are explicit.

## Clarity

- [ ] User stories name a stakeholder and observable outcome.
- [ ] No ambiguous pronouns or undefined terms in acceptance criteria.
- [ ] Scope and non-goals are distinguishable.

## Consistency

- [ ] `spec.md`, `plan.md`, `data-model.md`, `tasks.md`, and `checklist.md` do not contradict each other.
- [ ] Terminology matches repository and architecture conventions.
- [ ] Stable IDs and file references are correct.

## Security

- [ ] Trust boundaries are identified for every affected surface.
- [ ] Input validation, auth, and authz are covered.
- [ ] No credentials or secrets are written to specs or plans.

## Tests

- [ ] Each acceptance criterion maps to at least one test or check.
- [ ] Failure-mode tests are included where practical.
- [ ] Test commands are recorded and runnable.

## Sign-off

- [ ] Spec reviewed: {date}
- [ ] Plan reviewed: {date}
- [ ] Checklist completed: {date}
