# SPEC: Synchronization of Mulai Iuran (Start of Dues) and Handover Date (Tgl Serah Terima)

## Objective
Ensure that the start of dues ("mulai iuran" / billing start) and the unit handover date ("tanggal serah terima") are always fully synchronized between the `blok` (units) and `warga` (residents) tables. This prevents discrepancies between different management dashboards and guarantees that the resident's underpayment/outstanding dues ("kurang berapa") calculations are completely accurate.

## Tech Stack
- Frontend: React 19 + Vite + Chakra UI v3
- Backend: Supabase (PostgreSQL Database + RPC functions)
- Testing: Vitest

## Commands
- Run Tests: `npm run test:run`
- Dev Server: `npm run dev`

## Project Structure
- `supabase/migrations/20260517_sync_tgl_serah_terima.sql` — **[NEW]** Migration defining the bidirectional PostgreSQL triggers.
- `src/utils/financeUtils.js` — Finance calculation logic.
- `src/pages/DataWarga.jsx` — UI for resident creation/edit.
- `src/pages/ManageBlocks.jsx` — UI for block creation/edit.
- `src/pages/Billing/ResidentFees.jsx` — UI for resident fees monitoring.
- `src/pages/Billing/ResidentFees.test.js` — Unit tests for fee calculations.

## Code Style
- Use standard SQL trigger definition patterns.
- Keep trigger updates selective (using `IS DISTINCT FROM`) to eliminate infinite recursion.
- Use Chakra UI v3 style props for any frontend modifications (no Tailwind classes).

## Testing Strategy
- Verify that both `blok` and `warga` updates cascade the `tgl_serah_terima` successfully.
- Verify through Vitest that `calculateFinance` correctly respects block-level fallback dates if resident-level dates are absent.

## Boundaries
- **Always**: Keep `IS DISTINCT FROM` checking in PostgreSQL triggers to prevent infinite recursive firing.
- **Ask first**: Making any schema/column structural modifications.
- **Never**: Create a situation where `tgl_serah_terima` values mismatch between a resident and their associated unit/block.

## Success Criteria
1. **Bidirectional DB Sync**: When `tgl_serah_terima` is modified on a `blok`, it cascades to all `warga` linked to that `blok_id`.
2. **Reverse Sync**: When `tgl_serah_terima` is modified on a `warga`, it propagates to the associated `blok`.
3. **Onboarding Inheritance**: When a new `warga` is created and linked to a `blok_id`, it inherits the `blok`'s `tgl_serah_terima` if not explicitly provided. If it is provided, it updates the `blok`'s `tgl_serah_terima`.
4. **Calculations Alignment**: The underpayment/outstanding dues ("kurang") is calculated consistently in `calculateFinance` and backend queries based on this unified date.
5. **No Recalculation Loops**: Update operations do not cause recursive trigger loops or performance issues.
6. **Tests Pass**: Unit tests run and pass perfectly.

## Open Questions / Review Needed
- Currently, if there are multiple residents linked to a single block, they will all share the same handover date. This is the correct behavior because a single unit has a single handover date that serves as the start of the unit's financial obligations.
