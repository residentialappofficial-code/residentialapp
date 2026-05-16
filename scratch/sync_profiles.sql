-- SINKRONISASI PROFIL: Memastikan semua warga memiliki entri di tabel profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT w.user_id, w.nama, w.email, w.perumahan_id 
        FROM public.warga w
        WHERE w.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = w.user_id)
    LOOP
        INSERT INTO public.profiles (id, email, nama, role, perumahan_id)
        VALUES (r.user_id, r.email, r.nama, 'warga', r.perumahan_id)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
