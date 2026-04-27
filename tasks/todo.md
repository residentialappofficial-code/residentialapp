# Todo List: SimPerumahan Modules 1-4

## Phase 1: Database (Fondasi)
- [x] Run Migration: Update `warga` table and create new tables.
- [x] Verify RLS on all new tables.

## Phase 2: Keuangan (Billing)
- [x] Create `IuranConfig.jsx` for Admin.
- [x] Implement "Generate Monthly Bills" button logic.
- [x] Create `TagihanWarga.jsx` (Resident view - implemented as MyBills.jsx).
- [x] Implement "Verify Payment" dashboard for Admin.

## Phase 3: Komunikasi
- [x] Implement Announcement system (Admin creation + Resident feed).
- [x] Create Complaints module (Resident submission + Admin management).

## Phase 4: Aset & Mutasi
- [x] Create Asset Inventory management (Peminjaman Alat).
- [x] Implement Resident Mutation/Offboarding flow.

## Final Review
- [ ] E2E Testing: Multi-tenancy check.
- [ ] Performance check on large billing generation.
