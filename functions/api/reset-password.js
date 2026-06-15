import { createClient } from '@supabase/supabase-js'

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email dan password baru wajib diisi' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      env.VITE_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // List users to find the target email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Email tidak ditemukan di dalam sistem.' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the password and auto-confirm the email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: password, 
        email_confirm: true 
      }
    );

    if (updateError) throw updateError;

    // Check if the user profile row exists in public.profiles, otherwise create it
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', targetUser.id)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from('profiles').insert([{
        id: targetUser.id,
        email: email.toLowerCase(),
        nama: targetUser.user_metadata?.nama || 'User',
        role: targetUser.user_metadata?.role || 'warga'
      }]);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Kata sandi berhasil diperbarui.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
