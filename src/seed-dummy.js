/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log("SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Defined" : "Undefined");

// Initial check with adminClient
async function seed() {
  console.log("Seeding dummy complex...");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  console.log("Using key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role" : "Anon Key (Warning: Might fail if RLS active)");
  
  const adminClient = createClient(process.env.VITE_SUPABASE_URL, serviceKey);

  console.log("1. Checking/Creating Perumahan...");
  // Use adminClient for insert
  const { error: pError } = await adminClient
    .from('perumahan')
    .insert([{
      nama: 'Cendana Residence',
      alamat: 'Jl. Cendana No. 12, Jakarta Selatan',
      status: 'active'
    }])
    .select()
    .single();

  if (pError) {
    if (pError.code === '23505') {
      console.log("   - Perumahan already exists, proceeding...");
    } else {
      console.error("   - Error creating perumahan:", pError.message);
    }
  } else {
    console.log("   - Successfully created Cendana Residence.");
  }

  // Use adminClient for select
  const { data: existingData, error: sError } = await adminClient
    .from('perumahan')
    .select('id')
    .eq('nama', 'Cendana Residence')
    .order('created_at', { ascending: false })
    .limit(1);

  if (sError) {
    console.error("   - Error fetching existing perumahan:", sError.message);
  }

  const pId = existingData?.[0]?.id;
  
  if (!pId) {
    console.error("Could not find Perumahan ID. Stopping.");
    return;
  }
  console.log(`   - Perumahan ID: ${pId}`);

  console.log("2. Creating Warga...");
  const { error: wError } = await adminClient
    .from('warga')
    .insert([
      { nama: 'Budi Santoso', blok: 'A1/05', perumahan_id: pId, status_hunian: 'Pemilik' },
      { nama: 'Siti Aminah', blok: 'B2/12', perumahan_id: pId, status_hunian: 'Pemilik' },
      { nama: 'Andi Wijaya', blok: 'C3/08', perumahan_id: pId, status_hunian: 'Kontrak' }
    ]);

  if (wError) console.error("   - Error creating warga:", wError.message);
  else console.log("   - Created 3 dummy residents.");

  console.log("3. Creating Arus Kas...");
  const { error: kError } = await adminClient
    .from('arus_kas')
    .insert([
      { keterangan: 'Saldo Awal Paguyuban', jumlah: 5000000, tipe: 'Masuk', kategori: 'Iuran', saldo_after: 5000000, tanggal: new Date().toISOString(), perumahan_id: pId },
      { keterangan: 'Biaya Kebersihan Taman', jumlah: 250000, tipe: 'Keluar', kategori: 'Operasional', saldo_after: 4750000, tanggal: new Date().toISOString(), perumahan_id: pId }
    ]);

  if (kError) console.error("   - Error creating arus kas:", kError.message);
  else console.log("   - Created initial cash flow records.");

  console.log("\nDone! Seeding process finished successfully.");
}

seed();
