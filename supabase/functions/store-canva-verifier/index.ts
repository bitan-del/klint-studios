import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle GET request - retrieve verifier
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionId = url.searchParams.get('session_id')

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'Missing session_id parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Retrieve verifier from database
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', `canva_pkce_verifier_${sessionId}`)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Verifier not found or expired' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Parse and return verifier
      try {
        const verifierData = JSON.parse(data.setting_value)
        // Clean up after retrieval
        await supabase
          .from('admin_settings')
          .delete()
          .eq('setting_key', `canva_pkce_verifier_${sessionId}`)

        return new Response(
          JSON.stringify({ verifier: verifierData.verifier }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid verifier data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle POST request - store verifier
    if (req.method === 'POST') {
      const { session_id, verifier, redirect_uri } = await req.json()

      if (!session_id || !verifier) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: session_id, verifier' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Store verifier in database with 10 minute expiry
      const verifierData = JSON.stringify({
        verifier,
        redirect_uri: redirect_uri || '',
        timestamp: Date.now(),
      })

      const { error: storeError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: `canva_pkce_verifier_${session_id}`,
          setting_value: verifierData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        })

      if (storeError) {
        console.error('Error storing verifier:', storeError)
        return new Response(
          JSON.stringify({ error: 'Failed to store verifier' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

