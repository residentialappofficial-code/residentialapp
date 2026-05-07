# Specification: SimPerumahan - Extended Modules (1-4)

## 1. Objective
Membangun empat modul inti tambahan untuk melengkapi fungsionalitas manajemen perumahan: Keuangan (Iuran), Komunikasi (Pengumuman & Keluhan), Manajemen Aset (Peminjaman Alat), dan Mutasi Warga (Offboarding).

## 2. Core Modules & Features

### Modul 1: Keuangan & Tagihan (Billing)
*   **Iuran Config**: Admin Komplek dapat mengatur skema iuran (Flat Fee atau Per m2).
*   **Monthly Generation**: Fitur "Generate Tagihan" setiap bulan berdasarkan skema yang dipilih.
*   **Resident Portal**: Warga melihat daftar tagihan dan mengunggah bukti pembayaran (Upload Receipt).
*   **Admin Verification**: Admin memverifikasi bukti pembayaran untuk mengubah status menjadi 'Lunas'.

### Modul 2: Komunikasi & Laporan (Communication)
*   **Official Announcements**: Admin mengirim pengumuman yang muncul di dashboard warga.
*   **Citizen Complaints**: Warga melaporkan keluhan (Kategori: Keamanan, Kebersihan, dll) dan melacak statusnya (Open, In Progress, Resolved).
*   **Document Repository**: Penyimpanan file publik (Peraturan, Laporan Bulanan).

### Modul 3: Manajemen Aset & Keamanan (Asset Tracking)
*   **Asset Inventory**: Daftar alat milik komplek (Genset, Tenda, Kursi, Mesin Rumput, dll).
*   **Lending System**: Mencatat peminjaman alat oleh warga (Siapa, Alat Apa, Tanggal Pinjam/Kembali).
*   **Security Log**: (Opsional/Dasar) Pencatatan tamu sederhana.

### Modul 4: Mutasi & Offboarding
*   **Resident Mutation**: Fitur untuk menonaktifkan warga yang pindah (Checklist tunggakan iuran sebelum keluar).

## 3. Database Schema (Supabase)

### New Tables & Column Updates:
*   **Update `public.warga`**: Tambah kolom `luas_tanah` (numeric), `status_aktif` (boolean).
*   **`public.iuran_config`**: `perumahan_id`, `tipe` (flat/m2), `tarif_dasar`.
*   **`public.tagihan`**: `warga_id`, `bulan`, `tahun`, `jumlah`, `status` (Unpaid, Pending, Paid), `bukti_bayar_url`.
*   **`public.pengumuman`**: `perumahan_id`, `judul`, `konten`, `kategori`, `created_at`.
*   **`public.keluhan`**: `warga_id`, `perumahan_id`, `kategori`, `deskripsi`, `foto_url`, `status`.
*   **`public.aset_komplek`**: `perumahan_id`, `nama_alat`, `kondisi`, `status_tersedia`.
*   **`public.peminjaman_aset`**: `aset_id`, `warga_id`, `tgl_pinjam`, `tgl_kembali`, `status`.

## 4. Project Structure
```text
src/
├── pages/
│   ├── Billing/           # Modul 1
│   │   ├── IuranConfig.jsx
│   │   ├── TagihanWarga.jsx
│   │   └── VerifikasiPembayaran.jsx
│   ├── Communication/     # Modul 2
│   │   ├── Announcements.jsx
│   │   └── Complaints.jsx
│   ├── Assets/            # Modul 3
│   │   └── AssetTracking.jsx
│   └── Residents/         # Modul 4 (Update existing)
│       └── Mutation.jsx
└── components/
    └── ui/                # Shared UI Components
```

## 5. Code Style & Tech Stack
*   **Frontend**: React + Vite
*   **Styling**: Chakra UI v3 + Tailwind CSS with a **Premium Black & White Theme** (Slate-950/Black accents, clean white backgrounds, and slate grays for text/borders).
*   **Backend/DB**: Supabase (Auth, Store, Postgres).
*   **State Management**: React Context (AuthContext).
*   **Security**: RLS (Row Level Security) wajib di setiap tabel baru menggunakan `perumahan_id`.

## 6. Boundaries & Constraints
*   **Always**: Gunakan `perumahan_id` untuk setiap query data agar tidak bocor antar komplek.
*   **Ask First**: Sebelum menambahkan integrasi Payment Gateway (pihak ketiga) jika diperlukan di masa depan.
*   **Never**: Menyimpan password atau data sensitif di tabel profil (gunakan Supabase Auth).

### UI & UX Standards
#### Design Aesthetic
*   **Theme**: Premium Black & White (High contrast).
*   **Rounding**: Standard rounding reduced for a sharper, modern feel (approx 1/3 of previous values).
    *   **Major Containers (Cards, Modals)**: `rounded-2xl` (1rem / 16px).
    *   **Buttons & Inputs**: `rounded-xl` (0.75rem / 12px) or `rounded-lg` (0.5rem / 8px).
*   **Typography**: Inter or similar clean sans-serif.

#### Sidebar Organization
Menu pada sidebar harus dikelompokkan secara visual untuk membedakan fitur khusus Resident dan Admin:
*   **Resident Section**: Dashboard, Tagihan Saya, Lapor Keluhan, Pinjam Alat.
*   **Admin Section**: Manajemen Warga, Verifikasi Pembayaran, Konfigurasi Iuran, Kelola Pengumuman, Inventaris Aset.

#### Security & Validation
*   **Password Format**: Minimum 8 karakter, 1 huruf besar, 1 angka.
*   **Visual Feedback**: Implementasikan Password Strength Indicator.
*   **Security**: Toggle Show/Hide password di semua input password.
