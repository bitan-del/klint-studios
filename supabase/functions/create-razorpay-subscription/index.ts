import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, userId } = await req.json()

    // Get Razorpay credentials from environment or database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Razorpay keys from admin_settings
    const { data: keyData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'razorpay_key_id')
      .single()

    const { data: secretData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'razorpay_key_secret')
      .single()

    if (!keyData || !secretData) {
      throw new Error('Razorpay credentials not configured')
    }

    const keyId = keyData.setting_value.replace(/"/g, '')
    const keySecret = secretData.setting_value.replace(/"/g, '')

    // Get plan ID from mapping
    const planIds: Record<string, string> = {
      solo: 'plan_RWEqJmL9v1aJu2',    // Solo ₹999/year (₹1,178.82 with GST)
      studio: 'plan_RWEr3jmdBjVExE',  // Studio ₹2,999/year
      brand: 'plan_RWErZhQtFet8FP',   // Brand ₹4,999/year
    }

    const planId = planIds[plan]
    if (!planId) {
      throw new Error('Invalid plan')
    }

    // Get user details
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    // Create subscription in Razorpay
    const auth = btoa(`${keyId}:${keySecret}`)
    
    const subscriptionData: any = {
      plan_id: planId,
      customer_notify: 1,
      total_count: 1, // 1 year
      quantity: 1,
      notes: {
        user_id: userId,
        plan: plan,
      },
    }

    // Note: Trial periods are handled in the plan configuration, not here

    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Razorpay error:', result)
      throw new Error(result.error?.description || 'Failed to create subscription')
    }

    return new Response(
      JSON.stringify({ subscription_id: result.id, short_url: result.short_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

