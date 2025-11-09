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
        console.log('📍 Redirect URI:', redirectUri)
        
        // Strategy 1: Search for timestamp keys (canva_pkce_<hash>_<timestamp>)
        const redirectUriHash = redirectUri.replace(/[^a-zA-Z0-9]/g, '_')
        const { data: timestampVerifiers, error: timestampError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at')
          .like('setting_key', `canva_pkce_${redirectUriHash}_%`)
          .order('updated_at', { ascending: false })
          .limit(10)

        // Strategy 2: Search for ALL session ID keys (canva_pkce_verifier_*) and check redirect_uri
        const { data: sessionVerifiers, error: sessionError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at')
          .like('setting_key', 'canva_pkce_verifier_%')
          .order('updated_at', { ascending: false })
          .limit(10)

        // Combine both results
        const allVerifiers = [
          ...(timestampVerifiers || []),
          ...(sessionVerifiers || [])
        ]

        if (allVerifiers.length > 0) {
          console.log(`🔍 Found ${allVerifiers.length} potential verifiers, checking...`)
          
          // Find the most recent one within last 10 minutes that matches redirect URI
          const now = Date.now()
          for (const item of allVerifiers) {
            try {
              const verifierData = JSON.parse(item.setting_value)
              const age = now - (verifierData.timestamp || 0)
              const matchesRedirect = verifierData.redirect_uri === redirectUri || 
                                     verifierData.redirectUri === redirectUri ||
                                     !verifierData.redirect_uri // Allow if redirect_uri not set
              
              // Only use if it's for the correct redirect URI and less than 10 minutes old
              if (matchesRedirect && age < 10 * 60 * 1000) {
                console.log('✅ Found verifier by redirect URI fallback')
                console.log('📍 Matched key:', item.setting_key)
                console.log('📍 Age:', Math.round(age / 1000), 'seconds')
                
                // Clean up this entry
                await supabase
                  .from('admin_settings')
                  .delete()
                  .eq('setting_key', item.setting_key)
                
                return new Response(
                  JSON.stringify({ verifier: verifierData.verifier }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              } else {
                console.log('⚠️ Verifier found but:', {
                  matchesRedirect,
                  age: Math.round(age / 1000) + 's',
                  redirect_uri: verifierData.redirect_uri || verifierData.redirectUri
                })
              }
            } catch (e) {
              console.warn('⚠️ Could not parse verifier data:', e)
              // Skip invalid entries
            }
          }
        } else {
          console.log('❌ No verifiers found in database')
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
        sessionId: session_id, // Include for reference
      })

      // Store with session ID key (primary)
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

      // Also store with redirect URI + timestamp key for fallback retrieval
      if (redirect_uri) {
        const redirectUriHash = redirect_uri.replace(/[^a-zA-Z0-9]/g, '_')
        const timestampKey = `canva_pkce_${redirectUriHash}_${Date.now()}`
        
        const { error: fallbackError } = await supabase
          .from('admin_settings')
          .upsert({
            setting_key: timestampKey,
            setting_value: verifierData,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'setting_key',
          })

        if (fallbackError) {
          console.warn('Warning: Could not store fallback key:', fallbackError)
          // Don't fail the request, primary key is stored
        } else {
          console.log('✅ Stored verifier with both session ID and timestamp keys')
        }
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

