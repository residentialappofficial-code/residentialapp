---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

## Overview
Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use
Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

## The Four Phases
You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation
**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer
   ```

5. **Trace Data Flow**

   **WHEN error is deep in call stack:**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source

### Phase 2: Pattern Analysis
1. **Find Working Examples**
   - Locate similar working code in same codebase

2. **Compare Against References**
   - Read reference implementation COMPLETELY

3. **Identify Differences**
   - List every difference, however small

### Phase 3: Hypothesis and Testing
1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"

2. **Test Minimally**
   - Make the SMALLEST possible change to test hypothesis

3. **Verify Before Continuing**
   - Did it work? Yes -> Phase 4

### Phase 4: Implementation
1. **Create Failing Test Case**
   - Simplest possible reproduction
   - Use the `superpowers:test-driven-development` skill

2. **Implement Single Fix**
   - Address the root cause identified

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?

4. **If Fix Doesn't Work**
   - STOP
   - If ≥ 3 fixes failed: Question the architecture

## Red Flags - STOP and Follow Process
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- **"One more fix attempt" (when already tried 2+)**

## Quick Reference
| Phase | Success Criteria |
|-------|------------------|
| **1. Root Cause** | Understand WHAT and WHY |
| **2. Pattern** | Identify differences |
| **3. Hypothesis** | Confirmed or new hypothesis |
| **4. Implementation** | Bug resolved, tests pass |

**Related skills:**
- **superpowers:test-driven-development**
- **superpowers:verification-before-completion**
