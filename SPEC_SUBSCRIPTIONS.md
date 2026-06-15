# Spec: Sistem Berlangganan (SaaS Subscription) untuk Perumahan

## 1. Objective
Mengembangkan sistem monetisasi (SaaS) di mana setiap Perumahan (Tenant) harus membayar biaya langganan bulanan/tahunan untuk menggunakan platform Habitix. Super Admin dapat memantau status langganan semua perumahan.

---

## 2. Pilihan Paket & Tarif (Pricing Model)
Platform Habitix mengenakan biaya flat per perumahan (bukan berdasarkan jumlah unit/warga) untuk mempermudah operasional tahap awal.
Tersedia dua tipe paket langganan:
1. **Paket Bulanan:** Rp 150.000 / bulan (berlaku selama 30 hari).
2. **Paket Tahunan:** Rp 1.500.000 / tahun (berlaku selama 365 hari - hemat 2 bulan).

Setiap perumahan baru secara otomatis mendapatkan masa uji coba gratis (**Trial**) selama 30 hari terhitung sejak pendaftaran perumahan baru oleh Super Admin atau pendaftaran mandiri.

---

## 3. Database Schema Changes
Perubahan database dilakukan dengan memodifikasi tabel `perumahan` untuk menyimpan status langganan.

### Modifikasi Tabel `public.perumahan`
Tambahkan kolom baru:
- `subscription_status` TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'expired'))
- `subscription_plan` TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'monthly', 'yearly'))
- `subscription_valid_until` TIMESTAMPTZ DEFAULT (now() + interval '30 days')

---

## 4. Alur Pembayaran & Aktivasi (Billing Flow)
Pembayaran dilakukan secara manual oleh Admin Perumahan melalui antarmuka khusus di panel Admin.

### Langkah Pembayaran:
1. **Checkout:** Admin Perumahan membuka menu **Langganan**, memilih paket (Bulanan/Tahunan), dan menekan tombol **Bayar Sekarang**.
2. **Pakasir QRIS:** Sistem menghasilkan order ID berformat `SUB_PERUMAHANID_TIMESTAMP` dan mengarahkan Admin ke halaman pembayaran QRIS Pakasir menggunakan credentials global platform (milik Super Admin).
3. **Webhook Callback:** 
   - Webhook callback masuk ke `/api/webhooks/pakasir`.
   - Di dalam file `functions/api/webhooks/pakasir.js`, jika `order_id` berawalan `SUB_`, maka request diarahkan ke handler berlangganan.
   - Handler memperpanjang `subscription_valid_until` (menambah 30 hari untuk bulanan atau 365 hari untuk tahunan), memperbarui `subscription_status` menjadi `'active'`, dan mengubah `subscription_plan` sesuai dengan pilihan paket.
   - Mencatat transaksi ke tabel riwayat langganan (baru: `platform_subscription_payments` jika dibutuhkan untuk audit, atau dicatat langsung di database global).

---

## 5. Konsekuensi Langganan Habis (Restricted Access)
Jika masa berlaku langganan telah terlewati (`subscription_valid_until < now()`):
1. **Soft Gating:** Admin dan Warga tetap bisa melakukan login ke platform Habitix.
2. **Restricted Overlay:** 
   - Di halaman Dashboard dan semua fitur fungsional lainnya, sistem akan menampilkan overlay/halaman penangguhan (**Suspended Screen**) yang menginformasikan bahwa langganan perumahan telah kedaluwarsa.
   - **Pengecualian Admin:** Admin Perumahan memiliki akses ke menu **Langganan & Pembayaran** agar dapat melakukan perpanjangan masa aktif. Fitur lainnya diblokir.
   - **Pengecualian Super Admin:** Akun dengan role `super_admin` sama sekali tidak terpengaruh oleh status pemblokiran perumahan apa pun dan tetap bisa melakukan navigasi penuh.

---

## 6. Project Structure
- `src/pages/Admin/Subscription.jsx` [NEW] → Menu khusus Admin untuk mengecek sisa hari aktif, riwayat transaksi, dan melakukan pembayaran perpanjangan.
- `src/pages/SuperAdmin/ManageSubscriptions.jsx` [NEW] → Dashboard Super Admin untuk melihat daftar perumahan, status langganan, sisa masa aktif, total pendapatan platform, serta opsi manual suspend/unsuspend.
- `functions/api/webhooks/pakasir.js` [MODIFY] → Update logic webhook untuk mendukung deteksi order ID berformat `SUB_`.
- `src/components/layout/AppSidebar.jsx` [MODIFY] → Menambahkan link menu "Langganan" untuk Admin/Super Admin dan menyembunyikannya dari Warga.
- `src/App.jsx` [MODIFY] → Mendaftarkan rute baru untuk Subscription dan menerapkan `SubscriptionGuard` pada rute-rute penting.

---

## 7. Testing Strategy
- **Unit Testing:** Menguji logika perpanjangan masa aktif (apakah bertambah tepat 30 hari / 365 hari dari `subscription_valid_until` yang ada atau dari `now()` jika sudah telanjur expired).
- **Integration Testing:** Simulasi callback webhook Pakasir dengan `order_id` berawalan `SUB_` untuk memastikan perubahan data di DB berjalan sukses.
- **Guard Testing:** Memastikan Admin dari perumahan expired hanya bisa membuka menu Subscription, warga melihat halaman terblokir, dan Super Admin bisa bypass.
