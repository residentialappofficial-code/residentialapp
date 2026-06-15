-- SIMPERUMAHAN CONSOLIDATED MIGRATIONS
-- Run this script in the Supabase SQL Editor to sync the schema cache and database structure.

-- =========================================================================
-- PHASE 1: Helper Functions for Tenant-Level Separation (Required first)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_perumahan_id()
RETURNS uuid AS $$
  SELECT perumahan_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- =========================================================================
-- PHASE 2: Table Setup & Modifications
-- =========================================================================

-- 1. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create disbursements table
CREATE TABLE IF NOT EXISTS public.disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,          -- Net cash payout amount transferred to perumahan bank
    admin_fee BIGINT NOT NULL,       -- Admin fee cut by platform during payout
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disbursed')),
    reference_no TEXT,               -- Payout bank transfer receipt number
    created_at TIMESTAMPTZ DEFAULT now(),
    disbursed_at TIMESTAMPTZ
);

-- 3. Recreate audit_logs table (forces schema caching and maps user_id to public.profiles)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'billing', 'complaint', 'announcement', 'general'
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add tracking and admin fee columns to tagihan table
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Manual';
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS net_amount BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS disbursement_id UUID REFERENCES public.disbursements(id) ON DELETE SET NULL;

-- 6. Remove old pakasir columns from iuran_config (since config is now centralized)
ALTER TABLE public.iuran_config 
DROP COLUMN IF EXISTS pakasir_slug,
DROP COLUMN IF EXISTS pakasir_api_key;


-- =========================================================================
-- PHASE 3: Row Level Security (RLS) & Policies
-- =========================================================================

-- Enable RLS on new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Apply/Reapply multi-tenant RLS policies
-- Drops existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow read access to system_settings" ON public.system_settings;
CREATE POLICY "Allow read access to system_settings" ON public.system_settings
    FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Allow write access to system_settings" ON public.system_settings;
