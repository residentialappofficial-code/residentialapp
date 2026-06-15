# Audit Fitur & Rekomendasi SimPerumahan (Habitix) v3.0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement RLS security hardening, automated database-driven audit logging, centralized notification channels, and client-side PDF/Excel exports while refactoring ResidentFees page.

**Architecture:** Secure database operations via SECURITY DEFINER helpers, execute event-driven triggers for audit logs and notifications, and handle file exports fully on the client-side for maximum scalability.

**Tech Stack:** React 19, Supabase JS, PostgreSQL, Chakra UI v3, jspdf, jspdf-autotable, xlsx.

---

## Task 1: Hardening Row Level Security (RLS)

**Files:**
- Create: `supabase/migrations/20260613_secure_rls_policies.sql`

- [ ] **Step 1: Write SQL migration for RLS helpers and policies**

Write the following sql in `supabase/migrations/20260613_secure_rls_policies.sql`:

```sql
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

-- Re-apply table-specific multi-tenant RLS policies
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

-- 3. Core tables (Admin-write, Tenant-read)
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
```

- [ ] **Step 2: Apply SQL migration in local database / Supabase shell**

Run: `npx supabase db execute --file supabase/migrations/20260613_secure_rls_policies.sql` (or apply manually via Supabase SQL Editor if CLI is offline).
Expected: Migration executes successfully.

---

## Task 2: Automated Audit Trail with Triggers

**Files:**
- Create: `supabase/migrations/20260613_auto_audit_logs.sql`
- Modify: `src/pages/SuperAdmin/AuditLogs.jsx`

- [ ] **Step 1: Write SQL migration for Audit Logs modification and trigger logic**

Write the following sql in `supabase/migrations/20260613_auto_audit_logs.sql`:

```sql
-- Alter audit_logs to add perumahan_id
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;

-- Update RLS policy to allow tenant-level filtering
DROP POLICY IF EXISTS "Superadmins can read all audit logs" ON public.audit_logs;
CREATE POLICY "Tenant admin can read audit logs" ON public.audit_logs
    FOR SELECT USING (
        public.get_user_role() = 'super_admin' OR
        perumahan_id = public.get_user_perumahan_id()
    );

-- Create generic trigger log function
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
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `npx supabase db execute --file supabase/migrations/20260613_auto_audit_logs.sql`
Expected: Migration executes successfully.

- [ ] **Step 3: Modify AuditLogs.jsx to support rich filtering and readable formatting**

Replace `src/pages/SuperAdmin/AuditLogs.jsx` content to add filters for Action and Entity, date bounds, pagination, and a utility function to format change details nicely instead of raw JSON.

---

## Task 3: Centralized Notification System

**Files:**
- Create: `supabase/migrations/20260613_notifications.sql`
- Modify: `src/components/layout/Header.jsx`

- [ ] **Step 1: Write SQL migration for notifications table and triggers**

Write the following sql in `supabase/migrations/20260613_notifications.sql`:

```sql
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
      public.get_user_role() IN ('admin', 'super_admin')
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Triggers for tagihan, keluhan, and pengumuman
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

CREATE TRIGGER trg_notify_tagihan AFTER INSERT ON public.tagihan
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_tagihan();

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

CREATE TRIGGER trg_notify_keluhan AFTER UPDATE OF status ON public.keluhan
    FOR EACH ROW EXECUTE FUNCTION public.notify_keluhan_status_change();

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
  WHERE p.perumahan_id = NEW.perumahan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_announcement AFTER INSERT ON public.pengumuman
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_announcement();
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `npx supabase db execute --file supabase/migrations/20260613_notifications.sql`
Expected: Migration executes successfully.

- [ ] **Step 3: Update Header.jsx with dynamic Notification bell dropdown**

Modify `src/components/layout/Header.jsx` to fetch and render notifications list on click, with unread badging, real-time Supabase channels, and toggle controls.

---

## Task 4: Client-Side PDF & Excel Export Utilities

**Files:**
- Modify: `package.json`
- Create: `src/utils/exportUtils.js`
- Modify: `src/pages/ArusKas.jsx`
- Modify: `src/pages/Billing/ManageBills.jsx`
- Modify: `src/pages/warga/MyBills.jsx`

- [ ] **Step 1: Install jspdf, jspdf-autotable, and xlsx libraries**

Run: `npm install jspdf jspdf-autotable xlsx`
Expected: Dependencies installed and updated in package.json.

- [ ] **Step 2: Create exportUtils.js helper**

Create `src/utils/exportUtils.js` defining `exportToPDF`, `exportToExcel`, and `printInvoice` functions using the newly installed packages.

- [ ] **Step 3: Integrate exports in pages**

Modify headers and control sections in:
- `src/pages/ArusKas.jsx`: Add Export buttons.
- `src/pages/Billing/ManageBills.jsx`: Add single invoice printer and billing sheet PDF/Excel exports.
- `src/pages/warga/MyBills.jsx`: Add receipt printer trigger.

---

## Task 5: Refactoring ResidentFees Page

**Files:**
- Create: `src/components/billing/ResidentFeesTable.jsx`
- Create: `src/components/billing/ResidentFeesMobileList.jsx`
- Create: `src/components/billing/ResidentBillsModal.jsx`
- Modify: `src/pages/Billing/ResidentFees.jsx`

- [ ] **Step 1: Create sub-components extracting visual and modal logic**

Create three lightweight components in `src/components/billing/` to separate responsibilities.

- [ ] **Step 2: Clean and refactor ResidentFees.jsx**

Simplify `src/pages/Billing/ResidentFees.jsx` to manage shared fetching, search, and sorting states, rendering the modular sub-components. Add PDF/Excel export triggers here too.

---

## Verification Plan

### Automated Tests
- Run validation test suites: `npm run test`
- Verify linting: `npm run lint`
- Build verification: `npm run build`

### Manual Verification
- Log in as Warga, post a complaint, check if notification is sent.
- Log in as Admin of Komplek A, confirm you cannot query/see citizen tagihan of Komplek B (multi-tenant isolation check).
- Click "Export PDF" on Arus Kas, verify formatted PDF matches layout structure.
