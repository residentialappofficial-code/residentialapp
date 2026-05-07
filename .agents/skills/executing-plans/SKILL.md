---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview
Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process
1. Load and review plan critically.
2. Create TodoWrite with all tasks.
3. For each task:
   - Mark as in_progress.
   - Follow steps exactly.
   - Run verifications.
   - Mark as completed.
4. After all tasks complete, use superpowers:finishing-a-development-branch.

## When to Stop and Ask for Help
- Hit a blocker.
- Plan has critical gaps.
- Verification fails repeatedly.
- Ask for clarification rather than guessing.

## Red Flags
- Force through blockers.
- Skip verifications.
- Start implementation on main/master without consent.