CREATE POLICY "Allow write access to system_settings" ON public.system_settings
    FOR ALL WITH CHECK (public.get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admin full access disbursements" ON public.disbursements;
CREATE POLICY "Super admin full access disbursements" ON public.disbursements 
    FOR ALL USING (public.get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Tenant read disbursements" ON public.disbursements;
CREATE POLICY "Tenant read disbursements" ON public.disbursements 
    FOR SELECT USING (
        perumahan_id = public.get_user_perumahan_id() OR
        public.get_user_role() = 'super_admin'
    );

DROP POLICY IF EXISTS "Tenant admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Tenant admin can read audit logs" ON public.audit_logs
    FOR SELECT USING (
        public.get_user_role() = 'super_admin' OR
        perumahan_id = public.get_user_perumahan_id()
    );

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- Clean up and align standard tables multi-tenant policies
-- Dropping open policies
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

-- Enable RLS
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

-- 1. Perumahan
DROP POLICY IF EXISTS "Allow per-perumahan access perumahan" ON public.perumahan;
CREATE POLICY "Allow per-perumahan access perumahan" ON public.perumahan 
    FOR SELECT USING (public.get_user_role() = 'super_admin' OR id = public.get_user_perumahan_id());
DROP POLICY IF EXISTS "Allow write access perumahan" ON public.perumahan;
CREATE POLICY "Allow write access perumahan" ON public.perumahan 
    FOR ALL WITH CHECK (public.get_user_role() = 'super_admin');

-- 2. Profiles
DROP POLICY IF EXISTS "Allow access profiles" ON public.profiles;
CREATE POLICY "Allow access profiles" ON public.profiles 
    FOR SELECT USING (public.get_user_role() = 'super_admin' OR perumahan_id = public.get_user_perumahan_id() OR id = auth.uid());
DROP POLICY IF EXISTS "Allow write profiles" ON public.profiles;
CREATE POLICY "Allow write profiles" ON public.profiles 
    FOR ALL WITH CHECK (public.get_user_role() = 'super_admin' OR id = auth.uid());

-- 3. Warga
DROP POLICY IF EXISTS "Allow tenant read warga" ON public.warga;
CREATE POLICY "Allow tenant read warga" ON public.warga FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write warga" ON public.warga;
CREATE POLICY "Allow admin write warga" ON public.warga FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 4. Iuran Config
DROP POLICY IF EXISTS "Allow tenant read iuran" ON public.iuran_config;
CREATE POLICY "Allow tenant read iuran" ON public.iuran_config FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write iuran" ON public.iuran_config;
CREATE POLICY "Allow admin write iuran" ON public.iuran_config FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 5. Tagihan
DROP POLICY IF EXISTS "Allow tenant read tagihan" ON public.tagihan;
CREATE POLICY "Allow tenant read tagihan" ON public.tagihan FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow tenant write tagihan" ON public.tagihan;
CREATE POLICY "Allow tenant write tagihan" ON public.tagihan FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

-- 6. Pengumuman
DROP POLICY IF EXISTS "Allow tenant read pengumuman" ON public.pengumuman;
CREATE POLICY "Allow tenant read pengumuman" ON public.pengumuman FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write pengumuman" ON public.pengumuman;
CREATE POLICY "Allow admin write pengumuman" ON public.pengumuman FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 7. Keluhan
DROP POLICY IF EXISTS "Allow tenant read keluhan" ON public.keluhan;
CREATE POLICY "Allow tenant read keluhan" ON public.keluhan FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow resident write keluhan" ON public.keluhan;
CREATE POLICY "Allow resident write keluhan" ON public.keluhan FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

-- 8. Aset Komplek
DROP POLICY IF EXISTS "Allow tenant read aset" ON public.aset_komplek;
CREATE POLICY "Allow tenant read aset" ON public.aset_komplek FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write aset" ON public.aset_komplek;
CREATE POLICY "Allow admin write aset" ON public.aset_komplek FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 9. Peminjaman Aset
DROP POLICY IF EXISTS "Allow tenant read pinjam" ON public.peminjaman_aset;
CREATE POLICY "Allow tenant read pinjam" ON public.peminjaman_aset FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow tenant write pinjam" ON public.peminjaman_aset;
CREATE POLICY "Allow tenant write pinjam" ON public.peminjaman_aset FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');

-- 10. Arus Kas
DROP POLICY IF EXISTS "Allow tenant read kas" ON public.arus_kas;
CREATE POLICY "Allow tenant read kas" ON public.arus_kas FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write kas" ON public.arus_kas;
CREATE POLICY "Allow admin write kas" ON public.arus_kas FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 11. Pengurus
DROP POLICY IF EXISTS "Allow tenant read pengurus" ON public.pengurus;
CREATE POLICY "Allow tenant read pengurus" ON public.pengurus FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write pengurus" ON public.pengurus;
CREATE POLICY "Allow admin write pengurus" ON public.pengurus FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 12. Penggajian
DROP POLICY IF EXISTS "Allow tenant read penggajian" ON public.penggajian;
CREATE POLICY "Allow tenant read penggajian" ON public.penggajian FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write penggajian" ON public.penggajian;
CREATE POLICY "Allow admin write penggajian" ON public.penggajian FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 13. Roles
DROP POLICY IF EXISTS "Allow tenant read roles" ON public.perumahan_roles;
CREATE POLICY "Allow tenant read roles" ON public.perumahan_roles FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write roles" ON public.perumahan_roles;
CREATE POLICY "Allow admin write roles" ON public.perumahan_roles FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 14. Blok
DROP POLICY IF EXISTS "Allow tenant read blok" ON public.blok;
CREATE POLICY "Allow tenant read blok" ON public.blok FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow admin write blok" ON public.blok;
CREATE POLICY "Allow admin write blok" ON public.blok FOR ALL WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- 15. Forum
DROP POLICY IF EXISTS "Allow tenant read posts" ON public.forum_posts;
CREATE POLICY "Allow tenant read posts" ON public.forum_posts FOR SELECT USING (perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "Allow tenant write posts" ON public.forum_posts;
CREATE POLICY "Allow tenant write posts" ON public.forum_posts FOR ALL WITH CHECK (perumahan_id = public.get_user_perumahan_id() AND author_id = auth.uid());

DROP POLICY IF EXISTS "Allow tenant read comments" ON public.forum_comments;
CREATE POLICY "Allow tenant read comments" ON public.forum_comments FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
DROP POLICY IF EXISTS "Allow tenant write comments" ON public.forum_comments;
CREATE POLICY "Allow tenant write comments" ON public.forum_comments FOR ALL WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Allow tenant read likes" ON public.forum_likes;
CREATE POLICY "Allow tenant read likes" ON public.forum_likes FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
DROP POLICY IF EXISTS "Allow tenant write likes" ON public.forum_likes;
CREATE POLICY "Allow tenant write likes" ON public.forum_likes FOR ALL WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow tenant read bookmarks" ON public.forum_bookmarks;
CREATE POLICY "Allow tenant read bookmarks" ON public.forum_bookmarks FOR SELECT USING (
  post_id IN (SELECT id FROM public.forum_posts WHERE perumahan_id = public.get_user_perumahan_id() OR public.get_user_role() = 'super_admin')
);
DROP POLICY IF EXISTS "Allow tenant write bookmarks" ON public.forum_bookmarks;
CREATE POLICY "Allow tenant write bookmarks" ON public.forum_bookmarks FOR ALL WITH CHECK (user_id = auth.uid());


-- =========================================================================
-- PHASE 4: Database Triggers & Functions
-- =========================================================================

-- 1. Create generic trigger log function for activity trail
CREATE OR REPLACE FUNCTION public.log_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_perumahan_id UUID;
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  v_user_id := auth.uid();
  
  -- Determine perumahan_id from OLD or NEW record
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_perumahan_id := OLD.perumahan_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_perumahan_id := NEW.perumahan_id;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_perumahan_id := NEW.perumahan_id;
  END IF;

  -- Fallback if perumahan_id is missing
  IF v_perumahan_id IS NULL THEN
    v_perumahan_id := public.get_user_perumahan_id();
  END IF;

  INSERT INTO public.audit_logs (user_id, perumahan_id, action, entity, details)
  VALUES (
    v_user_id,
    v_perumahan_id,
    TG_OP,
    TG_TABLE_NAME,
    jsonb_build_object('old', v_old_data, 'new', v_new_data)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach triggers to key tables
DROP TRIGGER IF EXISTS trg_audit_warga ON public.warga;
CREATE TRIGGER trg_audit_warga AFTER INSERT OR UPDATE OR DELETE ON public.warga
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_trigger();

DROP TRIGGER IF EXISTS trg_audit_tagihan ON public.tagihan;
CREATE TRIGGER trg_audit_tagihan AFTER INSERT OR UPDATE OR DELETE ON public.tagihan
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_trigger();

DROP TRIGGER IF EXISTS trg_audit_arus_kas ON public.arus_kas;
CREATE TRIGGER trg_audit_arus_kas AFTER INSERT OR UPDATE OR DELETE ON public.arus_kas
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_trigger();

DROP TRIGGER IF EXISTS trg_audit_pengurus ON public.pengurus;
CREATE TRIGGER trg_audit_pengurus AFTER INSERT OR UPDATE OR DELETE ON public.pengurus
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_trigger();


-- 2. Trigger function for tagihan (new notifications)
CREATE OR REPLACE FUNCTION public.notify_new_tagihan()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.warga WHERE id = NEW.warga_id;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (perumahan_id, user_id, title, message, type, reference_id)
    VALUES (
      NEW.perumahan_id,
      v_user_id,
      'Tagihan Baru Diterbitkan',
      'Tagihan iuran periode ' || NEW.bulan || '/' || NEW.tahun || ' sebesar Rp ' || NEW.jumlah || ' telah diterbitkan.',
      'billing',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_tagihan ON public.tagihan;
CREATE TRIGGER trg_notify_tagihan AFTER INSERT ON public.tagihan
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_tagihan();


-- 3. Trigger function for keluhan (complaint status change)
CREATE OR REPLACE FUNCTION public.notify_keluhan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (perumahan_id, user_id, title, message, type, reference_id)
    VALUES (
      NEW.perumahan_id,
      NEW.warga_id, -- reporter profile ID
      'Update Status Laporan',
      'Laporan keluhan Anda tentang "' || LEFT(NEW.deskripsi, 25) || '..." telah diupdate menjadi ' || NEW.status || '.',
      'complaint',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_keluhan ON public.keluhan;
CREATE TRIGGER trg_notify_keluhan AFTER UPDATE OF status ON public.keluhan
    FOR EACH ROW EXECUTE FUNCTION public.notify_keluhan_status_change();


-- 4. Trigger function for pengumuman (announcement)
CREATE OR REPLACE FUNCTION public.notify_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (perumahan_id, user_id, title, message, type, reference_id)
  SELECT 
    NEW.perumahan_id,
    p.id,
    'Pengumuman Baru: ' || NEW.judul,
    'Kategori ' || NEW.kategori || ': ' || LEFT(NEW.konten, 40) || '...',
    'announcement',
    NEW.id
  FROM public.profiles p
  WHERE p.perumahan_id = NEW.perumahan_id AND p.role != 'super_admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.pengumuman;
CREATE TRIGGER trg_notify_announcement AFTER INSERT ON public.pengumuman
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_announcement();


-- =========================================================================
-- PHASE 5: Dashboard RPC Function
-- =========================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_perumahan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pemasukan BIGINT := 0;
    v_total_pengeluaran BIGINT := 0;
    v_saldo_kas BIGINT := 0;
    v_total_tunggakan BIGINT := 0;
    v_top_tunggakan JSONB := '[]'::jsonb;
    v_kas_bulanan JSONB := '[]'::jsonb;
BEGIN
    -- 1. Saldo Kas (All time)
    SELECT 
        COALESCE(SUM(CASE WHEN kategori = 'Pemasukan' THEN jumlah ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN kategori = 'Pengeluaran' THEN jumlah ELSE 0 END), 0)
    INTO v_total_pemasukan, v_total_pengeluaran
    FROM arus_kas
    WHERE perumahan_id = p_perumahan_id;

    v_saldo_kas := v_total_pemasukan - v_total_pengeluaran;

    -- 2. Total Tunggakan (All time Unpaid)
    SELECT COALESCE(SUM(jumlah), 0)
    INTO v_total_tunggakan
    FROM tagihan
    WHERE perumahan_id = p_perumahan_id AND status = 'Unpaid';

    -- 3. Top Tunggakan (Top 3 warga with most unpaid)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', w.id,
            'nama', w.nama,
            'blok', w.blok,
            'total', t.total_amount
        )
    )
    INTO v_top_tunggakan
    FROM (
        SELECT warga_id, SUM(jumlah) as total_amount
        FROM tagihan
        WHERE perumahan_id = p_perumahan_id AND status = 'Unpaid'
        GROUP BY warga_id
        ORDER BY total_amount DESC
        LIMIT 3
    ) t
    JOIN warga w ON w.id = t.warga_id;

    -- 4. Kas Bulanan (Last 6 months grouped)
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', extract(month from m.month_start) - 1, -- JS months are 0-11
            'year', extract(year from m.month_start),
            'pemasukan', COALESCE(k.pemasukan, 0),
            'pengeluaran', COALESCE(k.pengeluaran, 0)
        )
    )
    INTO v_kas_bulanan
    FROM (
        -- Generate last 6 months
        SELECT generate_series(
            date_trunc('month', current_date - interval '5 months'),
            date_trunc('month', current_date),
            '1 month'::interval
        ) as month_start
    ) m
    LEFT JOIN (
        SELECT 
            date_trunc('month', created_at) as month_start,
            SUM(CASE WHEN kategori = 'Pemasukan' THEN jumlah ELSE 0 END) as pemasukan,
            SUM(CASE WHEN kategori = 'Pengeluaran' THEN jumlah ELSE 0 END) as pengeluaran
        FROM arus_kas
        WHERE perumahan_id = p_perumahan_id 
          AND created_at >= date_trunc('month', current_date - interval '5 months')
        GROUP BY 1
    ) k ON m.month_start = k.month_start;

    -- Handle null aggregates
    IF v_top_tunggakan IS NULL THEN
        v_top_tunggakan := '[]'::jsonb;
    END IF;

    IF v_kas_bulanan IS NULL THEN
        v_kas_bulanan := '[]'::jsonb;
    END IF;

    -- Return full payload
    RETURN jsonb_build_object(
        'pemasukan', v_total_pemasukan,
        'pengeluaran', v_total_pengeluaran,
        'saldo_kas', v_saldo_kas,
        'total_tunggakan', v_total_tunggakan,
        'top_tunggakan', v_top_tunggakan,
        'kas_bulanan', v_kas_bulanan
    );
END;
$$;


-- =========================================================================
-- PHASE 6: Centralized Settings Seeding
-- =========================================================================

-- Seed default Pakasir API Config in system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('pakasir_slug', 'habitix', 'Slug for Pakasir integration (Global)'),
    ('pakasir_api_key', 'cuTCvuY8btAUMyaBTtbUfW4gUe5qaxUJ', 'API Key for Pakasir integration (Global)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add SaaS subscription columns to perumahan table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_status') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'expired'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_plan') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'monthly', 'yearly'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_valid_until') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_valid_until TIMESTAMPTZ DEFAULT (now() + interval '30 days');
    END IF;
END $$;
