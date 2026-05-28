import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Initialize Supabase Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Only allow POST requests for this cron job / webhook
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 1. Fetch all iuran configs
    const { data: configs, error: configError } = await supabaseAdmin
      .from('iuran_config')
      .select('*');
      
    if (configError) throw configError;

    let totalCreated = 0;
    const emailsToSend: any[] = [];

    // 2. Loop through each perumahan
    for (const config of configs || []) {
      const perumahanId = config.perumahan_id;
      
      // Fetch active warga
      const { data: wargas, error: wargaError } = await supabaseAdmin
        .from('warga')
        .select('id, nama, email, luas_tanah')
        .eq('perumahan_id', perumahanId)
        .eq('status_aktif', true);

      if (wargaError || !wargas || wargas.length === 0) continue;

      // Check existing bills for this month
      const { data: existingBills } = await supabaseAdmin
        .from('tagihan')
        .select('warga_id')
        .eq('perumahan_id', perumahanId)
        .eq('bulan', currentMonth)
        .eq('tahun', currentYear);

      const existingWargaIds = new Set(existingBills?.map(b => b.warga_id) || []);

      const newBills = [];

      for (const w of wargas) {
        if (!existingWargaIds.has(w.id)) {
          const jumlah = config.tipe === 'flat' 
            ? config.tarif_dasar 
            : (config.tarif_dasar * (w.luas_tanah || 0));

          newBills.push({
            warga_id: w.id,
            perumahan_id: perumahanId,
            bulan: currentMonth,
            tahun: currentYear,
            jumlah: jumlah,
            status: 'Unpaid',
            unique_code: config.use_unique_code ? Math.floor(Math.random() * 999) + 1 : 0
          });

          // Queue email if warga has email
          if (w.email && w.email.includes('@')) {
            emailsToSend.push({
              from: 'Habitix Billing <billing@resend.dev>', // Should be a verified domain in production
              to: [w.email],
              subject: `Tagihan Iuran Habitix - ${currentMonth}/${currentYear}`,
              html: `
                <h2>Halo ${w.nama},</h2>
                <p>Tagihan iuran perumahan Anda untuk bulan <strong>${currentMonth}/${currentYear}</strong> telah terbit.</p>
                <p><strong>Total Tagihan: Rp ${jumlah.toLocaleString('id-ID')}</strong></p>
                <p>Silakan login ke aplikasi Habitix untuk melakukan pembayaran melalui sistem kami.</p>
                <br/>
                <p>Terima kasih,</p>
                <p>Pengurus Perumahan</p>
              `
            });
          }
        }
      }

      if (newBills.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('tagihan')
          .insert(newBills);
          
        if (!insertError) {
          totalCreated += newBills.length;
        } else {
          console.error("Error inserting bills:", insertError);
        }
      }
    }

    // 3. Send emails via Resend
    let emailsSent = 0;
    if (resendApiKey && emailsToSend.length > 0) {
      // Send via Resend Batch API
      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailsToSend)
        });
        
        if (res.ok) {
          emailsSent = emailsToSend.length;
        } else {
          console.error("Resend error:", await res.text());
        }
      } catch (err) {
        console.error("Failed to send emails:", err);
      }
    } else if (emailsToSend.length > 0) {
      console.log(`Skipped sending ${emailsToSend.length} emails because RESEND_API_KEY is not set.`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bills_created: totalCreated,
      emails_queued: emailsToSend.length,
      emails_sent: emailsSent
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
