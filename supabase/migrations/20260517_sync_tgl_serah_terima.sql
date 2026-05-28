-- Migration: Synchronize tgl_serah_terima between public.warga and public.blok bidirectionally
-- Date: 2026-05-17

-- 1. Sync any existing mismatching data (priority: blok over warga if set, else warga over blok)
UPDATE public.warga w
SET tgl_serah_terima = b.tgl_serah_terima
FROM public.blok b
WHERE w.blok_id = b.id AND b.tgl_serah_terima IS NOT NULL AND w.tgl_serah_terima IS DISTINCT FROM b.tgl_serah_terima;

UPDATE public.blok b
SET tgl_serah_terima = w.tgl_serah_terima
FROM public.warga w
WHERE w.blok_id = b.id AND w.tgl_serah_terima IS NOT NULL AND b.tgl_serah_terima IS NULL;

-- 2. Trigger function to sync/set tgl_serah_terima on Warga insert/update
CREATE OR REPLACE FUNCTION sync_warga_tgl_serah_terima()
RETURNS TRIGGER AS $$
DECLARE
    v_blok_tgl DATE;
BEGIN
    -- For INSERT: if warga.tgl_serah_terima is NULL, inherit from blok
    IF TG_OP = 'INSERT' THEN
        IF NEW.tgl_serah_terima IS NULL AND NEW.blok_id IS NOT NULL THEN
            SELECT tgl_serah_terima INTO v_blok_tgl FROM public.blok WHERE id = NEW.blok_id;
            NEW.tgl_serah_terima := v_blok_tgl;
        ELSIF NEW.tgl_serah_terima IS NOT NULL AND NEW.blok_id IS NOT NULL THEN
            -- Update blok's date to match this new warga's date
            UPDATE public.blok
            SET tgl_serah_terima = NEW.tgl_serah_terima
            WHERE id = NEW.blok_id AND (tgl_serah_terima IS DISTINCT FROM NEW.tgl_serah_terima);
        END IF;
    -- For UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.tgl_serah_terima IS DISTINCT FROM OLD.tgl_serah_terima AND NEW.blok_id IS NOT NULL THEN
            UPDATE public.blok
            SET tgl_serah_terima = NEW.tgl_serah_terima
            WHERE id = NEW.blok_id AND (tgl_serah_terima IS DISTINCT FROM NEW.tgl_serah_terima);
        -- If blok_id changed, and tgl_serah_terima is null, inherit from new blok
        ELSIF NEW.blok_id IS DISTINCT FROM OLD.blok_id AND NEW.tgl_serah_terima IS NULL AND NEW.blok_id IS NOT NULL THEN
            SELECT tgl_serah_terima INTO v_blok_tgl FROM public.blok WHERE id = NEW.blok_id;
            NEW.tgl_serah_terima := v_blok_tgl;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_warga_tgl_serah_terima ON public.warga;
CREATE TRIGGER trg_sync_warga_tgl_serah_terima
BEFORE INSERT OR UPDATE OF tgl_serah_terima, blok_id ON public.warga
FOR EACH ROW
EXECUTE FUNCTION sync_warga_tgl_serah_terima();

-- 3. Trigger function to sync tgl_serah_terima on Blok update
CREATE OR REPLACE FUNCTION sync_blok_tgl_serah_terima()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.tgl_serah_terima IS DISTINCT FROM OLD.tgl_serah_terima THEN
            UPDATE public.warga
            SET tgl_serah_terima = NEW.tgl_serah_terima
            WHERE blok_id = NEW.id AND (tgl_serah_terima IS DISTINCT FROM NEW.tgl_serah_terima);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_blok_tgl_serah_terima ON public.blok;
CREATE TRIGGER trg_sync_blok_tgl_serah_terima
AFTER UPDATE OF tgl_serah_terima ON public.blok
FOR EACH ROW
EXECUTE FUNCTION sync_blok_tgl_serah_terima();
