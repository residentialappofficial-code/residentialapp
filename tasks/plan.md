# Implementation Plan: Centralized Payments & Super Admin Payouts Dashboard (Pakasir)

## Objective
Integrate centralized QRIS payments via app.pakasir.com and implement a Super Admin Payouts Dashboard to monitor aggregate daily transactions, manage held/pending balances, deduct platform admin fees, and log disbursement events.

## Phase 1: Database Setup
*   **Task 1.1**: Create `disbursements` table in database.
*   **Task 1.2**: Add tracking and fee columns to `tagihan` (`payment_method`, `payment_ref`, `admin_fee`, `net_amount`, `disbursement_id`).
*   **Task 1.3**: Seed default platform Pakasir integration credentials (`slug: 'habitix'`, `api_key: 'cuTCvuY8btAUMyaBTtbUfW4gUe5qaxUJ'`) in `system_settings`.
*   **Checkpoint**: Database tables are successfully configured.

## Phase 2: Webhooks & Redirection
*   **Task 2.1**: Refactor Pakasir Webhook edge function to record transaction codes and net amounts on success.
*   **Task 2.2**: Integrate Pakasir QRIS redirect button in resident checkout popup in `MyBills.jsx`.
*   **Task 2.3**: Render inline checkout triggers for unpaid tagihan items in list rows.

## Phase 3: Payouts Console (Super Admin)
*   **Task 3.1**: Create `src/pages/SuperAdmin/Disbursements.jsx` dashboard.
*   **Task 3.2**: Add "Pencairan Dana" layout link in Super Admin sidebar nav.
*   **Task 3.3**: Register `/super-admin/disbursements` route.

---

## Verification Strategy
1. **Automated Verification**: Build project using `npm run build` and check lint rules using `npm run lint`.
2. **Checkout Redirection**: Confirm that resident checkout redirect routes to Pakasir checkout portal.
3. **Payout Generation**: Perform simulated payout to verify held balances are locked and disbursement files generated.
