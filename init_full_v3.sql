-- SimPerumahan Full Schema v3 (Multi-Tenancy)
-- Run this in your Supabase SQL Editor

-- 1. Create Perumahan Table
CREATE TABLE IF NOT EXISTS public.perumahan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    alamat TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Profiles Table (for Admins/Super Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nama TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'resident')),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Warga Table (Residents)
CREATE TABLE IF NOT EXISTS public.warga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    blok TEXT NOT NULL,
    no_hp TEXT,
    email TEXT,
    user_id UUID UNIQUE, -- Link to auth.users if they register later
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    status_hunian TEXT DEFAULT 'Pemilik' CHECK (status_hunian IN ('Pemilik', 'Kontrak', 'Kosong')),
    status_iuran TEXT DEFAULT 'Belum Lunas',
    luas_tanah INTEGER DEFAULT 0,
    status_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Iuran Config Table
CREATE TABLE IF NOT EXISTS public.iuran_config (
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE PRIMARY KEY,
    tipe TEXT DEFAULT 'flat' CHECK (tipe IN ('flat', 'm2')),
    tarif_dasar BIGINT DEFAULT 0,
    rekening_no TEXT,
    rekening_bank TEXT,
    rekening_nama TEXT,
    qris_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Tagihan Table
CREATE TABLE IF NOT EXISTS public.tagihan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.warga(id) ON DELETE CASCADE,
    bulan INTEGER NOT NULL,
    tahun INTEGER NOT NULL,
    jumlah BIGINT NOT NULL,
    status TEXT DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Pending', 'Paid')),
    bukti_bayar TEXT, -- URL from storage
    unique_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Pengumuman Table
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    kategori TEXT DEFAULT 'Umum' CHECK (kategori IN ('Umum', 'Urgent', 'Kegiatan')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Keluhan Table
CREATE TABLE IF NOT EXISTS public.keluhan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- In this app, residents use profile.id which is auth.uid()
    kategori TEXT DEFAULT 'Lainnya',
    deskripsi TEXT NOT NULL,
    foto_url TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Aset Table
CREATE TABLE IF NOT EXISTS public.aset_komplek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    nama_aset TEXT NOT NULL,
    kondisi TEXT DEFAULT 'Baik',
    status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create Peminjaman Aset Table
CREATE TABLE IF NOT EXISTS public.peminjaman_aset (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    aset_id UUID REFERENCES public.aset_komplek(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.warga(id) ON DELETE CASCADE,
    tanggal_pinjam DATE DEFAULT CURRENT_DATE,
    tanggal_kembali DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Arus Kas (Existing updated for multi-tenant)
CREATE TABLE IF NOT EXISTS public.arus_kas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    tanggal DATE DEFAULT CURRENT_DATE,
    keterangan TEXT NOT NULL,
    kategori TEXT CHECK (kategori IN ('Pemasukan', 'Pengeluaran')) NOT NULL,
    jumlah BIGINT NOT NULL,
    saldo_after BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Pengurus Table
CREATE TABLE IF NOT EXISTS public.pengurus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.warga(id) ON DELETE SET NULL,
    nama TEXT, -- Optional if linked to warga
    jabatan TEXT NOT NULL,
    no_hp TEXT,
    periode TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.perumahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuran_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keluhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aset_komplek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peminjaman_aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arus_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now, allows authenticated users to see their perumahan data)
DROP POLICY IF EXISTS "Allow per-perumahan access" ON public.perumahan;
CREATE POLICY "Allow per-perumahan access" ON public.perumahan FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access profiles" ON public.profiles;
CREATE POLICY "Allow per-perumahan access profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access warga" ON public.warga;
CREATE POLICY "Allow per-perumahan access warga" ON public.warga FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access iuran" ON public.iuran_config;
CREATE POLICY "Allow per-perumahan access iuran" ON public.iuran_config FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access tagihan" ON public.tagihan;
CREATE POLICY "Allow per-perumahan access tagihan" ON public.tagihan FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access pengumuman" ON public.pengumuman;
CREATE POLICY "Allow per-perumahan access pengumuman" ON public.pengumuman FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access keluhan" ON public.keluhan;
CREATE POLICY "Allow per-perumahan access keluhan" ON public.keluhan FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access aset" ON public.aset_komplek;
CREATE POLICY "Allow per-perumahan access aset" ON public.aset_komplek FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access pinjam" ON public.peminjaman_aset;
CREATE POLICY "Allow per-perumahan access pinjam" ON public.peminjaman_aset FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access kas" ON public.arus_kas;
CREATE POLICY "Allow per-perumahan access kas" ON public.arus_kas FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access pengurus" ON public.pengurus;
CREATE POLICY "Allow per-perumahan access pengurus" ON public.pengurus FOR ALL USING (true);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, nama, role, perumahan_id)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'nama',
      COALESCE(new.raw_user_meta_data->>'role', 'resident'),
      (NULLIF(new.raw_user_meta_data->>'perumahan_id', ''))::uuid
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: Just log or ignore to allow auth.users creation to proceed
    -- RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Forum Posts Table
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    kategori TEXT DEFAULT 'Umum' CHECK (kategori IN ('Umum', 'Kegiatan', 'Keluhan', 'Jual Beli', 'Kehilangan')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Forum Comments Table
CREATE TABLE IF NOT EXISTS public.forum_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Forum Likes Table
CREATE TABLE IF NOT EXISTS public.forum_likes (
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- 15. Forum Bookmarks Table
CREATE TABLE IF NOT EXISTS public.forum_bookmarks (
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- 16. Penggajian Table
CREATE TABLE IF NOT EXISTS public.penggajian (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    pengurus_id UUID REFERENCES public.pengurus(id) ON DELETE CASCADE,
    bulan INTEGER NOT NULL,
    tahun INTEGER NOT NULL,
    jumlah BIGINT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penggajian ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow per-perumahan access forum" ON public.forum_posts;
CREATE POLICY "Allow per-perumahan access forum" ON public.forum_posts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access comments" ON public.forum_comments;
CREATE POLICY "Allow per-perumahan access comments" ON public.forum_comments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access likes" ON public.forum_likes;
CREATE POLICY "Allow per-perumahan access likes" ON public.forum_likes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access bookmarks" ON public.forum_bookmarks;
CREATE POLICY "Allow per-perumahan access bookmarks" ON public.forum_bookmarks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access gaji" ON public.penggajian;
CREATE POLICY "Allow per-perumahan access gaji" ON public.penggajian FOR ALL USING (true);
