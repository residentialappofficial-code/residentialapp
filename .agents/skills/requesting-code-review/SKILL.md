---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch superpowers:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history.

**Core principle:** Review early, review often.

## When to Request Review
- After each task in subagent-driven development.
- After completing major feature.
- Before merge to main.

## How to Request
1. Get git SHAs (BASE and HEAD).
2. Dispatch code-reviewer subagent using the template at `code-reviewer.md`.
3. Act on feedback:
   - Fix Critical and Important issues immediately.
   - Note Minor issues.
   - Push back if reviewer is wrong (with reasoning).

## Red Flags
- Skip review because "it's simple".
- Ignore Critical or Important issues.
- Argue without technical reasoning.
