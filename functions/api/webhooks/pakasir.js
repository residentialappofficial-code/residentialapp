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

    // Parse multi-select IDs if they exist (e.g., M_id1_id2_id3)
    let billIds = [];
    if (order_id.startsWith('M_')) {
      billIds = order_id.replace('M_', '').split('_');
    } else {
      billIds = [order_id];
    }

    // Initialize Supabase with Service Role Key (needs to be set in Cloudflare env)
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
