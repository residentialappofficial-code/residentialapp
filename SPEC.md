# Spec: Peningkatan Fitur Habitix v3.1 (5 Pilar Ekspansi)

## Objective
Mengembangkan 5 fitur besar lanjutan untuk membawa aplikasi `sim_perumahan` (Habitix) menjadi sistem manajemen yang lebih matang, serba otomatis, dapat dipertanggungjawabkan (akuntabel), dan sangat *user-friendly* bagi Warga maupun Admin.

Kelima fitur tersebut adalah:
1. **Otomatisasi Tagihan & Notifikasi:** Penggunaan *scheduler* (Edge Functions/Cron) untuk menghasilkan tagihan bulanan otomatis & notifikasi WhatsApp/Email.
2. **Laporan Finansial:** Fitur cetak/ekspor PDF & Excel untuk Arus Kas dan Tagihan.
3. **Sistem Audit Trail:** Log aktivitas sistem yang transparan bagi Superadmin (mencatat Siapa, Melakukan Apa, Kapan).
4. **Peningkatan Fitur Warga (*Self-Service*):** UI riwayat tagihan warga yang diperjelas & sistem tiket/QR Code untuk peminjaman aset.
5. **Webhook Pakasir *Full Auto*:** Integrasi *realtime* API di mana pembayaran sukses via Pakasir langsung mengubah status tagihan menjadi `Paid` di Supabase tanpa intervensi manusia.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS
- Backend/Database: Supabase (PostgreSQL)
- Serverless Functions: Supabase Edge Functions (Deno) untuk Webhook dan Cron Jobs.
- Export Libraries: `jspdf` (PDF), `xlsx` atau CSV generator sederhana.

## Commands
- Build Frontend: `npm run build`
- Dev Frontend: `npm run dev`
- Supabase Functions (Lokal): `npx supabase functions serve`
- Supabase Deploy Functions: `npx supabase functions deploy <function_name>`

## Project Structure
- `src/pages/ArusKas.jsx` & `src/pages/Billing/*` → UI untuk Ekspor Laporan.
- `src/pages/warga/Dashboard.jsx` & `MyBills.jsx` → Peningkatan UI warga.
- `src/pages/SuperAdmin/AuditLogs.jsx` (Baru) → Halaman tabel Audit Trail.
- `supabase/functions/pakasir-webhook/` (Baru) → Edge function untuk menerima HTTP POST dari Pakasir.
- `supabase/functions/billing-cron/` (Baru) → Edge function yang jalan tanggal 1 setiap bulan.
- `supabase/migrations/*` → Migrasi SQL untuk tabel `audit_logs` dan trigger-triggernya.

## Code Style
- Memanfaatkan Supabase Edge Functions menggunakan TypeScript & standar Deno.
- Komponen diekstraksi ke modul kecil agar UI/UX tetap *maintainable*.
- Menggunakan `try-catch` solid untuk semua *network request*, khususnya pada Edge Functions yang bersifat publik.

## Testing Strategy
- **Webhook Testing**: Menggunakan *tool* seperti Ngrok / Postman untuk mengirim *dummy payload* ke lokal URL Edge Function demi memverifikasi status ter-update menjadi `Paid`.
- **Cron Testing**: Menguji logika *billing generator* (men-generate tagihan untuk semua warga) melalui *direct invocation* sebelum dijadwalkan otomatis di server.
- **Export Verification**: Memastikan dokumen Excel dan PDF bisa diunduh dan datanya tidak *corrupt*.

## Boundaries
- **Always**:
  - Validasi *Header/Signature* (Secret Key) dari setiap *request* Webhook yang masuk demi menghindari serangan *forged requests*.
  - Catat kegagalan sinkronisasi (seperti gagal kirim notifikasi) di *error log* tanpa menghentikan *core logic* pembayaran.
- **Ask first**:
  - Pustaka *library* pembuatan PDF/Excel mana yang disetujui (mengingat bundle size).
  - Apakah Notifikasi WA akan menggunakan penyedia API berbayar (seperti Twilio, Fonnte, Watzap) atau via SMTP Email biasa?
- **Never**:
  - Menyimpan *API Key* atau rahasia Webhook di *frontend* (React). Seluruh logika sensitif wajib berada di Supabase Edge Functions / Database.

## Success Criteria
1. Terdapat *endpoint* publik di Supabase yang siap menerima *payload* sukses dari Pakasir dan seketika mencoret tagihan warga menjadi Lunas.
2. Setiap tanggal 1, baris tagihan baru muncul di database secara magis tanpa admin menekan tombol apa pun.
3. Superadmin dapat membaca tabel `audit_logs` dan melihat sejarah kapan seorang Admin menghapus data warga atau mengubah saldo.
4. Laporan Excel / PDF siap dicetak dengan menekan 1 tombol di halaman Arus Kas.

---

## Open Questions (Pertanyaan untuk Anda):
Untuk memuluskan eksekusi rencana masif ini, saya perlu beberapa keputusan dari Anda:
1. **Prioritas Eksekusi**: Dari 5 fitur di atas, mana yang ingin kita kerjakan **pertama kali** di sesi ini? (Sangat disarankan mulai dari Webhook Pakasir atau Laporan Finansial).
2. **Provider Notifikasi**: Jika otomatisasi *reminder* dan WhatsApp notifikasi dikerjakan, Anda sudah punya *provider* pihak ketiga (contoh: Fonnte / Watzap API)? Atau cukup kita kirim via Email standar bawaan Supabase?
3. **Format Export**: Apakah Anda punya referensi struktur kolom spesifik untuk PDF/Excel-nya? Ataukah cukup tabel mentah sesuai tampilan layar Arus Kas?
