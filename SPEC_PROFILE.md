# Spec: Profile Management System

## Objective
Membangun halaman profil terpusat di mana pengguna (Super Admin, Admin, dan Warga) dapat mengelola informasi pribadi mereka. Ini bertujuan untuk meningkatkan personalisasi dan memastikan data kontak pengurus/warga selalu mutakhir.

## User Stories
- Sebagai pengguna, saya ingin melihat informasi profil saya saat ini.
- Sebagai pengguna, saya ingin mengubah nama lengkap saya.
- Sebagai pengguna, saya ingin memperbarui nomor HP saya agar mudah dihubungi.
- Sebagai pengguna, saya ingin mengunggah foto profil baru untuk personalisasi.
- Sebagai pengguna, saya ingin melihat role dan status hunian saya (read-only).

## Tech Stack
- **Frontend**: React + Vite + Chakra UI v3
- **Icons**: Lucide React
- **Backend**: Supabase Auth & Database (PostgreSQL)
- **Storage**: Supabase Storage (Bucket: `avatars`)

## UI/UX Design (Flup Style)
- **Layout**: Centered card dengan header profil yang modern.
- **Components**:
    - `Avatar` besar dengan tombol "Edit" (upload).
    - `InputGroup` untuk Nama, Email, dan No HP.
    - `Badge` untuk menampilkan Role (Super Admin/Admin/Resident).
    - `Toast` untuk feedback sukses/gagal.

## Database Changes
- Memastikan tabel `warga` memiliki kolom: `nama`, `no_hp`, `email`, `avatar_url`.
- Setup Bucket di Supabase Storage: `avatars` (Public access untuk read).

## Success Criteria
- [ ] Pengguna bisa melihat data profil mereka saat masuk ke halaman `/profile`.
- [ ] Klik tombol "Simpan" berhasil memperbarui data di tabel `warga`.
- [ ] Mengunggah foto baru berhasil mengganti file di Supabase Storage dan memperbarui `avatar_url`.
- [ ] Perubahan nama langsung tercermin di Sidebar/Header (real-time via AuthContext).

## Boundaries
- **Always**: Validasi ukuran file gambar (max 2MB) dan format (JPG/PNG).
- **Ask first**: Jika ingin menambahkan fitur "Ganti Password" di halaman yang sama.
- **Never**: Mengizinkan pengguna mengubah Role atau Blok mereka sendiri (harus via Admin).
