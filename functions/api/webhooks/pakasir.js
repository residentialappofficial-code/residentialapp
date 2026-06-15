import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    console.log('Pakasir Webhook received:', body);

    // Pakasir Webhook Body: { "amount": 22000, "order_id": "240910HDE7C9", "project": "depodomain", "status": "completed", "payment_method": "qris", "completed_at": "2024-09-10T08:07:02.819+07:00" }
    const { amount, order_id, status, project } = body;

    if (status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Status not completed' }), { status: 200 });
    }

    // Initialize Supabase with Service Role Key (needs to be set in Cloudflare env)
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Check if it is a platform subscription payment
    if (order_id && order_id.startsWith('SUB_')) {
      // Format: SUB_[PERUMAHAN_ID]_[PLAN_TYPE]_[TIMESTAMP]
      const parts = order_id.split('_');
      const perumahanId = parts[1];
      const planType = parts[2]; // 'monthly' or 'yearly'
      
      if (!perumahanId || !planType) {
        return new Response(JSON.stringify({ error: 'Format order_id subscription tidak valid' }), { status: 400 });
      }
      
      // Get the current perumahan subscription status
      const { data: perumahan, error: fetchError } = await supabase
        .from('perumahan')
        .select('*')
        .eq('id', perumahanId)
        .single();
        
      if (fetchError || !perumahan) {
        console.error('Perumahan not found for subscription:', perumahanId);
        return new Response(JSON.stringify({ error: 'Perumahan tidak ditemukan' }), { status: 404 });
      }
      
      // Calculate new subscription validity date
      let baseDate = new Date();
      if (perumahan.subscription_valid_until) {
        const currentValidUntil = new Date(perumahan.subscription_valid_until);
        // If still active, extend. If expired, add from today.
        if (currentValidUntil > baseDate) {
          baseDate = currentValidUntil;
        }
      }
      
      const daysToAdd = planType === 'yearly' ? 365 : 30;
      const newValidUntil = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      
      const { error: updateError } = await supabase
        .from('perumahan')
        .update({
          subscription_status: 'active',
          subscription_plan: planType,
          subscription_valid_until: newValidUntil.toISOString(),
          status: 'active'
        })
        .eq('id', perumahanId);
        
      if (updateError) {
        console.error('Failed to update perumahan subscription:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Langganan perumahan ${perumahan.nama} berhasil diperbarui hingga ${newValidUntil.toISOString()}` 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse multi-select IDs if they exist (e.g., M_id1_id2_id3)
    let billIds = [];
    if (order_id.startsWith('M_')) {
      billIds = order_id.replace('M_', '').split('_');
    } else {
      billIds = [order_id];
    }

    // 1. Get first bill info to get perumahan_id and warga_id for cash flow recording
    const { data: bill, error: billError } = await supabase
      .from('tagihan')
      .select('*, warga:warga_id(nama)')
      .eq('id', billIds[0])
      .single();

    if (billError || !bill) {
      console.error('Bill not found:', billIds[0]);
      return new Response(JSON.stringify({ error: 'Bill not found' }), { status: 404 });
    }

    // 2. Update Tagihan Status for ALL selected bills
    const { error: updateError } = await supabase
      .from('tagihan')
      .update({ status: 'Paid' })
      .in('id', billIds);

    if (updateError) throw updateError;

    // 3. Record in Arus Kas (Single entry for the combined payment)
    const isMulti = billIds.length > 1;
    const ketMulti = isMulti ? ` (${billIds.length} Tagihan)` : ` (${bill.bulan}/${bill.tahun})`;
    
    const { error: kasError } = await supabase
      .from('arus_kas')
      .insert([{
        perumahan_id: bill.perumahan_id,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: `Pembayaran Otomatis (Pakasir): ${bill.warga?.nama}${ketMulti}`,
        jumlah: amount,
        kategori: 'Pemasukan'
      }]);

    if (kasError) console.error('Error recording cash flow:', kasError);

    return new Response(JSON.stringify({ success: true, updated_count: billIds.length }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
