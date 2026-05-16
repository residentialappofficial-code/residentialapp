-- 🛠️ DATABASE FIX: Menghubungkan tabel Warga dan Profiles secara resmi
-- Jalankan ini agar kueri join bisa berjalan lancar

-- 1. Tambahkan Foreign Key dari warga ke profiles
-- Kita gunakan user_id di tabel warga untuk merujuk ke id di tabel profiles
ALTER TABLE public.warga
ADD CONSTRAINT fk_warga_profile
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 2. Pastikan tabel keluhan juga bisa merujuk ke profiles dengan aman
-- (Sudah ada di skema, tapi kita pastikan ulang jika ada yang belum terindeks)
CREATE INDEX IF NOT EXISTS idx_keluhan_warga_id ON public.keluhan(warga_id);

-- Segarkan cache skema
NOTIFY pgrst, 'reload schema';
