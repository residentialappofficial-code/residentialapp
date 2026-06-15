-- Alter audit_logs to add perumahan_id if not exists
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;

-- Update RLS policy to allow tenant-level filtering
DROP POLICY IF EXISTS "Superadmins can read all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenant admin can read audit logs" ON public.audit_logs;

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
