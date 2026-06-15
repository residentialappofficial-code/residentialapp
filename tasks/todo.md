# Todo List: Centralized Payments & Super Admin Disbursement Dashboard

## Phase 1: Database Setup
- [x] Create `disbursements` table, RLS policies, and triggers
- [x] Add fee and transaction logging columns to `tagihan`
- [x] Seed platform master merchant credentials in `system_settings`

## Phase 2: Webhooks & Redirect
- [x] Refactor Pakasir Webhook edge function (`supabase/functions/pakasir-webhook/index.ts`)
- [x] Integrate checkout redirection inside resident pay modal (`src/pages/warga/MyBills.jsx`)
- [x] Insert inline "Bayar QRIS" buttons for unpaid rows in `MyBills.jsx`

## Phase 3: Payouts Console (Super Admin)
- [ ] Create `src/pages/SuperAdmin/Disbursements.jsx` dashboard component
- [ ] Register router path in `src/App.jsx`
- [ ] Add sidebar route anchor in `src/components/layout/AppSidebar.jsx`

## Final Verification
- [ ] Run typescript/linter checks: `npm run lint`
- [ ] Compile production code bundle: `npm run build`
