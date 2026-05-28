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
