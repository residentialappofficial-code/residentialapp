-- SQL Schema for Housing Management System (SimPerumahan)
-- Run this in your Supabase SQL Editor

-- 1. Table: Warga
CREATE TABLE IF NOT EXISTS warga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    blok TEXT NOT NULL,
    no_hp TEXT,
    email TEXT UNIQUE,
    user_id UUID UNIQUE, -- REFERENCES auth.users(id)
    role TEXT CHECK (role IN ('super_admin', 'admin', 'resident')) DEFAULT 'resident',
    status_hunian TEXT CHECK (status_hunian IN ('Pemilik', 'Kontrak', 'Kos')) DEFAULT 'Pemilik',
    status_iuran TEXT CHECK (status_iuran IN ('Lunas', 'Belum Bayar', 'Sebagian')) DEFAULT 'Belum Bayar',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: Pengurus
CREATE TABLE IF NOT EXISTS pengurus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    no_hp TEXT,
    periode TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: Arus Kas
CREATE TABLE IF NOT EXISTS arus_kas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tanggal DATE DEFAULT CURRENT_DATE,
    keterangan TEXT NOT NULL,
    kategori TEXT CHECK (kategori IN ('Pemasukan', 'Pengeluaran')) NOT NULL,
    jumlah BIGINT NOT NULL,
    saldo_after BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: Pembayaran Iuran
CREATE TABLE IF NOT EXISTS iuran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warga_id UUID REFERENCES warga(id) ON DELETE CASCADE,
    bulan TEXT NOT NULL,
    jumlah BIGINT NOT NULL,
    tanggal_bayar DATE,
    status TEXT CHECK (status IN ('Lunas', 'Belum Bayar', 'Sebagian')) DEFAULT 'Belum Bayar',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table: Penggajian
CREATE TABLE IF NOT EXISTS penggajian (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_pegawai TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    gaji_pokok BIGINT NOT NULL,
    tunjangan BIGINT DEFAULT 0,
    potongan BIGINT DEFAULT 0,
    gaji_bersih BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table: Forum Warga
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author TEXT NOT NULL,
    avatar TEXT,
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('Pengumuman', 'Diskusi', 'Laporan')) DEFAULT 'Diskusi',
    replies_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE arus_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE penggajian ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- 1. Warga Table Policies (Careful with recursion)
CREATE POLICY "Users can view own profile" ON warga FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON warga FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON warga FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin access to all warga (Non-recursive check via JWT or simplified)
CREATE POLICY "Admins can view all warga" ON warga FOR SELECT 
USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'super_admin')));
-- Note: If metadata is not used, we can use a role-based check that doesn't trigger the same policy.
-- For simplicity, let's allow all authenticated users to SELECT from warga (like a directory)
DROP POLICY IF EXISTS "Users can view own profile" ON warga;
CREATE POLICY "Registered users can view all warga" ON warga FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin power for other tables (These are fine as they refer to another table 'warga')
CREATE POLICY "Admins have full access" ON pengurus FOR ALL 
USING (EXISTS (SELECT 1 FROM warga WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins have full access" ON arus_kas FOR ALL 
USING (EXISTS (SELECT 1 FROM warga WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins have full access" ON iuran FOR ALL 
USING (EXISTS (SELECT 1 FROM warga WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins have full access" ON penggajian FOR ALL 
USING (EXISTS (SELECT 1 FROM warga WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Forum Policies
CREATE POLICY "Users can view all posts" ON forum_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage forum" ON forum_posts FOR DELETE USING (EXISTS (SELECT 1 FROM warga WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
