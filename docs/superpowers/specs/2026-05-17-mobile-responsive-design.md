# Design Spec: HABITIX Mobile Responsiveness & Card Layouts

## Objective
Modernize and stabilize the **HABITIX** residential management app to be fully responsive on mobile devices (smartphones and tablets), converting all data tables into clean, beautiful, and interactive mobile cards while maintaining perfect backward compatibility on desktop views.

---

## 1. Kerangka Layout Responsif (Responsive Shell)
To allow the app to be responsive, the static desktop-pinned layout shell must be adapted to dynamically adjust to the screen size.

### AppLayout (in `src/App.jsx`)
- **Desktop (`lg:flex`)**: Standard fixed left sidebar (`w-64`), header pinned at `left-64` (`ml-64`), main layout with `ml-64`.
- **Mobile (`< lg`)**: Sidebar is hidden by default and shifted off-screen (`-translate-x-full`). It transitions into a **slide-over drawer** using absolute positioning and high z-index. An overlay backdrop blocks out the background when active.
- **Hamburger Menu Trigger**: Added to the left side of the `Header` component (only visible on mobile, `< lg`), which triggers the open/close state of the sidebar drawer.

---

## 2. Table-to-Card Conversion Pattern
Instead of trying to shrink tables on mobile (which ruins readability) or using global transformation wrappers (which break custom controls), we implement a clear, robust Page-by-Page visual split:

### Desktop Table View (`hidden md:block` or `hidden md:table`)
Existing stable `<Table>`, `<THead>`, `<TBody>`, and columns are rendered natively.

### Mobile Card List View (`block md:hidden`)
A beautiful vertical stack of card components. Each card represents one row and includes:
1. **Header/Title Section**: Major entity keys (e.g. Warga Name & Block, Asset Name & Quantity, Bill Period).
2. **Details Grid**: Key-value metadata fields presented in a 2-column or clean list format.
3. **Actions Row**: Integrated operational buttons (e.g. Edit, Delete, Verify Payment, Toggle Status) rendered as mobile-friendly tap targets.

---

## 3. High-Fidelity Responsive Pages

We target the following key pages with custom card layouts:

### A. Iuran Warga & Monitoring (`src/pages/Billing/ResidentFees.jsx`)
- **Card Content**:
  - Warga Name & Block + Details Trigger button (`Eye` icon).
  - Financial Metrics: Total Obligation & Total Paid in a clean grid.
  - Interactive payment months: Renders a compact grid of months with status badges (green for Paid, red/indigo for Unpaid).
  - Tapping a month status badge triggers the `handleToggleStatus` verification or payment toggle drawer.

### B. Data Warga & Pengurus (`src/pages/DataWarga.jsx`, `src/pages/DataPengurus.jsx`)
- **Card Content**:
  - Resident Name & Unit Block Identity.
  - Contact fields (Email, Phone) with native tap-to-call/email actions.
  - Active status badges and family members count.
  - Actions row: Edit and Delete buttons formatted as full-width or side-by-side tap targets.

### C. Pembayaran Iuran (`src/pages/PembayaranIuran.jsx`)
- **Card Content**:
  - Resident name and month period.
  - Payment details (Amount, Method, Date).
  - A clean mobile toggle to mark specific periods as Paid/Unpaid.

### D. Keuangan & Penggajian (`src/pages/ArusKas.jsx`, `src/pages/Penggajian.jsx`)
- **Card Content**:
  - Income/Expense Category, Amount, and Date.
  - Flow direction badges (Inflow green, Outflow red).
  - For payroll: Staff Name, Basic Salary, Allowances, and Net salary in a clean card layout with Payslip print/view options.

### E. Manajemen Blok & Hak Akses (`src/pages/ManageBlocks.jsx`, `src/pages/ManageRoles.jsx`)
- **Card Content**:
  - Block details (Blok name, Total units, Resident count).
  - Role permissions grid rendered as a list of toggles or badge tags.

---

## Success Criteria
1. **Flawless Mobile Shell**: Sidebar transitions seamlessly from fixed side-panel to mobile slide-over drawer with overlay backdrop.
2. **0% Desktop Regression**: The desktop view remains exactly identical in design, alignment, actions, and layouts.
3. **Table-to-Card Execution**: Tables on all listed pages successfully transform into clean modern cards on screen sizes `< 768px` (`md`).
4. **Action Stability**: All actions (Modals, popups, API triggers) work perfectly from both the desktop table rows and mobile cards.
5. **Linting & Verification**: Zero ESLint errors or warnings, all builds succeed, all tests pass.
