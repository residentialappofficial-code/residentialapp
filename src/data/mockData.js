export const dashboardStats = {
  totalWarga: 142,
  iuranBulanIni: "Rp 8.500.000",
  saldoKas: "Rp 24.350.000",
  totalPengurus: 6,
};

export const recentPayments = [
  { id: 1, warga: "Budi Santoso", blok: "A-12", jumlah: 150000, tanggal: "2026-03-20", status: "Lunas" },
  { id: 2, warga: "Siti Aminah", blok: "B-05", jumlah: 150000, tanggal: "2026-03-19", status: "Lunas" },
  { id: 3, warga: "Rahmat Wijaya", blok: "A-08", jumlah: 150000, tanggal: "2026-03-19", status: "Lunas" },
  { id: 4, warga: "Dewi Lestari", blok: "C-02", jumlah: 150000, tanggal: "2026-03-18", status: "Lunas" },
  { id: 5, warga: "Andi Saputra", blok: "B-10", jumlah: 150000, tanggal: "2026-03-17", status: "Lunas" },
];

export const dataWarga = [
  { id: 1, no: 1, nama: "Budi Santoso", blok: "A-12", noHp: "081234567890", statusHunian: "Pemilik", statusIuran: "Lunas" },
  { id: 2, no: 2, nama: "Siti Aminah", blok: "B-05", noHp: "081298765432", statusHunian: "Pemilik", statusIuran: "Lunas" },
  { id: 3, no: 3, nama: "Rahmat Wijaya", blok: "A-08", noHp: "085612345678", statusHunian: "Kontrak", statusIuran: "Belum Bayar" },
  { id: 4, no: 4, nama: "Dewi Lestari", blok: "C-02", noHp: "081345678901", statusHunian: "Pemilik", statusIuran: "Lunas" },
  { id: 5, no: 5, nama: "Andi Saputra", blok: "B-10", noHp: "085723456789", statusHunian: "Kontrak", statusIuran: "Lunas" },
];

export const dataPengurus = [
  { id: 1, nama: "Agus Prasetyo", jabatan: "Ketua Paguyuban", noHp: "08111222333", periode: "2025-2027" },
  { id: 2, nama: "Linda Sulistyowati", jabatan: "Sekretaris", noHp: "08122333444", periode: "2025-2027" },
  { id: 3, nama: "Hendra Gunawan", jabatan: "Bendahara", noHp: "08133444555", periode: "2025-2027" },
  { id: 4, nama: "Wawan Kurniawan", jabatan: "Seksi Keamanan", noHp: "08144555666", periode: "2025-2027" },
];

export const pembayaranIuran = [
  { id: 1, warga: "Budi Santoso", blok: "A-12", bulan: "Maret 2026", jumlah: 150000, tanggalBayar: "2026-03-20", status: "Lunas" },
  { id: 2, warga: "Siti Aminah", blok: "B-05", bulan: "Maret 2026", jumlah: 150000, tanggalBayar: "2026-03-19", status: "Lunas" },
  { id: 3, warga: "Rahmat Wijaya", blok: "A-08", bulan: "Maret 2026", jumlah: 150000, tanggalBayar: "-", status: "Belum Bayar" },
  { id: 4, warga: "Dewi Lestari", blok: "C-02", bulan: "Maret 2026", jumlah: 150000, tanggalBayar: "2026-03-18", status: "Lunas" },
];

export const arusKas = [
  { id: 1, tanggal: "2026-03-20", keterangan: "Iuran Warga Budi Santoso (A-12)", kategori: "Pemasukan", jumlah: 150000, saldo: 24350000 },
  { id: 2, tanggal: "2026-03-19", keterangan: "Iuran Warga Siti Aminah (B-05)", kategori: "Pemasukan", jumlah: 150000, saldo: 24200000 },
  { id: 3, tanggal: "2026-03-15", keterangan: "Pembayaran Listrik Fasum", kategori: "Pengeluaran", jumlah: 850000, saldo: 24050000 },
  { id: 4, tanggal: "2026-03-10", keterangan: "Perbaikan Gapura Utama", kategori: "Pengeluaran", jumlah: 2500000, saldo: 24900000 },
];

export const penggajian = [
  { id: 1, namaPegawai: "Supriadi", jabatan: "Satpam Shift Siang", gajiPokok: 2500000, tunjangan: 300000, potongan: 0, gajiBersih: 2800000 },
  { id: 2, namaPegawai: "Joko Anwar", jabatan: "Satpam Shift Malam", gajiPokok: 2500000, tunjangan: 400000, potongan: 0, gajiBersih: 2900000 },
  { id: 3, namaPegawai: "Mamat", jabatan: "Tukang Kebun / Sampah", gajiPokok: 2000000, tunjangan: 150000, potongan: 50000, gajiBersih: 2100000 },
];

export const forumPosts = [
  { id: 1, author: "Agus Prasetyo", avatar: "A", time: "2 jam yang lalu", content: "Yth. Bapak/Ibu Warga, mengingatkan kembali untuk kegiatan kerja bakti pembersihan gorong-gorong akan dilaksanakan hari Minggu pagi jam 07.00. Mohon partisipasinya.", category: "Pengumuman", replies: 5 },
  { id: 2, author: "Budi Santoso", avatar: "B", time: "5 jam yang lalu", content: "Lapor Pak RT, lampu jalan di depan Blok A-12 mati sejak semalam. Mohon dibantu untuk koordinasi perbaikan. Terima kasih.", category: "Laporan", replies: 2 },
  { id: 3, author: "Siti Aminah", avatar: "S", time: "1 hari yang lalu", content: "Ibu-ibu, jangan lupa jadwal arisan RT bulan ini di rumah saya ya, hari Sabtu jam 4 sore.", category: "Diskusi", replies: 8 },
];
