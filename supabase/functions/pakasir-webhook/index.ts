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
    
    const { order_id, status, gross_amount, signature_key } = payload;
    
    // Hanya proses jika pembayaran sukses / settlement / completed
    if (status === 'settlement' || status === 'capture' || status === 'completed') {
      
      const paymentAmount = parseInt(gross_amount) || 0;

      // Check if it is a platform subscription payment
      if (order_id && order_id.startsWith('SUB_')) {
        const parts = order_id.split('_');
        const perumahanId = parts[1];
        const planType = parts[2]; // 'monthly' or 'yearly'
        
        if (!perumahanId || !planType) {
          return new Response(JSON.stringify({ error: "Invalid subscription order ID" }), { status: 400 });
        }
        
        const { data: perumahan, error: fetchError } = await supabaseAdmin
          .from('perumahan')
          .select('*')
          .eq('id', perumahanId)
          .single();
          
        if (fetchError || !perumahan) {
          return new Response(JSON.stringify({ error: "Perumahan not found" }), { status: 404 });
        }
        
        let baseDate = new Date();
        if (perumahan.subscription_valid_until) {
          const currentValidUntil = new Date(perumahan.subscription_valid_until);
          if (currentValidUntil > baseDate) {
            baseDate = currentValidUntil;
          }
        }
        
        const daysToAdd = planType === 'yearly' ? 365 : 30;
        const newValidUntil = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        const { error: updateError } = await supabaseAdmin
          .from('perumahan')
          .update({
            subscription_status: 'active',
            subscription_plan: planType,
            subscription_valid_until: newValidUntil.toISOString(),
            status: 'active'
          })
          .eq('id', perumahanId);
          
        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
        }
        
        return new Response(JSON.stringify({ success: true, message: "Subscription updated successfully" }), { status: 200 });
      }
      
      // Update tagihan
      const { data: tagihan, error: tagihanError } = await supabaseAdmin
        .from('tagihan')
        .update({ 
          status: 'Paid',
          payment_method: 'QRIS_PAKASIR',
          payment_ref: signature_key || 'PAKASIR_WEBHOOK',
          net_amount: paymentAmount
        })
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
          keterangan: `Auto-Payment QRIS (Pakasir): Tagihan ${tagihan.bulan}/${tagihan.tahun}`,
          jumlah: paymentAmount || tagihan.jumlah,
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
