-- Helper functions to fetch user role & perumahan_id bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_perumahan_id()
RETURNS uuid AS $$
  SELECT perumahan_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Drop all open policies
DROP POLICY IF EXISTS "Allow per-perumahan access" ON public.perumahan;
DROP POLICY IF EXISTS "Allow per-perumahan access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow per-perumahan access warga" ON public.warga;
DROP POLICY IF EXISTS "Allow per-perumahan access iuran" ON public.iuran_config;
DROP POLICY IF EXISTS "Allow per-perumahan access tagihan" ON public.tagihan;
DROP POLICY IF EXISTS "Allow per-perumahan access pengumuman" ON public.pengumuman;
DROP POLICY IF EXISTS "Allow per-perumahan access keluhan" ON public.keluhan;
DROP POLICY IF EXISTS "Allow per-perumahan access aset" ON public.aset_komplek;
DROP POLICY IF EXISTS "Allow per-perumahan access pinjam" ON public.peminjaman_aset;
DROP POLICY IF EXISTS "Allow per-perumahan access kas" ON public.arus_kas;
DROP POLICY IF EXISTS "Allow per-perumahan access pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Allow per-perumahan access forum" ON public.forum_posts;
DROP POLICY IF EXISTS "Allow per-perumahan access comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Allow per-perumahan access likes" ON public.forum_likes;
DROP POLICY IF EXISTS "Allow per-perumahan access bookmarks" ON public.forum_bookmarks;
DROP POLICY IF EXISTS "Allow per-perumahan access gaji" ON public.penggajian;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.perumahan_roles;
DROP POLICY IF EXISTS "Allow all access to admins" ON public.perumahan_roles;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.pengurus;
DROP POLICY IF EXISTS "Allow all access to admins" ON public.pengurus;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.blok;

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
ALTER TABLE public.perumahan_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penggajian ENABLE ROW LEVEL SECURITY;

-- Apply Multi-Tenant Policies
-- 1. Perumahan
CREATE POLICY "Allow per-perumahan access perumahan" ON public.perumahan 
    FOR SELECT USING (
        public.get_user_role() = 'super_admin' OR 
        id = public.get_user_perumahan_id()
    );
CREATE POLICY "Allow write access perumahan" ON public.perumahan 
    FOR ALL WITH CHECK (public.get_user_role() = 'super_admin');

-- 2. Profiles
CREATE POLICY "Allow access profiles" ON public.profiles 
    FOR SELECT USING (
        public.get_user_role() = 'super_admin' OR
        perumahan_id = public.get_user_perumahan_id() OR
        id = auth.uid()
    );
CREATE POLICY "Allow write profiles" ON public.profiles 
    FOR ALL WITH CHECK (
        public.get_user_role() = 'super_admin' OR
        id = auth.uid()
    );

-- 3. Core tables (Admin write, Resident read)
CREATE POLICY "Allow tenant read warga" ON public.warga FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write warga" ON public.warga FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read iuran" ON public.iuran_config FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write iuran" ON public.iuran_config FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read tagihan" ON public.tagihan FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow tenant write tagihan" ON public.tagihan FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY "Allow tenant read pengumuman" ON public.pengumuman FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write pengumuman" ON public.pengumuman FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read keluhan" ON public.keluhan FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow resident write keluhan" ON public.keluhan FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY "Allow tenant read aset" ON public.aset_komplek FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write aset" ON public.aset_komplek FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read pinjam" ON public.peminjaman_aset FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow tenant write pinjam" ON public.peminjaman_aset FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY "Allow tenant read kas" ON public.arus_kas FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write kas" ON public.arus_kas FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read pengurus" ON public.pengurus FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write pengurus" ON public.pengurus FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read penggajian" ON public.penggajian FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write penggajian" ON public.penggajian FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read roles" ON public.perumahan_roles FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write roles" ON public.perumahan_roles FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Allow tenant read blok" ON public.blok FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow admin write blok" ON public.blok FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 4. Forum (Tenant read, Author write)
CREATE POLICY "Allow tenant read posts" ON public.forum_posts FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "Allow tenant write posts" ON public.forum_posts FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() AND author_id = auth.uid());

CREATE POLICY "Allow tenant read comments" ON public.forum_comments FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
CREATE POLICY "Allow tenant write comments" ON public.forum_comments FOR ALL WITH CHECK (author_id = auth.uid());

CREATE POLICY "Allow tenant read likes" ON public.forum_likes FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
CREATE POLICY "Allow tenant write likes" ON public.forum_likes FOR ALL WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow tenant read bookmarks" ON public.forum_bookmarks FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
CREATE POLICY "Allow tenant write bookmarks" ON public.forum_bookmarks FOR ALL WITH CHECK (user_id = auth.uid());

-- 5. System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to system_settings" ON public.system_settings;
CREATE POLICY "Allow read access to system_settings" ON public.system_settings
    FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));
DROP POLICY IF EXISTS "Allow write access to system_settings" ON public.system_settings;
CREATE POLICY "Allow write access to system_settings" ON public.system_settings
    FOR ALL WITH CHECK (public.get_user_role() = 'super_admin');
