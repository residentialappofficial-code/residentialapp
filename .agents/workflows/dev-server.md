---
description: How to run the SimPerumahan development server
---

// turbo-all

1. Navigate to the project directory
```bash
cd /Users/kamal/.gemini/antigravity/scratch/sim_perumahan
```

2. Start the development server on port 5174
```bash
npm run dev
```

3. The app should be accessible at http://localhost:5174

4. If port 5174 is busy, find and kill the process:
```bash
lsof -ti:5174 | xargs kill -9
```
Then retry step 2.
