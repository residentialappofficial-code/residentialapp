import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const payload = await req.json();
    
    // Asumsi payload dari Pakasir Webhook:
    // { "order_id": "TAGIHAN-UUID", "status": "settlement", "gross_amount": 150000, "signature_key": "..." }
    
    // Pada skenario riil, lakukan validasi signature hash (contoh: SHA512) di sini
    
    const { order_id, status, gross_amount } = payload;
    
    // Hanya proses jika pembayaran sukses / settlement
    if (status === 'settlement' || status === 'capture') {
      
      // Update tagihan
      const { data: tagihan, error: tagihanError } = await supabaseAdmin
        .from('tagihan')
        .update({ status: 'Paid' })
        .eq('id', order_id)
        .select('*')
        .single();
        
      if (tagihanError || !tagihan) {
        throw new Error("Tagihan tidak ditemukan atau gagal diupdate");
      }

      // Record ke arus_kas otomatis
      const { error: kasError } = await supabaseAdmin
        .from('arus_kas')
        .insert([{
          perumahan_id: tagihan.perumahan_id,
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: `Auto-Payment Webhook: Tagihan ${tagihan.bulan}/${tagihan.tahun}`,
          jumlah: parseInt(gross_amount) || tagihan.jumlah,
          kategori: 'Pemasukan'
        }]);

      if (kasError) {
        console.error("Gagal mencatat arus_kas otomatis:", kasError);
      }
      
      return new Response(JSON.stringify({ success: true, message: "Tagihan lunas terverifikasi otomatis." }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Status diabaikan (bukan settlement)." }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
