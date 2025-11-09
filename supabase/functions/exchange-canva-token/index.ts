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

    // Parse JSON values - setting_value is a JSON type column
    let clientId: string
    let clientSecret: string
    
    try {
      // If it's already a string, use it directly
      // If it's JSON, parse it
      if (typeof clientIdData.setting_value === 'string') {
        clientId = clientIdData.setting_value
        // Remove quotes if JSON stringified
        if (clientId.startsWith('"') && clientId.endsWith('"')) {
          clientId = JSON.parse(clientId)
        }
      } else {
        // It's already parsed JSON
        clientId = String(clientIdData.setting_value)
      }
    } catch (e) {
      // Fallback: treat as string
      clientId = String(clientIdData.setting_value)
    }
    
    try {
      if (typeof clientSecretData.setting_value === 'string') {
        clientSecret = clientSecretData.setting_value
        // Remove quotes if JSON stringified
        if (clientSecret.startsWith('"') && clientSecret.endsWith('"')) {
          clientSecret = JSON.parse(clientSecret)
        }
      } else {
        // It's already parsed JSON
        clientSecret = String(clientSecretData.setting_value)
      }
    } catch (e) {
      // Fallback: treat as string
      clientSecret = String(clientSecretData.setting_value)
    }
    
    clientId = clientId.trim()
    clientSecret = clientSecret.trim()
    
    console.log('🔍 Raw client ID type:', typeof clientIdData.setting_value)
    console.log('🔍 Raw client secret type:', typeof clientSecretData.setting_value)
    console.log('🔍 Parsed client ID length:', clientId.length)
    console.log('🔍 Parsed client secret length:', clientSecret.length)
    
    // Validate credentials format
    if (!clientId || clientId.length < 5) {
      throw new Error('Invalid client ID format')
    }
    if (!clientSecret || clientSecret.length < 10) {
      throw new Error('Invalid client secret format')
    }
    
    console.log('🔑 Client credentials loaded:')
    console.log('  - Client ID length:', clientId.length)
    console.log('  - Client ID format:', clientId.startsWith('OC-') ? 'Valid (OC- prefix)' : 'Unknown format')
    console.log('  - Client Secret length:', clientSecret.length)

    // Log request details (without exposing secrets)
    console.log('🔄 Exchanging code for token with Canva...')
    console.log('📍 Client ID:', clientId.substring(0, 10) + '...')
    console.log('📍 Redirect URI:', redirect_uri)
    console.log('📍 Code length:', code.length)
    console.log('📍 Code verifier length:', code_verifier.length)

    // Exchange authorization code for access token using Basic Authentication
    // According to Canva docs: https://canva.dev/docs/connect/authentication
    const auth = btoa(`${clientId}:${clientSecret}`)

    // Ensure redirect_uri is exactly as it should be (no encoding issues)
    const normalizedRedirectUri = redirect_uri.trim()
    
    // Use URLSearchParams - it handles encoding correctly
    // The redirect_uri should be the exact same string (not re-encoded)
    // URLSearchParams will encode it the same way as in the authorization URL
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: normalizedRedirectUri, // Same exact string as used in authorization URL
      code_verifier,
    })
    const requestBodyStr = requestBody.toString()
    
    console.log('📤 Request body params:', {
      grant_type: 'authorization_code',
      code: code.substring(0, 20) + '...',
      redirect_uri: normalizedRedirectUri,
      redirect_uri_length: normalizedRedirectUri.length,
      redirect_uri_bytes: new TextEncoder().encode(normalizedRedirectUri).length,
      code_verifier_length: code_verifier.length,
      code_verifier_preview: code_verifier.substring(0, 20) + '...',
    })
    console.log('⚠️ CRITICAL: redirect_uri MUST match exactly what was used in authorization request!')
    console.log('📍 Redirect URI being sent:', normalizedRedirectUri)
    console.log('📍 Redirect URI length:', normalizedRedirectUri.length)
    console.log('📍 Redirect URI (raw JSON):', JSON.stringify(normalizedRedirectUri))
    console.log('📍 Redirect URI (URL encoded):', encodeURIComponent(normalizedRedirectUri))
    console.log('📍 Redirect URI (bytes):', new TextEncoder().encode(normalizedRedirectUri).length)
    console.log('📍 Code verifier length:', code_verifier.length)
    console.log('📍 Code verifier (first 20 chars):', code_verifier.substring(0, 20) + '...')
    console.log('📍 Client ID (first 10 chars):', clientId.substring(0, 10) + '...')
    console.log('📍 Client ID length:', clientId.length)
    console.log('📍 Client Secret length:', clientSecret.length)
    
    // Log the request body
    console.log('📤 Request body string (first 300 chars):', requestBodyStr.substring(0, 300))
    console.log('📤 Request body contains redirect_uri:', requestBodyStr.includes(normalizedRedirectUri) ? 'YES (raw)' : 'NO')
    console.log('📤 Request body contains encoded redirect_uri:', requestBodyStr.includes(encodeURIComponent(normalizedRedirectUri)) ? 'YES (encoded)' : 'NO')

    // Canva token endpoint - must be /api/oauth/token (matches authorization endpoint pattern)
    // Authorization endpoint is /api/oauth/authorize, so token endpoint is /api/oauth/token
    const tokenEndpoint = `${CANVA_AUTH_BASE}/oauth/token`
    console.log('📍 Token endpoint URL:', tokenEndpoint)
    console.log('📍 Matches Canva OAuth endpoint pattern: /api/oauth/token')
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json', // Request JSON response
      },
      body: requestBodyStr, // URLSearchParams handles encoding correctly
    })

    console.log('📥 Canva response status:', tokenResponse.status, tokenResponse.statusText)
    console.log('📥 Canva response headers:', Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Canva token exchange error:')
      console.error('  - Status:', tokenResponse.status, tokenResponse.statusText)
      console.error('  - Response length:', errorText.length)
      console.error('  - Response (first 1000 chars):', errorText.substring(0, 1000))
      console.error('  - Full response:', errorText)
      
      // Log what we sent for comparison
      console.error('📤 What we sent to Canva:')
      console.error('  - Endpoint:', tokenEndpoint)
      console.error('  - Redirect URI:', normalizedRedirectUri)
      console.error('  - Code length:', code.length)
      console.error('  - Code verifier length:', code_verifier.length)
      console.error('  - Client ID length:', clientId.length)
      console.error('  - Request body:', requestBodyStr)
      
      // Try to parse as JSON if possible
      let errorMessage = `Canva token exchange failed: ${tokenResponse.statusText}`
      let errorDetails = ''
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorMessage = `Canva error: ${errorJson.error}`
          errorDetails = errorJson.error_description || errorJson.message || ''
          console.error('❌ Canva error details (JSON):', {
            error: errorJson.error,
            error_description: errorJson.error_description,
            error_uri: errorJson.error_uri,
            full_response: errorJson
          })
        }
      } catch {
        // Not JSON, it's HTML - Canva returned an error page
        console.error('❌ Canva returned HTML error page instead of JSON')
        console.error('❌ This usually means:')
        console.error('   1. redirect_uri does not match exactly')
        console.error('   2. code_verifier does not match code_challenge')
        console.error('   3. Authorization code is invalid/expired')
        console.error('   4. Client credentials are incorrect')
        console.error('   5. Token endpoint URL is wrong')
        
        if (errorText.includes('Forbidden') || errorText.includes('403')) {
          errorMessage = 'Canva rejected the request (403 Forbidden). Most likely causes:'
          errorDetails = '1) Redirect URI does not match exactly what was used in authorization request\n2) Code verifier does not match the code challenge\n3) Authorization code expired or invalid\n4) Client credentials incorrect\n5) Token endpoint URL incorrect'
        } else if (errorText.includes('Bad Request') || errorText.includes('400')) {
          errorMessage = 'Canva rejected the request (400 Bad Request). Most likely causes:'
          errorDetails = '1) Redirect URI mismatch - must match EXACTLY (including trailing slashes, http vs https)\n2) Code verifier mismatch\n3) Missing or invalid parameters'
        } else {
          errorMessage = 'Canva returned an error page'
          errorDetails = `Status: ${tokenResponse.status}. Check that redirect_uri matches exactly.`
        }
      }
      
      // Create comprehensive error object with all details
      const fullErrorDetails = {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        redirect_uri_used: normalizedRedirectUri,
        redirect_uri_length: normalizedRedirectUri.length,
        code_length: code.length,
        code_verifier_length: code_verifier.length,
        client_id_length: clientId.length,
        token_endpoint: tokenEndpoint,
        error_message: errorMessage,
        error_details: errorDetails,
        canva_response: errorText.substring(0, 500), // First 500 chars of Canva's response
      }
      
      console.error('❌ Full error details:', JSON.stringify(fullErrorDetails, null, 2))
      
      // Return detailed error to client
      throw new Error(`${errorMessage}\n\nDetails: ${errorDetails}\n\nCanva Response: ${errorText.substring(0, 200)}`)
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

