---
description: How to debug SimPerumahan when it shows errors, blank screens, or infinite loading
---

1. Read the debugging skill first:
```
.agents/skills/simperumahan-debug/SKILL.md
```

2. Check the browser console for errors

3. Search for Chakra UI imports that may cause ContextError:
```bash
grep -r "@chakra-ui/react" src/pages/
```

4. If any Chakra imports are found, migrate them to Tailwind/Shadcn UI following the patterns in:
```
.agents/skills/simperumahan-dev/SKILL.md
```

5. Verify the fix:
```bash
npm run dev
```
Then hard-refresh the browser with Cmd+Shift+R.
