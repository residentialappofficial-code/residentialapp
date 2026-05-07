---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview
Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests -> Present options -> Execute choice -> Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process
1. Verify tests pass.
2. Determine base branch (main/master).
3. Present exactly these 4 options:
   1. Merge back to <base-branch> locally
   2. Push and create a Pull Request
   3. Keep the branch as-is
   4. Discard this work
4. Execute choice.
5. Cleanup worktree (for options 1, 2, 4).

## Red Flags
**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only
