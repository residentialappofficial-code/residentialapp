---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

## Overview
**Writing skills IS Test-Driven Development applied to process documentation.**

## TDD Mapping for Skills
| TDD Concept | Skill Creation |
|-------------|----------------|
| **Test case** | Pressure scenario with subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agent violates rule without skill |
| **Test passes (GREEN)** | Agent complies with skill present |

## Directory Structure
```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

## SKILL.md Structure
- YAML frontmatter: `name` and `description` (max 1024 chars)
- `description`: Third-person, starts with "Use when...", no workflow summary.
- # Skill Name
- ## Overview
- ## When to Use
- ## Core Pattern
- ## Quick Reference
- ## Common Mistakes

## Red Flags
- YAML `description` summarizes the skill's process or workflow.
- First person in description.
- Generic names.
- Creating skills without testing them first.

## The Iron Law
```
NO SKILL WITHOUT A FAILING TEST FIRST
```

## Verification Checklist
- [ ] Create pressure scenarios
- [ ] Run scenarios WITHOUT skill - document baseline failures
- [ ] Write skill addressing specific baseline failures
- [ ] Run scenarios WITH skill - verify compliance
- [ ] Address new rationalizations from testing
