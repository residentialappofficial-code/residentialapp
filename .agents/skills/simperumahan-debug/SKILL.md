---
name: simperumahan-debug
description: Systematic debugging for SimPerumahan. Use when the app shows a blank/white screen, infinite loading, console errors, or unexpected behavior. Follows a structured triage to find and fix root causes.
---

# SimPerumahan Debugging Skill (Chakra UI v3)

## Overview

Systematic debugging workflow for the SimPerumahan application after the migration to **Chakra UI v3**. This skill guides root-cause analysis for failures related to the new design system, Supabase auth, and data-fetching patterns.

## When to Use

- App shows a blank white screen or infinite loading spinner
- Console shows `ContextError: useContext returned undefined`
- UI layout is broken or elements are missing
- Supabase auth flow breaks (login fails, session stuck)
- Data-fetching errors or empty tables

## Triage Checklist

```
App broken?
├── White screen / crash
│   ├── Check Console for errors
│   ├── ContextError? → Pattern 1 (Missing ChakraProvider)
│   ├── Syntax Error? → Pattern 2 (Mismatched tags)
│   └── Runtime error? → Check component stack trace
│
├── Infinite loading
│   ├── Check Console for auth errors
│   ├── Is AuthContext.loading stuck? → Pattern 3
│   └── Is page-level loading stuck? → Check fetchData()
│
├── UI looks broken
│   ├── Residual Tailwind? → Pattern 4
│   └── Component specific? → Check Chakra style props
│
└── Data issues
    ├── Empty results? → Pattern 5 (RLS)
    └── Error toast? → Check Supabase error message
```

## Known Failure Patterns

### Pattern 1: "ContextError — useContext returned undefined"

**Symptom:** White screen, console shows `ContextError: useContext returned undefined. Seems you forgot to wrap component within <ChakraProvider />`.

**Root Cause:** A component tries to use Chakra hooks/components outside of the `<ChakraProvider>` tree.
**Fix:** 
1. Ensure `src/main.jsx` wraps the `<App />` in `<Provider>`.
2. Check if a component is being rendered via a Portal or outside the main react tree that might need its own provider.

### Pattern 2: Syntax Errors (Mismatched Tags)

**Symptom:** Vite build fails with `Unexpected closing tag does not match opening tag`.

**Root Cause:** Chakra UI v3 uses dot-notation for many components (e.g., `<Tabs.Root>`, `<Tabs.Trigger>`). Mixing dot-notation with flat tags (e.g., `<TabsTrigger>`) causes errors.
**Fix:**
1. Stick to the dot-notation as defined in the project's Chakra components.
2. Example: Ensure `<Tabs.Trigger>` is closed by `</Tabs.Trigger>`, NOT `</TabsTrigger>`.

### Pattern 3: Infinite Auth Loading

**Symptom:** App shows the loading spinner forever.

**Root Cause:** `AuthContext.loading` state is stuck at `true`.
**Fix:**
1. Check `AuthContext.jsx` for the 3-second emergency timeout.
2. Ensure `setLoading(false)` is called in the `finally` block of the session check.
3. Check browser console for Supabase connection errors.

### Pattern 4: Residual Tailwind Styling

**Symptom:** Layout looks inconsistent or weirdly spaced.

**Root Cause:** Hardcoded Tailwind classes (`className="..."`) might still exist and conflict with Chakra style props.
**Fix:**
1. Search for any remaining `className` usage in `src/pages/`.
2. Convert them to Chakra style props (e.g., `className="p-4 bg-white"` → `p={4} bg="white"`).

### Pattern 5: Supabase RLS / Data Empty

**Symptom:** Queries return empty arrays even though data exists.

**Root Cause:** Row Level Security (RLS) policies filter rows based on `perumahan_id`.
**Fix:**
1. Verify the user profile has the correct `perumahan_id`.
2. check if the table has RLS enabled and a policy allowing the current user's role to read.

## Verification Checklist

- [ ] Console is free of `ContextError`.
- [ ] No Tailwind `className` strings remain in page files.
- [ ] App loads without infinite spinner after hard refresh (Cmd+Shift+R).
- [ ] Responsive behavior works correctly using Chakra breakpoints.
