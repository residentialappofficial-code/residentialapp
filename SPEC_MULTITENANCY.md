# Spec: Multi-Tenancy & Complex Management

## Objective
Mengubah SimPerumahan menjadi platform multi-tenancy di mana satu Super Admin dapat mengelola banyak komplek perumahan, memantau admin mereka, dan mengelola status langganan.

## Hierarchy & Roles
1. **Super Admin**: 
   - Akses ke menu "Manajemen Komplek".
   - Bisa berpindah antar data komplek via Sidebar Switcher.
   - Mengelola tagihan/langganan tiap komplek.
2. **Admin Komplek**:
   - Hanya bisa mengelola data (Warga, Iuran, Kas) di kompleknya sendiri.
   - Tidak bisa melihat data komplek lain.
3. **Warga**:
   - Hanya bisa melihat data/forum di komplek tempat tinggalnya.

## Core Features
### 1. Complex Switcher (Sidebar)
- Dropdown di bagian atas sidebar (khusus Super Admin) untuk memilih komplek aktif.
- State `selectedPerumahanId` akan disimpan di `AuthContext`.

### 2. Manajemen Komplek (Halaman Baru)
- Tabel daftar perumahan yang terdaftar.
- Fitur "Tambah Komplek Baru".
- Fitur "Assign Admin" untuk komplek tersebut.
- Status Langganan (Badge: Active, Expired, Warning).

### 3. Data Filtering Logic
- Semua query di halaman (DataWarga, Iuran, Kas, Penggajian) harus secara otomatis difilter berdasarkan `selectedPerumahanId`.

## Database Schema Changes
- **Tabel `perumahan`**: Tambah kolom `subscription_status`, `expiry_date`.
- **Tabel `warga`**: Memastikan integritas `perumahan_id` dan `role`.

## Success Criteria
- [ ] Super Admin bisa melihat daftar semua komplek.
- [ ] Super Admin bisa berpindah dari Perumahan A ke Perumahan B via Sidebar, dan data di Dashboard otomatis berubah.
- [ ] Admin Komplek tidak melihat dropdown switcher (hanya melihat nama kompleknya sendiri).
- [ ] Fitur CRUD di setiap komplek berjalan secara independen.
