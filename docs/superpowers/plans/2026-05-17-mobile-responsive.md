# HABITIX Mobile Responsiveness & Card Layouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the HABITIX residential application shell and all core admin pages containing tabular data into a highly responsive mobile experience (using side-sliding drawers and table-to-card conversions) while ensuring 100% stable backward compatibility on desktop views.

**Architecture:** Introduce a unified stateful sidebar toggler in the global layout (`App.jsx`), which is passed down to `Header` (burger menu trigger) and `AppSidebar` (mobile sliding drawer with dark backdrop overlay). For each core page, split the presentation layer using responsive Tailwind utilities (`hidden md:block` / `block md:hidden`) so that desktop renders the native table, and mobile renders beautifully crafted metadata card stacks with touch-friendly operations.

**Tech Stack:** React, Tailwind CSS, Lucide React, Supabase Client

---

### Task 1: Responsive Layout Shell (Sidebar Drawer & Burger Menu Toggler)

**Files:**
- Modify: `src/App.jsx:85-99`
- Modify: `src/components/layout/AppSidebar.jsx`
- Modify: `src/components/layout/Header.jsx`

- [ ] **Step 1: Update AppLayout state and sidebar drawer toggler**
  Modify `src/App.jsx` to introduce a stateful `isSidebarOpen` toggler inside `AppLayout`, pass it down to `AppSidebar` and `Header`, and change container spacing from absolute `ml-64` to responsive `lg:ml-64 ml-0`.
  ```jsx
  // In src/App.jsx: Replace AppLayout component
  function AppLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden lg:ml-64 ml-0">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto pt-20 md:pt-24 p-4 md:p-6">
            <div className="w-full max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }
  ```
  Ensure `useState` is imported at the top of `src/App.jsx`.

- [ ] **Step 2: Add burger menu toggle to Header**
  Modify `src/components/layout/Header.jsx` to receive `onMenuClick` prop, add a Menu icon button visible only on mobile (`lg:hidden`), and update header position from `left-64` to `lg:left-64 left-0`.
  ```jsx
  // In src/components/layout/Header.jsx:
  // Add 'Menu' icon from lucide-react at top:
  import { Search, Bell, ChevronDown, Building2, Sparkles, Menu } from "lucide-react";
  
  // Update Header function signature:
  export function Header({ onMenuClick }) {
    ...
    return (
      <header className="fixed top-0 right-0 lg:left-64 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 md:px-6">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Burger Menu Button */}
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            ...
          </div>
          ...
        </div>
      </header>
    );
  }
  ```

