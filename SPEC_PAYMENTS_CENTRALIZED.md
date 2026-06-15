# Spec: Centralized Multi-Tenant Payments & Super Admin Disbursement Dashboard (Pakasir integration)

## Objective
Implement arsitektur pembayaran terpusat (Opsi A) menggunakan gateway pembayaran Pakasir, lengkap dengan biaya admin platform per-transaksi/disbursement, dan Dashboard Super Admin untuk memonitor kas masuk harian per-perumahan, mendeteksi dana tertahan (*held funds*), serta mencatat status pencairan (*disbursement*) dana ke masing-masing rekening pengurus perumahan.

## Assumptions
1. Platform Habitix menggunakan **satu akun merchant utama di Pakasir** (API key & Slug global disimpan di `system_settings`).
2. Setiap transaksi yang sukses dipotong biaya admin platform (baik flat fee maupun percentage fee).
3. Super Admin memegang dana warga dan mencairkannya (*disburse*) secara berkala ke rekening masing-masing perumahan secara manual (lalu mencatatnya di dashboard) atau semi-otomatis.
4. Database yang digunakan adalah PostgreSQL (Supabase).

## Database Schema Changes

Kita perlu menambahkan tabel `disbursements` dan kolom tracking di tabel `tagihan`:

```sql
-- Create disbursements table
CREATE TABLE IF NOT EXISTS public.disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,          -- Jumlah bersih yang ditransfer ke perumahan
    admin_fee BIGINT NOT NULL,       -- Total potongan biaya admin platform
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disbursed')),
    reference_no TEXT,               -- Nomor referensi transfer bank
    created_at TIMESTAMPTZ DEFAULT now(),
    disbursed_at TIMESTAMPTZ
);

-- Add tracking columns to tagihan table
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Manual';
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS net_amount BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS disbursement_id UUID REFERENCES public.disbursements(id) ON DELETE SET NULL;

-- Enable RLS on disbursements
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin has full access to disbursements" 
    ON public.disbursements FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Tenant admin can view disbursements of their housing complex" 
    ON public.disbursements FOR SELECT USING (perumahan_id = public.get_user_perumahan_id());
```

## Dashboard Super Admin Features (UI & Screen)

Akan dibuat halaman baru `/super-admin/payments` (hanya bisa diakses oleh `super_admin`) yang menampilkan:

1. **Ringkasan Finansial Global (Stat Cards):**
   - **Total Dana Masuk:** Jumlah semua tagihan yang berstatus `Paid`.
   - **Total Dana Tertahan:** Jumlah tagihan `Paid` yang kolom `disbursement_id` nya masih `NULL`.
   - **Total Pendapatan Platform:** Akumulasi dari `admin_fee`.
   - **Total Dana Terdistribusi:** Jumlah dana bersih yang berstatus `Disbursed` di tabel `disbursements`.

2. **Daftar Log Transaksi Harian (Daily Payments Table):**
   - Menampilkan list warga yang membayar hari ini dari seluruh perumahan.
   - Kolom: Waktu, Perumahan, Nama Warga, Blok, Jumlah, Biaya Admin, Bersih, Status Disburse.

3. **Panel Rekap per Perumahan & Proses Disburse:**
   - Tabel ringkasan per perumahan yang menunjukkan saldo tertahan yang siap didisburse.
   - Tombol **"Proses Pencairan"** yang membuka modal untuk memasukkan bukti transfer bank (nomor referensi), menghitung otomatis total dana bersih, dan membuat record `disbursements` baru serta mengupdate semua tagihan terkait dengan link `disbursement_id`.

## Integration Flow (Pakasir Webhook)

Update `supabase/functions/pakasir-webhook/index.ts` untuk memproses perhitungan biaya admin dan bersih secara otomatis saat transaksi sukses:

```typescript
// Di dalam body webhook sukses:
const adminFeeConfig = 2000; // Contoh biaya flat Rp 2.000 per transaksi
const totalAmount = tagihan.jumlah;
const adminFee = adminFeeConfig;
const netAmount = totalAmount - adminFee;

await supabaseAdmin
  .from('tagihan')
  .update({ 
    status: 'Paid',
    payment_method: 'QRIS_PAKASIR',
    payment_ref: transaction_id,
    admin_fee: adminFee,
    net_amount: netAmount
  })
  .eq('id', order_id);
```

## Success Criteria
- Super Admin dapat memantau pendapatan harian dari seluruh tenant perumahan di satu tempat.
- Sistem secara akurat menghitung biaya admin platform dan dana bersih milik masing-masing tenant.
- Super Admin bisa memicu aksi "Disburse" untuk perumahan tertentu, mengunci tagihan yang dicairkan, dan mencatat nomor referensi bank.
- Hak akses terjaga (Admin perumahan biasa tidak bisa membuka dashboard ini, hanya bisa melihat rekap pencairan perumahan mereka sendiri).
