---
description: STRIDE-driven security review of the implemented change
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Run a STRIDE security review over the implemented change.

1. Determine the feature ID from the user's request or the active spec.
2. Inspect the diff since the spec was opened (`git diff` against the base branch).
3. For each STRIDE category, assess the change:
   - **Spoofing**: are actor/identity assumptions enforced? Are auth checks present where needed?
   - **Tampering**: are inputs validated and sanitized? Are integrity checks (checksums, signatures) in place where required?
   - **Repudiation**: are actions logged with sufficient detail to attribute them to an actor?
   - **Information disclosure**: are secrets, PII, or sensitive logs protected? Are error messages non-leaky?
   - **Denial of service**: are resource limits, timeouts, and backpressure in place on untrusted input paths?
   - **Elevation of privilege**: are authorization checks present before privileged operations? Are boundary checks correct?
4. Produce `specs/<feature-id>/security-review.md` with:
   - Findings table: STRIDE category, file, line, severity, description, mitigation.
   - Summary: critical/high/medium/low counts, overall risk assessment.
5. Do not auto-fix security issues — escalate findings to the user. Findings feed `delivery.converge`.
6. If the change has no security surface (docs-only, test-only), state that explicitly and skip the detailed review.