- [ ] **Step 3: Transform AppSidebar into an interactive sliding drawer**
  Modify `src/components/layout/AppSidebar.jsx` to handle drawer animation, custom overlay backdrop, and close triggers on mobile screens.
  ```jsx
  // In src/components/layout/AppSidebar.jsx:
  // Add 'X' icon from lucide-react:
  import { X, ... } from "lucide-react";
  
  // Update AppSidebar function signature:
  export function AppSidebar({ isOpen, onClose }) {
    ...
    return (
      <>
        {/* Mobile Sidebar Overlay Backdrop */}
        {isOpen && (
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden transition-all duration-300"
          />
        )}
        
        {/* Main Sidebar Container */}
        <aside className={`
          fixed left-0 top-0 w-64 h-screen bg-white text-slate-600 flex flex-col z-50 border-r border-slate-100 transition-transform duration-300 ease-in-out
          lg:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Sidebar Header with Mobile Close Button */}
          <div className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tighter leading-none">HABITIX</span>
            </div>
            
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          ...
          {/* Inside mapping of menu items: close sidebar drawer on navigation selection on mobile */}
          <Link 
            to={item.to} 
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            ...
          >
        </aside>
      </>
    );
  }
  ```

- [ ] **Step 4: Verify layout responsiveness**
  Verify the layout fits beautifully at all breakpoints.
  Command: `npm run lint` and `npm run build` to confirm zero static compilation problems.

---

### Task 2: Responsive Resident Fees Monitoring (`ResidentFees.jsx`)

**Files:**
- Modify: `src/pages/Billing/ResidentFees.jsx`

- [ ] **Step 1: Keep desktop table & Add responsive mobile card lists**
  Introduce a responsive split under the search and summary layout in `ResidentFees.jsx`.
  ```jsx
  {/* Desktop Table View */}
  <div className="hidden lg:block">
    <Table>
      ...
    </Table>
  </div>
  
  {/* Mobile Card List View */}
  <div className="block lg:hidden space-y-4">
    {filteredWarga.map((w) => {
      const fin = calculateFinance(w, iuranConfig, allBills);
      return (
        <Card key={w.id} className="p-4 flex flex-col gap-4 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">{w.blok}</span>
              <span className="text-xs text-slate-500 font-medium">{w.nama}</span>
            </div>
            <button 
              onClick={() => openWargaBills(w)}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-100 text-[11px]">
            <div>
              <p className="text-slate-400 uppercase font-bold tracking-wider">Kewajiban</p>
              <p className="text-slate-900 font-bold mt-0.5">Rp {fin ? formatCurrency(fin.totalObligation) : "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold tracking-wider">Terbayar</p>
              <p className="text-green-600 font-bold mt-0.5">Rp {fin ? formatCurrency(fin.totalPaid) : "-"}</p>
            </div>
          </div>
          
          {/* Monthly Payment Badges Grid */}
          <div className="flex flex-wrap gap-1.5">
            {months.map((m, idx) => {
              const monthNum = idx + 1;
              const hasBill = allBills.find(b => b.warga_id === w.id && b.bulan === monthNum && b.tahun === selectedYear);
              const isPaid = hasBill && hasBill.status === 'Paid';
              return (
                <button
                  key={m}
                  onClick={() => handleToggleStatus(hasBill, w.id, monthNum, selectedYear)}
                  className={`
                    px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer
                    ${isPaid 
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}
                  `}
                >
                  {m.substring(0, 3)}: {isPaid ? 'L' : 'B'}
                </button>
              );
            })}
          </div>
        </Card>
      );
    })}
  </div>
  ```

- [ ] **Step 2: Verify compile & tests**
  Command: `npm run lint` and `npm run test:run`

---

### Task 3: Responsive Data Warga & Data Pengurus

**Files:**
- Modify: `src/pages/DataWarga.jsx`
- Modify: `src/pages/DataPengurus.jsx`

- [ ] **Step 1: Implement mobile cards for DataWarga.jsx**
  Hide the desktop `<Table>` under `hidden md:block` and add a high-fidelity `<div className="md:hidden space-y-4">` card rendering for residents.
  ```jsx
  {/* Mobile Cards for Citizens */}
  <div className="md:hidden space-y-4">
    {filteredWarga.map((item) => (
      <Card key={item.id} className="p-4 flex flex-col gap-4 border border-slate-100">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{item.nama}</span>
            <span className="text-xs font-semibold text-indigo-600 mt-0.5">Blok {item.blok}</span>
          </div>
          <Badge variant={item.status === 'aktif' ? 'green' : 'amber'}>
            {item.status || 'aktif'}
          </Badge>
        </div>
        
        <div className="space-y-1.5 text-xs text-slate-500 font-medium py-2 border-y border-slate-50">
          <p className="flex justify-between"><span>Email:</span> <span className="text-slate-900">{item.email || "-"}</span></p>
          <p className="flex justify-between"><span>Telepon:</span> <span className="text-slate-900">{item.phone || "-"}</span></p>
          <p className="flex justify-between"><span>Anggota Keluarga:</span> <span className="text-slate-900">{item.family_members || 0} orang</span></p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-slate-700" 
            onClick={() => handleEdit(item)}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-red-600 hover:bg-red-50 border-red-200" 
            onClick={() => handleDelete(item.id)}
          >
            Hapus
          </Button>
        </div>
      </Card>
    ))}
  </div>
  ```

- [ ] **Step 2: Implement mobile cards for DataPengurus.jsx**
  Implement similar cards mapping the management structure, with their operational roles and actions.
  ```jsx
  {/* Mobile Cards for Pengurus */}
  <div className="md:hidden space-y-4">
    {pengurus.map((item) => (
      <Card key={item.id} className="p-4 flex flex-col gap-4 border border-slate-100">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{item.warga?.nama}</span>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">Blok {item.warga?.blok}</span>
          </div>
          <Badge variant="indigo">
            {item.role?.name || 'Pengurus'}
          </Badge>
        </div>
        ...
      </Card>
    ))}
  </div>
  ```

---

### Task 4: Responsive Pembayaran Iuran & Catatan Kas

**Files:**
- Modify: `src/pages/PembayaranIuran.jsx`
- Modify: `src/pages/ArusKas.jsx`

- [ ] **Step 1: Mobile cards for PembayaranIuran.jsx**
  Ensure month-by-month and billing-by-billing records are readable as card lists.
  
- [ ] **Step 2: Mobile cards for ArusKas.jsx**
  Create beautiful cards representing inflow/outflow, where green represents revenue and red represents OPEX/expense, along with block labels and metadata.

---

### Task 5: Responsive Penggajian & Onboarding Pages

**Files:**
- Modify: `src/pages/Penggajian.jsx`
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Mobile cards for Penggajian.jsx**
  Implement cards mapping staff salaries, showing Basic, Allowances, Deductions, Net Salary, and a print payslip action.

- [ ] **Step 2: Standardize Profile.jsx & forms layout container paddings**
  Adjust the padding in `Profile.jsx` and onboarding containers using responsive margins (`px-4 md:px-6`).

---

### Task 6: Responsive Infrastructure, Blocks & Roles

**Files:**
- Modify: `src/pages/ManageComplexes.jsx`
- Modify: `src/pages/ManageBlocks.jsx`
- Modify: `src/pages/ManageRoles.jsx`

- [ ] **Step 1: Mobile cards for ManageBlocks.jsx**
  Convert the complex block matrix tables to mobile-friendly block list cards showing total houses and block code.

- [ ] **Step 2: Mobile card matrix for ManageRoles.jsx**
  Convert the complex horizontal permissions matrix into simple expandable lists or checkmarked lists for each role.

---

### Task 7: Comprehensive Verification and Commit

**Files:**
- None (Verification task)

- [ ] **Step 1: Build verification**
  Run complete linter and compiler.
  Command: `npm run lint` and `npm run build`
  Expected: Success without any error.

- [ ] **Step 2: Unit tests validation**
  Run complete vitest tests.
  Command: `npm run test:run`
  Expected: PASS

- [ ] **Step 3: Git Commit changes**
  Commit all responsive enhancements.
  Command: `git add . && git commit -m "feat: complete premium mobile responsiveness with toggleable drawer and high-fidelity card layouts across all core tables"`
