---
description: Agent Session End - Update handoff and validate state
---

# Agent Session End Workflow

**Purpose**: Update handoff and prepare for next agent session.

---

## 80.1 Determine Session Outcome

**Decision tree**:
- **All tasks complete** → Update 70-HANDOFF.md to "completed"
- **Work incomplete** → Update to "in-progress" AND create 71-NEXT-HANDOFF.md
- **Blocked** → Update to "blocked" with details

---

## 80.2 Update 70-HANDOFF.md

**Template**:
```markdown
# 70-HANDOFF.md

**Date**: $(date +%Y-%m-%d)
**Agent**: {identifier}
**Status**: {completed|in-progress|blocked}

## 80.1 Service State
- **Docker**: {running/stopped}
- **n8n**: {status}
- **Open WebUI**: {status}
- **Supabase**: {status}

## 80.2 Completed Work
- [x] Task completed

## 80.3 Next Tasks
- [ ] Next task

## 80.4 Notes
{Context for next agent}
```

---

## 80.3 Create 71-NEXT-HANDOFF.md (if incomplete)

Include:
- Service configuration changes
- n8n workflow modifications
- Database migrations
- Port conflicts or changes

---

## 80.4 Final Validation

**Checklist**:
- [ ] 70-HANDOFF.md updated
- [ ] Docker services documented
- [ ] Configuration changes noted
- [ ] Port mappings correct
