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

    const clientId = clientIdData.setting_value.replace(/"/g, '')
    const clientSecret = clientSecretData.setting_value.replace(/"/g, '')

    // Exchange authorization code for access token using Basic Authentication
    // According to Canva docs: https://canva.dev/docs/connect/authentication
    const auth = btoa(`${clientId}:${clientSecret}`)

    const tokenResponse = await fetch(`${CANVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        code_verifier,
        // Note: client_id and client_secret are NOT in body, they're in Authorization header
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Canva token exchange error:', errorText)
      throw new Error(`Canva token exchange failed: ${tokenResponse.statusText} - ${errorText}`)
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

