import { createClient } from '@supabase/supabase-js'

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { email, password, profileData } = body;

    if (!email || !password || !profileData) {
      return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), { status: 400 });
    }

    // Gunakan Service Role Key untuk bypass konfirmasi email dan registrasi admin
    // SERVICE_ROLE_KEY harus di-set di dashboard Cloudflare (Settings > Functions > Variables)
    const supabaseAdmin = createClient(
      env.VITE_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY, // Ambil dari env
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Langsung konfirmasi agar warga bisa langsung login
      user_metadata: { nama: profileData.nama }
    });

    if (authError) throw authError;

    // 2. Create Warga Record
    const { error: profileError } = await supabaseAdmin
      .from('warga')
      .insert([{
        ...profileData,
        user_id: authUser.user.id,
        email: email
      }]);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Warga dan akun login berhasil dibuat' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
