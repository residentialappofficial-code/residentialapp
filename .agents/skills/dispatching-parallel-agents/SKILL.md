---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

## Overview
You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need.

When you have multiple unrelated failures, investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use
- 3+ test files failing with different root causes.
- Multiple subsystems broken independently.
- No shared state between investigations.

**Don't use when:**
- Failures are related (fix one might fix others).
- Need to understand full system state.
- Agents would interfere with each other.

## The Process
1. Identify independent domains (group failures).
2. Create focused agent tasks (scope, goal, constraints, expected output).
3. Dispatch in parallel.
4. Review and integrate results.

## Agent Prompt Structure
- Focused: One clear problem domain.
- Self-contained: All context needed.
- Specific about output: What should the agent return?

## Verification
- Review each summary.
- Check for conflicts.
- Run full test suite.
