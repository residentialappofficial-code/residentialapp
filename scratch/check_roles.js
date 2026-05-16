import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkWargaRole() {
  const { data, error } = await supabase
    .from('perumahan_roles')
    .select('*')
    .ilike('name', 'warga');
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Warga Roles found:", JSON.stringify(data, null, 2));
}

checkWargaRole();
