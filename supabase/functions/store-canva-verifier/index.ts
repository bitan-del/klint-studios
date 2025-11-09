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

      // Fallback: If no session ID or not found, search ALL canva_pkce keys
      if (redirectUri) {
        console.log('🔍 Fallback: Searching ALL canva_pkce keys for redirect URI')
        console.log('📍 Redirect URI:', redirectUri)
        
        // Get ALL canva_pkce keys (both verifier_* and timestamp keys)
        const { data: allKeys, error: searchError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at')
          .like('setting_key', 'canva_pkce%')
          .order('updated_at', { ascending: false })
          .limit(20)

        if (searchError) {
          console.error('❌ Error searching for verifiers:', searchError)
        } else {
          console.log(`📊 Found ${allKeys?.length || 0} total canva_pkce keys`)
        }

        if (allKeys && allKeys.length > 0) {
          const now = Date.now()
          let bestMatch: any = null
          let bestAge = Infinity
          
          // Find the most recent valid verifier
          for (const item of allKeys) {
            try {
              const verifierData = JSON.parse(item.setting_value)
              if (!verifierData.verifier) {
                console.log('⚠️ Key has no verifier:', item.setting_key)
                continue
              }
              
              const age = now - (verifierData.timestamp || 0)
              const redirectUriInData = verifierData.redirect_uri || verifierData.redirectUri || ''
              
              // Check if redirect URI matches (or not set)
              const matchesRedirect = !redirectUriInData || 
                                     redirectUriInData === redirectUri
              
              const isRecent = age < 10 * 60 * 1000
              
              console.log(`🔍 Checking key: ${item.setting_key}`)
              console.log(`  - Age: ${Math.round(age / 1000)}s`)
              console.log(`  - Redirect URI in data: ${redirectUriInData || 'none'}`)
              console.log(`  - Request redirect URI: ${redirectUri}`)
              console.log(`  - Matches redirect: ${matchesRedirect}`)
              console.log(`  - Is recent: ${isRecent}`)
              
              // Must be less than 10 minutes old
              if (matchesRedirect && isRecent && age < bestAge) {
                bestMatch = { item, verifierData, age }
                bestAge = age
                console.log(`✅ Found valid match: ${item.setting_key}`)
              } else {
                console.log(`❌ Key rejected: matchesRedirect=${matchesRedirect}, isRecent=${isRecent}`)
              }
            } catch (e) {
              console.warn('⚠️ Could not parse verifier data for key:', item.setting_key, e)
              // Skip invalid entries
              continue
            }
          }
          
          if (bestMatch) {
            console.log('✅ Found verifier by fallback search')
            console.log('📍 Matched key:', bestMatch.item.setting_key)
            console.log('📍 Age:', Math.round(bestMatch.age / 1000), 'seconds')
            
            // Clean up this entry
            await supabase
              .from('admin_settings')
              .delete()
              .eq('setting_key', bestMatch.item.setting_key)
            
            return new Response(
              JSON.stringify({ verifier: bestMatch.verifierData.verifier }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            console.log('❌ No valid verifier found with redirect URI match (checked', allKeys.length, 'keys)')
            
            // LAST RESORT: Use most recent verifier regardless of redirect URI (if less than 10 min old)
            console.log('🔍 LAST RESORT: Trying most recent verifier regardless of redirect URI...')
            for (const item of allKeys) {
              try {
                const verifierData = JSON.parse(item.setting_value)
                if (verifierData.verifier) {
                  const age = now - (verifierData.timestamp || 0)
                  if (age < 10 * 60 * 1000) {
                    console.log('✅ Using most recent verifier as last resort:', item.setting_key)
                    console.log('📍 Age:', Math.round(age / 1000), 'seconds')
                    
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
                }
              } catch (e) {
                continue
              }
            }
            
            console.log('❌ No recent verifiers found at all')
          }
        } else {
          console.log('❌ No canva_pkce keys found in database')
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

      console.log('📥 POST request received to store verifier')
      console.log('📍 Session ID:', session_id)
      console.log('📍 Redirect URI:', redirect_uri || 'not provided')
      console.log('📍 Verifier length:', verifier?.length || 0)

      if (!session_id || !verifier) {
        console.error('❌ Missing required parameters')
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

      const sessionKey = `canva_pkce_verifier_${session_id}`
      console.log('💾 Storing verifier with session ID key:', sessionKey)

      // Store with session ID key (primary)
      const { error: storeError, data: storeData } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: sessionKey,
          setting_value: verifierData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        })

      if (storeError) {
        console.error('❌ Error storing verifier:', storeError)
        return new Response(
          JSON.stringify({ error: 'Failed to store verifier', details: storeError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Primary key stored successfully')

      // Also store with redirect URI + timestamp key for fallback retrieval
      if (redirect_uri) {
        const redirectUriHash = redirect_uri.replace(/[^a-zA-Z0-9]/g, '_')
        const timestampKey = `canva_pkce_${redirectUriHash}_${Date.now()}`
        console.log('💾 Storing fallback key:', timestampKey)
        
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
          console.warn('⚠️ Warning: Could not store fallback key:', fallbackError)
          // Don't fail the request, primary key is stored
        } else {
          console.log('✅ Fallback key stored successfully')
        }
      } else {
        console.warn('⚠️ No redirect URI provided, skipping fallback key storage')
      }

      console.log('✅ Verifier storage complete')
      return new Response(
        JSON.stringify({ success: true, session_id, keys_stored: redirect_uri ? 2 : 1 }),
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

