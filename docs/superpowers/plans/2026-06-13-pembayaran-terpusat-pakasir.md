# Centralized Multi-Tenant Payments & Super Admin Disbursement Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement centralized QRIS payments via app.pakasir.com integration and a Super Admin Disbursement Dashboard to track daily payouts, pending/held funds, and admin fees.

**Architecture:** Route all tenant payments through a master platform Pakasir account using transaction tracking IDs. Group paid tagihan into disbursement batches with platform-deducted admin fees, and manage status through a centralized Super Admin console.

**Tech Stack:** React 19, Supabase JS, PostgreSQL, Chakra UI v3, Lucide icons.

---

## Task 1: Database Schema Migration

**Files:**
- Create: `supabase/migrations/20260613_centralized_payments.sql`

- [ ] **Step 1: Write database schema migration**

Write the following SQL code inside `supabase/migrations/20260613_centralized_payments.sql`:

```sql
-- 1. Create disbursements table
CREATE TABLE IF NOT EXISTS public.disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,          -- Net cash payout amount transferred to perumahan bank
    admin_fee BIGINT NOT NULL,       -- Admin fee cut by platform during payout
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disbursed')),
    reference_no TEXT,               -- Payout bank transfer receipt number
    created_at TIMESTAMPTZ DEFAULT now(),
    disbursed_at TIMESTAMPTZ
);

-- 2. Add tracking and admin fee columns to tagihan
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Manual';
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS net_amount BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS disbursement_id UUID REFERENCES public.disbursements(id) ON DELETE SET NULL;

-- 3. Enable RLS on disbursements
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for disbursements
DROP POLICY IF EXISTS "Super admin full access disbursements" ON public.disbursements;
CREATE POLICY "Super admin full access disbursements" ON public.disbursements 
    FOR ALL USING (public.get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Tenant read disbursements" ON public.disbursements;
CREATE POLICY "Tenant read disbursements" ON public.disbursements 
    FOR SELECT USING (
        perumahan_id = public.get_user_perumahan_id() OR
        public.get_user_role() = 'super_admin'
      );

-- 5. Seed default Pakasir API Config in system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('pakasir_slug', 'habitix', 'Slug for Pakasir integration (Global)'),
    ('pakasir_api_key', 'cuTCvuY8btAUMyaBTtbUfW4gUe5qaxUJ', 'API Key for Pakasir integration (Global)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

- [ ] **Step 2: Execute SQL schema migration on database**

Run: `npx supabase db execute --file supabase/migrations/20260613_centralized_payments.sql` (or apply manually via Supabase SQL Editor if CLI is offline).
Expected: Migration executes successfully.

---

## Task 2: Pakasir Webhook & Payment Redirection

**Files:**
- Modify: `supabase/functions/pakasir-webhook/index.ts`
- Modify: `src/pages/warga/MyBills.jsx`

- [ ] **Step 1: Update Pakasir Webhook Edge Function**

Modify `supabase/functions/pakasir-webhook/index.ts` around lines 21-55 to update incoming payments metadata and cash flow record fields.

```typescript
    const { order_id, status, gross_amount, signature_key } = payload;
    
    // Hanya proses jika pembayaran sukses / settlement
    if (status === 'settlement' || status === 'capture') {
      
      // Update tagihan with transaction details
      const { data: tagihan, error: tagihanError } = await supabaseAdmin
        .from('tagihan')
        .update({ 
          status: 'Paid',
          payment_method: 'QRIS_PAKASIR',
          payment_ref: signature_key || 'PAKASIR_WEBHOOK',
          net_amount: parseInt(gross_amount) || 0
        })
        .eq('id', order_id)
        .select('*')
        .single();
        
      if (tagihanError || !tagihan) {
        throw new Error("Tagihan tidak ditemukan atau gagal diupdate");
      }

      // Record ke arus_kas otomatis
      const { error: kasError } = await supabaseAdmin
        .from('arus_kas')
        .insert([{
          perumahan_id: tagihan.perumahan_id,
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: `Auto-Payment QRIS (Pakasir): Tagihan ${tagihan.bulan}/${tagihan.tahun} Unit ${tagihan.warga_id}`,
          jumlah: tagihan.jumlah,
          kategori: 'Pemasukan'
        }]);
```

- [ ] **Step 2: Deploy / Save edge function**

Save the function locally and deploy if CLI is active.

- [ ] **Step 3: Integrate Pakasir QRIS redirect checkout in resident MyBills.jsx**

Modify `src/pages/warga/MyBills.jsx` to render an automated "Bayar via QRIS (Pakasir)" button:
- When clicked, check if it's already an active tagihan. If so, redirect the window to:
  `https://app.pakasir.com/pay/habitix/${bill.jumlah}?order_id=${bill.id}&qris_only=1&redirect=${encodeURIComponent(window.location.origin + '/warga/bills')}`

---

## Task 3: Super Admin Disbursement Dashboard UI

**Files:**
- Create: `src/pages/SuperAdmin/Disbursements.jsx`
- Modify: `src/components/layout/AppSidebar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create Disbursements.jsx super admin dashboard page**

Create a clean and visually appealing screen at `src/pages/SuperAdmin/Disbursements.jsx` featuring:
- **Finance summaries:** Total Collected, Held/Pending Payouts, Admin Fees Earned, Disbursed Funds.
- **Table of daily payments:** Shows who paid what today, with block info and perumahan name.
- **Complexes payout tracker:** Group of perumahan complexes showing their total pending balance and a "Proses Pencairan" action.
- **Modal to process payout:** Prompts Super Admin for admin fee deduction and bank transfer reference number. Inserts a new record in `disbursements` and links all `Paid` tagihan for that complex to the new `disbursement_id`.

- [ ] **Step 2: Add navigation to Sidebar**

Modify `src/components/layout/AppSidebar.jsx` to render a new "Pencairan Dana" link under the Super Admin sidebar navigation links block.

- [ ] **Step 3: Register route in App.jsx**

Modify `src/App.jsx` to import and register the `/super-admin/disbursements` route protected under the super admin role wrapper block.

---

## Verification Plan

### Automated Tests
- Run test linter check: `npm run lint`
- Run build bundle package: `npm run build`

### Manual Verification
- Log in as Warga, click "Bayar via QRIS (Pakasir)" for a bill, confirm it redirects successfully to `app.pakasir.com` checkout page.
- Test webhook response by sending mock JSON settlement request to edge function, verify `tagihan` updates status to `Paid` and updates `net_amount`.
- Log in as Super Admin, verify dashboard `/super-admin/disbursements` loads balances correctly and records payouts.
