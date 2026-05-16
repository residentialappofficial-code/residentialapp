# SPEC: HABITIX Mobile Responsiveness

## Objective
Convert all desktop data tables across the HABITIX application into high-fidelity, interactive card layouts on mobile devices (`< 768px`) and make the overall layout shell (Sidebar, Header, and Page Containers) fully responsive using a mobile burger-drawer navigation.

## Tech Stack
- React + Vite
- Tailwind CSS
- Lucide React (for icons)
- Supabase (Backend client)

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm run test:run`

## Project Structure
- `src/App.jsx` — Core layout container, responsive sidebar toggler.
- `src/components/layout/AppSidebar.jsx` — Responsive sidebar drawer.
- `src/components/layout/Header.jsx` — Burger menu icon addition.
- `src/pages/**/*.jsx` — Custom responsive mobile card rendering alongside desktop tables.

## Success Criteria
1. Hamburger menu button appears on mobile screens to toggle the AppSidebar.
2. AppSidebar converts into a slides-in drawer with dark overlay background on mobile.
3. Desktop layouts retain 100% of their existing look and feel.
4. Tables across all major admin pages (`ResidentFees`, `DataWarga`, `DataPengurus`, `PembayaranIuran`, `ArusKas`, `Penggajian`, `ManageBlocks`, `ManageRoles`) convert into modern, readable, and highly interactive cards on mobile view.
5. All buttons and callbacks (e.g. view history, payment toggles, edit modal, delete actions) trigger correctly from both card layout and table row layouts.
6. The project has zero ESLint warnings or errors, builds cleanly, and passes all tests.

## Boundaries
- **Always**: Keep desktop table structure and actions entirely functional. Ensure the page looks excellent in 375px (iPhone width), 768px (iPad width), and 1440px (Desktop width).
- **Ask first**: Adding new dependencies or changing database queries.
- **Never**: Break desktop layouts or remove existing functionalities.
