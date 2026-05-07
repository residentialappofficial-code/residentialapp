import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getEmails() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role, nama')
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log('Registered Users:')
  console.table(data)
}

getEmails()
