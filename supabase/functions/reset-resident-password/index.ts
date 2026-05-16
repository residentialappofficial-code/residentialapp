import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request from browser
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Initialize Supabase admin client using the Service Role Key
    // Service Role Key is required to bypass RLS and use auth.admin API
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { wargaId, newPassword } = await req.json();

    if (!wargaId || !newPassword) {
      throw new Error("wargaId and newPassword are required.");
    }

    // Step 1: Find the user_id corresponding to this wargaId
    const { data: warga, error: wargaError } = await supabaseAdmin
      .from('warga')
      .select('user_id')
      .eq('id', wargaId)
      .single();

    if (wargaError || !warga?.user_id) {
       return new Response(JSON.stringify({ error: 'Resident not found or has no active account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Step 2: Use the Auth Admin API to forcibly change their password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      warga.user_id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Step 3: Return success
    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
