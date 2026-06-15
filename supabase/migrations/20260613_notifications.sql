-- Create notifications table
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

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
      public.get_user_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger function for tagihan (new bills)
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

-- Trigger function for keluhan (complaint status change)
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

-- Trigger function for pengumuman (announcement)
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
