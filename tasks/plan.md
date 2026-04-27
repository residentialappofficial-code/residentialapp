# Implementation Plan: SimPerumahan Extended Modules (1-4)

## Objective
Mengimplementasikan empat modul baru (Keuangan, Komunikasi, Aset, Mutasi) dengan pendekatan vertikal (fitur per fitur) dan memastikan keamanan multi-tenancy di setiap lapisan.

## Phase 1: Database & Foundation
*   Update schema `public.warga` (tambah `luas_tanah`, `status_aktif`).
*   Buat tabel baru: `iuran_config`, `tagihan`, `pengumuman`, `keluhan`, `aset_komplek`, `peminjaman_aset`.
*   Terapkan RLS policies di setiap tabel baru.
*   Checkpoint: Skema database terverifikasi di Supabase.

## Phase 2: Modul 1 - Keuangan & Tagihan
*   **Task 1.1**: UI & Logic Konfigurasi Iuran (Flat vs m2).
*   **Task 1.2**: Logic Generate Tagihan Bulanan (Admin).
*   **Task 1.3**: Portal Tagihan Warga & Upload Bukti Bayar.
*   **Task 1.4**: UI Verifikasi Pembayaran (Admin).

## Phase 3: Modul 2 - Komunikasi & Laporan
*   **Task 2.1**: Broadcast Pengumuman (Admin) & View (Warga).
*   **Task 2.2**: Sistem Keluhan Warga (Input & Tracking Status).

## Phase 4: Modul 3 - Manajemen Aset (Peminjaman Alat)
*   **Task 3.1**: Inventaris Aset Komplek (CRUD Admin).
*   **Task 3.2**: Log Peminjaman Alat (Track Borrower & Date).

## Phase 5: Modul 4 - Mutasi & Offboarding
*   **Task 4.1**: Alur Mutasi Warga (Cek tunggakan & Nonaktifkan akun).

## Verification Strategy
*   Setiap fitur diuji dengan 2 akun berbeda (Admin & Warga) untuk memastikan isolasi data komplek.
*   Testing RLS: Pastikan Admin Komplek A tidak bisa melihat tagihan Komplek B.
