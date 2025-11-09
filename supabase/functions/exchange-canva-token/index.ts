import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CANVA_AUTH_BASE = 'https://www.canva.com/api'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri, code_verifier } = await req.json()

    if (!code || !redirect_uri || !code_verifier) {
      throw new Error('Missing required parameters: code, redirect_uri, code_verifier')
    }

    // Get Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Canva credentials from admin_settings
    const { data: clientIdData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'canva_client_id')
      .single()

    const { data: clientSecretData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'canva_client_secret')
      .single()

    if (!clientIdData || !clientSecretData) {
      throw new Error('Canva client ID and secret not configured in admin settings')
    }

    const clientId = clientIdData.setting_value.replace(/"/g, '').trim()
    const clientSecret = clientSecretData.setting_value.replace(/"/g, '').trim()

    // Log request details (without exposing secrets)
    console.log('🔄 Exchanging code for token with Canva...')
    console.log('📍 Client ID:', clientId.substring(0, 10) + '...')
    console.log('📍 Redirect URI:', redirect_uri)
    console.log('📍 Code length:', code.length)
    console.log('📍 Code verifier length:', code_verifier.length)

    // Exchange authorization code for access token using Basic Authentication
    // According to Canva docs: https://canva.dev/docs/connect/authentication
    const auth = btoa(`${clientId}:${clientSecret}`)

    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      code_verifier,
      // Note: client_id and client_secret are NOT in body, they're in Authorization header
    })

    console.log('📤 Request body params:', {
      grant_type: 'authorization_code',
      code: code.substring(0, 20) + '...',
      redirect_uri: redirect_uri,
      redirect_uri_length: redirect_uri.length,
      code_verifier_length: code_verifier.length,
      code_verifier_preview: code_verifier.substring(0, 20) + '...',
    })
    console.log('⚠️ CRITICAL: redirect_uri MUST match exactly what was used in authorization request!')
    console.log('📍 Redirect URI being sent:', redirect_uri)

    const tokenResponse = await fetch(`${CANVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: requestBody.toString(),
    })

    console.log('📥 Canva response status:', tokenResponse.status, tokenResponse.statusText)
    console.log('📥 Canva response headers:', Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Canva token exchange error:')
      console.error('  - Status:', tokenResponse.status, tokenResponse.statusText)
      console.error('  - Response (first 500 chars):', errorText.substring(0, 500))
      
      // Try to parse as JSON if possible
      let errorMessage = `Canva token exchange failed: ${tokenResponse.statusText}`
      let errorDetails = ''
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorMessage = `Canva error: ${errorJson.error}`
          errorDetails = errorJson.error_description || ''
        }
      } catch {
        // Not JSON, it's HTML - Canva returned an error page
        console.error('❌ Canva returned HTML error page instead of JSON')
        console.error('❌ This usually means:')
        console.error('   1. redirect_uri does not match exactly')
        console.error('   2. code_verifier does not match code_challenge')
        console.error('   3. Authorization code is invalid/expired')
        console.error('   4. Client credentials are incorrect')
        
        if (errorText.includes('Forbidden') || errorText.includes('403')) {
          errorMessage = 'Canva rejected the request (403 Forbidden). Most likely causes:'
          errorDetails = '1) Redirect URI does not match exactly what was used in authorization request\n2) Code verifier does not match the code challenge\n3) Authorization code expired or invalid'
        } else if (errorText.includes('Bad Request') || errorText.includes('400')) {
          errorMessage = 'Canva rejected the request (400 Bad Request). Most likely causes:'
          errorDetails = '1) Redirect URI mismatch - must match EXACTLY (including trailing slashes, http vs https)\n2) Code verifier mismatch\n3) Missing or invalid parameters'
        } else {
          errorMessage = 'Canva returned an error page'
          errorDetails = `Status: ${tokenResponse.status}. Check that redirect_uri matches exactly.`
        }
      }
      
      console.error('❌ Full error details:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        redirect_uri_used: redirect_uri,
        error_message: errorMessage,
        error_details: errorDetails,
      })
      
      throw new Error(errorMessage)
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('No access token received from Canva')
    }

    // Save tokens to database
    // Note: setting_value should be stored as string, not JSON stringified if it's already a string
    const accessTokenValue = typeof tokenData.access_token === 'string' 
      ? tokenData.access_token 
      : JSON.stringify(tokenData.access_token);
    
    const { error: accessTokenError } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: 'canva_access_token',
        setting_value: accessTokenValue,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      })

    if (accessTokenError) {
      console.error('Error saving access token:', accessTokenError)
      // Log but don't throw - we still want to return the token to the client
      console.warn('⚠️ Could not save access token to database, but returning token to client')
    } else {
      console.log('✅ Access token saved to database')
    }

    if (tokenData.refresh_token) {
      const refreshTokenValue = typeof tokenData.refresh_token === 'string'
        ? tokenData.refresh_token
        : JSON.stringify(tokenData.refresh_token);
        
      const { error: refreshTokenError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'canva_refresh_token',
          setting_value: refreshTokenValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        })

      if (refreshTokenError) {
        console.error('Error saving refresh token:', refreshTokenError)
        // Don't throw error for refresh token, access token is more important
      } else {
        console.log('✅ Refresh token saved to database')
      }
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        expires_in: tokenData.expires_in,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error exchanging Canva token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

