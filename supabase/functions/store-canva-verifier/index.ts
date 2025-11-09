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
      const redirectUri = url.searchParams.get('redirect_uri')

      // Try with session ID first
      if (sessionId) {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', `canva_pkce_verifier_${sessionId}`)
          .single()

        if (!error && data) {
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
            // Continue to fallback
          }
        }
      }

      // Fallback: If no session ID or not found, try to get most recent for redirect URI
      if (redirectUri) {
        console.log('🔍 Fallback: Searching for verifier by redirect URI')
        const redirectUriHash = redirectUri.replace(/[^a-zA-Z0-9]/g, '_')
        
        // Get all verifiers for this redirect URI (keys starting with canva_pkce_)
        const { data: allVerifiers, error: searchError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at')
          .like('setting_key', `canva_pkce_${redirectUriHash}_%`)
          .order('updated_at', { ascending: false })
          .limit(5)

        if (!searchError && allVerifiers && allVerifiers.length > 0) {
          // Find the most recent one within last 10 minutes
          const now = Date.now()
          for (const item of allVerifiers) {
            try {
              const verifierData = JSON.parse(item.setting_value)
              const age = now - (verifierData.timestamp || 0)
              
              // Only use if it's for the correct redirect URI and less than 10 minutes old
              if ((verifierData.redirectUri === redirectUri || !verifierData.redirectUri) && age < 10 * 60 * 1000) {
                console.log('✅ Found verifier by redirect URI fallback')
                // Clean up
                await supabase
                  .from('admin_settings')
                  .delete()
                  .eq('setting_key', item.setting_key)
                
                return new Response(
                  JSON.stringify({ verifier: verifierData.verifier }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }
            } catch (e) {
              // Skip invalid entries
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ error: 'Verifier not found or expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

