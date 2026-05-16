import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase
    .from('warga')
    .select('id, blok, tgl_serah_terima, blok_id')
    .limit(10)
  
  if (error) console.error(error)
  else console.table(data)

  const { data: blocks, error: bErr } = await supabase
    .from('blok')
    .select('id, blok_no, tgl_serah_terima')
    .limit(10)
    
  if (bErr) console.error(bErr)
  else console.table(blocks)
}

check()
