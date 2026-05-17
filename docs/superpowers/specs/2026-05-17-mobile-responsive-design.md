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

## 4. Standar Desain Sistem Pop-up (Modal) Responsif

Untuk memastikan konsistensi dan kegunaan tingkat tinggi pada seluruh formulir modal di aplikasi Habitix, semua pop-up harus mematuhi panduan desain sistem berikut:

### A. Anatomi Kerangka Modal (Modal Layout)
- **Margin Luar Dinamis**: Pada layar mobile, gunakan lebar dinamis untuk menjamin margin tepat **16px** di sisi kiri dan kanan:
  ```javascript
  w-full max-w-[calc(100vw-32px)] md:max-w-2xl max-h-[calc(100vh-32px)] flex flex-col
  ```
- **Padding Internal Seragam**: Seluruh komponen Header, Body, dan Footer modal harus menggunakan padding tepat **16px** (`p-4` atau `space-y-4` / `gap-4`). Padding `24px` (`p-6`) dilarang untuk memaksimalkan ruang guna layar seluler.
- **Scrollable Form & Sticky Footer**:
  - Modal harus menggunakan layout vertikal (`flex flex-col`).
  - Bagian Header dan Footer disetel sebagai `shrink-0` agar tetap kokoh di posisinya (Footer tombol aksi menjadi **Sticky** di bawah).
  - Bagian Body disetel sebagai `flex-1 overflow-y-auto` agar formulir di dalamnya dapat digulung secara mulus tanpa memotong aksi simpan/batal.

### B. Arsitektur Tata Letak Formulir (Form Fields Layout)
- **Desain 1 Kolom Vertikal Penuh**: Formulir di dalam modal wajib disajikan dalam susunan **1 kolom vertikal saja** (`flex flex-col` atau `grid-cols-1`). Pembagian kolom menjadi 2 (`grid-cols-2`) dilarang karena membuat isian sangat sempit dan tidak ramah seluler.
- **Jarak Antar Masukan Presisi 12px**: Jarak antar kolom input atau grup masukan harus disetel tepat **12px** (`gap-3` atau `space-y-3`) guna menciptakan kepadatan informasi (*information density*) yang seimbang dan profesional.

### C. Komponen Input & Detail Tanggal (Global Input & Date Picker Spacing)
- **Padding Simetris Global**: Komponen input dengan ikon kustom menggunakan padding kiri `pl-11` (44px) dan padding kanan standar `pr-4` (16px).
- **Penempatan Ikon Kalender Browser**: Elemen tanggal (`type="date"`) mematuhi padding kanan default `pr-4` (16px). Hal ini secara otomatis menyeimbangkan letak ikon kalender kustom di kiri (`left-4` / 16px) dengan letak ikon pemilih tanggal bawaan browser di kanan (tetap presisi berjarak 16px dari tepi kanan input), tanpa menyebabkan adanya kekosongan area teks yang berlebihan (*overlap prevention*).

### D. Jarak Antar Konten & Section Mobile (Mobile Spacing)
- **Jarak Antar Konten Dinamis**: Jarak vertikal antar elemen, section utama, stat cards, maupun card daftar tabel pada layar seluler dibatasi tepat **16px** (`gap-4` atau `space-y-4`). Ini mencegah pemborosan ruang layar seluler (*scrolling fatigue*).
- **Transisi Responsif**: Manfaatkan utility responsif Tailwind seperti `space-y-4 md:space-y-8` atau `gap-4 md:gap-8` agar kepadatan tinggi di mobile (16px) tetap berpadu serasi dengan tata letak lapang (32px) di desktop.

---

## Success Criteria
1. **Flawless Mobile Shell**: Sidebar transitions seamlessly from fixed side-panel to mobile slide-over drawer with overlay backdrop.
2. **0% Desktop Regression**: The desktop view remains exactly identical in design, alignment, actions, and layouts.
3. **Table-to-Card Execution**: Tables on all listed pages successfully transform into clean modern cards on screen sizes `< 768px` (`md`).
4. **Action Stability**: All actions (Modals, popups, API triggers) work perfectly from both the desktop table rows and mobile cards.
5. **Pop-up Desain Sistem Compliance**: Seluruh modal menggunakan margin 16px luar, padding 16px dalam, 1 kolom layout vertikal dengan jarak form 12px, dan tombol aksi sticky di footer.
6. **Linting & Verification**: Zero ESLint errors or warnings, all builds succeed, all tests pass.

