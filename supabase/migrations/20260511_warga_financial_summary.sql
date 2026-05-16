-- Migration: Add tgl_serah_terima and RPC for Financial Summary
-- Date: 2026-05-11

-- 1. Ensure tgl_serah_terima exists in warga table
ALTER TABLE public.warga 
ADD COLUMN IF NOT EXISTS tgl_serah_terima DATE;

COMMENT ON COLUMN public.warga.tgl_serah_terima IS 'Tanggal serah terima unit sebagai basis perhitungan total kewajiban iuran. Jika null, akan dicari dari tagihan tertua.';

-- 2. Create RPC function to calculate resident financial summary
CREATE OR REPLACE FUNCTION get_warga_financial_summary(p_perumahan_id UUID)
RETURNS TABLE (
    warga_id UUID,
    tgl_serah_terima DATE,
    start_date DATE,
    total_kewajiban NUMERIC,
    total_dibayar NUMERIC,
    selisih NUMERIC
) AS $$
DECLARE
    v_base_fee NUMERIC;
    v_per_m2 BOOLEAN;
BEGIN
    -- Get billing configuration
    SELECT iuran_bulanan, hitung_per_m2 INTO v_base_fee, v_per_m2
    FROM iuran_config 
    WHERE perumahan_id = p_perumahan_id;

    RETURN QUERY
    WITH WargaData AS (
        SELECT 
            w.id,
            w.tgl_serah_terima,
            b.luas_tanah,
            COALESCE(
                w.tgl_serah_terima, 
                (SELECT MIN(make_date(tahun, bulan, 1)) FROM tagihan t WHERE t.warga_id = w.id AND t.status = 'Paid')
            ) as effective_start_date
        FROM warga w
        LEFT JOIN blok b ON w.blok_id = b.id
        WHERE w.perumahan_id = p_perumahan_id
    ),
    Kewajiban AS (
        SELECT 
            wd.id,
            wd.tgl_serah_terima,
            wd.effective_start_date,
            (
                (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM wd.effective_start_date)) * 12 +
                (EXTRACT(MONTH FROM CURRENT_DATE) - EXTRACT(MONTH FROM wd.effective_start_date)) + 1
            ) * (CASE WHEN v_per_m2 THEN v_base_fee * COALESCE(wd.luas_tanah, 0) ELSE v_base_fee END) as total_kewajiban
        FROM WargaData wd
        WHERE wd.effective_start_date IS NOT NULL
    ),
    Pembayaran AS (
        SELECT 
            warga_id, 
            SUM(jumlah) as total_dibayar
        FROM tagihan 
        WHERE status = 'Paid' AND perumahan_id = p_perumahan_id
        GROUP BY warga_id
    )
    SELECT 
        w.id as warga_id,
        k.tgl_serah_terima,
        k.effective_start_date as start_date,
        COALESCE(k.total_kewajiban, 0) as total_kewajiban,
        COALESCE(p.total_dibayar, 0) as total_dibayar,
        COALESCE(p.total_dibayar, 0) - COALESCE(k.total_kewajiban, 0) as selisih
    FROM warga w
    LEFT JOIN Kewajiban k ON w.id = k.id
    LEFT JOIN Pembayaran p ON w.id = p.warga_id
    WHERE w.perumahan_id = p_perumahan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
