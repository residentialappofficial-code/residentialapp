
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAssets() {
  const { data, error } = await supabase.from('aset_komplek').select('*').limit(5)
  if (error) console.error('Error:', error)
  else console.log('Assets:', data)
}

checkAssets()
