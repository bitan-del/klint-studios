import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Initialize Vertex AI client
async function getVertexAIClient() {
  console.log('🔧 Getting Vertex AI client configuration...')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey
    })
    throw new Error('Supabase environment variables not configured in Edge Function')
  }
  
  console.log('✅ Supabase client initialized')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Get Vertex AI config from database
  console.log('📊 Fetching Vertex AI config from database...')
  const { data: projectIdData, error: projectIdError } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'vertex_project_id')
    .single()

  const { data: locationData, error: locationError } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'vertex_location')
    .single()

  if (projectIdError) {
    console.warn('⚠️ Error fetching project_id from database:', projectIdError.message)
  }
  if (locationError) {
    console.warn('⚠️ Error fetching location from database:', locationError.message)
  }

  const projectId = projectIdData?.setting_value || Deno.env.get('VERTEX_PROJECT_ID')
  const location = locationData?.setting_value || Deno.env.get('VERTEX_LOCATION') || 'us-central1'

  console.log('📋 Configuration:', {
    projectId: projectId ? `${projectId.substring(0, 10)}...` : 'NOT SET',
    location,
    source: projectIdData ? 'database' : 'environment'
  })

  if (!projectId) {
    throw new Error('Vertex AI project ID not configured. Set vertex_project_id in admin_settings or VERTEX_PROJECT_ID environment variable.')
  }
  
  return { projectId, location }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    let requestData: any
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { endpoint, ...body } = requestData

    // Log the received endpoint for debugging
    console.log('📥 Received request for endpoint:', endpoint)
    console.log('📦 Request body keys:', Object.keys(body))

    if (!endpoint) {
      console.error('❌ Missing endpoint parameter')
      throw new Error('Missing endpoint parameter')
    }

    // Trim whitespace from endpoint name
    const trimmedEndpoint = endpoint.trim()
    console.log('🔍 Trimmed endpoint:', JSON.stringify(trimmedEndpoint))

    // Get Vertex AI config (may throw if not configured)
    let projectId: string
    let location: string
    try {
      const config = await getVertexAIClient()
      projectId = config.projectId
      location = config.location
      console.log('✅ Using Vertex AI config - Project:', projectId, 'Location:', location)
    } catch (configError: any) {
      console.error('❌ Failed to get Vertex AI config:', configError)
      return new Response(
        JSON.stringify({
          error: configError.message || 'Vertex AI configuration error',
          details: configError.toString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Health check endpoint
    if (trimmedEndpoint === 'health' || trimmedEndpoint === 'ping') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'Vertex AI Edge Function is running',
          availableEndpoints: [
            'generate-content',
            'generate-content-with-images',
            'generate-images',
            'generate-styled-image',
            'generate-video',
            'video-operation-status'
          ],
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Route to appropriate handler
    console.log('🔀 Routing endpoint:', trimmedEndpoint)
    switch (trimmedEndpoint) {
      case 'generate-content':
        console.log('🔄 Routing to handleGenerateContent')
        return await handleGenerateContent(projectId, location, body, corsHeaders)
      
      case 'generate-content-with-images':
        console.log('🔄 Routing to handleGenerateContentWithImages')
        return await handleGenerateContentWithImages(projectId, location, body, corsHeaders)
      
      case 'generate-images':
        console.log('🔄 Routing to handleGenerateImages')
        return await handleGenerateImages(projectId, location, body, corsHeaders)
      
      case 'generate-styled-image':
        console.log('🔄 Routing to handleGenerateStyledImage')
        return await handleGenerateStyledImage(projectId, location, body, corsHeaders)
      
      case 'generate-video':
        console.log('🔄 Routing to handleGenerateVideo')
        return await handleGenerateVideo(projectId, location, body, corsHeaders)
      
      case 'video-operation-status':
        console.log('🔄 Routing to handleVideoOperationStatus')
        return await handleVideoOperationStatus(projectId, location, body, corsHeaders)
      
      default:
        console.error('❌ Unknown endpoint received:', JSON.stringify(trimmedEndpoint))
        console.error('📋 Endpoint length:', trimmedEndpoint.length)
        console.error('📋 Endpoint char codes:', Array.from(trimmedEndpoint).map(c => c.charCodeAt(0)))
        console.error('📋 Available endpoints: generate-content, generate-content-with-images, generate-images, generate-styled-image, generate-video, video-operation-status')
        
        // Try case-insensitive matching as fallback
        const lowerEndpoint = trimmedEndpoint.toLowerCase()
        if (lowerEndpoint === 'generate-styled-image') {
          console.log('⚠️ Endpoint matched case-insensitively, routing to handleGenerateStyledImage')
          return await handleGenerateStyledImage(projectId, location, body, corsHeaders)
        }
        
        throw new Error(`Unknown endpoint: ${trimmedEndpoint}`)
    }
  } catch (error: any) {
    console.error('❌ Vertex AI Edge Function Error:', error)
    console.error('📊 Error stack:', error.stack)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Generate text content using Vertex AI REST API
async function handleGenerateContent(projectId: string, location: string, body: any, corsHeaders: any) {
  const { model = 'gemini-3-pro-preview-11-2025', prompt, systemInstruction } = body

  if (!prompt) {
    throw new Error('Missing prompt parameter')
  }

  // Get access token using Application Default Credentials
  // In Supabase Edge Functions, this is handled automatically
  const accessToken = await getAccessToken()

  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    ...(systemInstruction && {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    })
  }

  let response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  // If Gemini 3 Pro is not available (404), fallback to Gemini 2.5 Flash
  if (!response.ok && response.status === 404) {
    const errorText = await response.text()
    if (errorText.includes('NOT_FOUND') && model === 'gemini-3-pro-preview-11-2025') {
      console.log('⚠️ Gemini 3 Pro not available, falling back to Gemini 2.5 Flash')
      const fallbackModel = 'gemini-2.5-flash'
      const fallbackUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${fallbackModel}:generateContent`
      
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    }
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vertex AI API error: ${response.status} ${error}`)
  }

  const result = await response.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return new Response(
    JSON.stringify({ text }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Get access token for Vertex AI
async function getAccessToken(): Promise<string> {
  console.log('🔑 Getting access token...')
  
  // Option 1: Try metadata server (if running on GCP)
  try {
    const metadataResponse = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: { 'Metadata-Flavor': 'Google' }
      }
    )
    
    if (metadataResponse.ok) {
      const tokenData = await metadataResponse.json()
      console.log('✅ Got token from GCP metadata server')
      return tokenData.access_token
    }
  } catch (e) {
    // Not running on GCP, continue
    console.log('ℹ️ Not running on GCP, trying service account JSON...')
  }

  // Option 2: Use service account JSON from environment variable (Supabase Edge Function secret)
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  
  if (!serviceAccountJson) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON secret is not set!')
    console.error('   Check: Supabase Dashboard → Edge Functions → Secrets')
    throw new Error(
      'Google Cloud credentials not configured. ' +
      'Please set GOOGLE_SERVICE_ACCOUNT_JSON as an Edge Function secret in Supabase Dashboard → Edge Functions → Secrets. ' +
      'The value should be the full JSON content of your service account key file.'
    )
  }
  
  console.log('✅ GOOGLE_SERVICE_ACCOUNT_JSON secret found, parsing...')
  
  try {
    const serviceAccount = JSON.parse(serviceAccountJson)
    console.log('✅ Service account parsed, client_email:', serviceAccount.client_email)
    const token = await getTokenFromServiceAccount(serviceAccount)
    console.log('✅ Access token obtained successfully')
    return token
  } catch (e: any) {
    console.error('❌ Error parsing/using service account JSON:', e)
    console.error('   Error message:', e?.message)
    console.error('   Error stack:', e?.stack)
    throw new Error(
      `Failed to get access token from service account: ${e?.message || 'Unknown error'}. ` +
      'Please verify that GOOGLE_SERVICE_ACCOUNT_JSON secret contains valid JSON.'
    )
  }
}

// Get access token from service account JSON using JWT
async function getTokenFromServiceAccount(serviceAccount: any): Promise<string> {
  // Import JWT library for Deno
  const { create, getNumericDate } = await import('https://deno.land/x/djwt@v2.8/mod.ts')
  
  const now = getNumericDate(new Date())
  let privateKey = serviceAccount.private_key
  
  // Handle escaped newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  
  // Convert PEM to ArrayBuffer for crypto.subtle
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = privateKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
  // Base64 decode
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  // Import the private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
  
  // Create JWT payload
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  }
  
  // Create and sign JWT
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    payload,
    key
  )
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

// Generate content with images using Vertex AI REST API
async function handleGenerateContentWithImages(projectId: string, location: string, body: any, corsHeaders: any) {
  const { model = 'gemini-3-pro-preview-11-2025', prompt, images, systemInstruction } = body

  if (!prompt && (!images || images.length === 0)) {
    throw new Error('Missing prompt or images parameter')
  }

  const accessToken = await getAccessToken()

  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`

  const parts: any[] = []

  // Add images first
  if (images && Array.isArray(images)) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data, // base64 string
        },
      })
    }
  }

  // Add text prompt
  if (prompt) {
    parts.push({ text: prompt })
  }

  const requestBody = {
    contents: [{
      role: 'user',
      parts
    }],
    ...(systemInstruction && {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    })
  }

  let response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  // If Gemini 3 Pro is not available (404), fallback to Gemini 2.5 Flash
  if (!response.ok && response.status === 404) {
    const errorText = await response.text()
    if (errorText.includes('NOT_FOUND') && model === 'gemini-3-pro-preview-11-2025') {
      console.log('⚠️ Gemini 3 Pro not available, falling back to Gemini 2.5 Flash')
      const fallbackModel = 'gemini-2.5-flash'
      const fallbackUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${fallbackModel}:generateContent`
      
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    }
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vertex AI API error: ${response.status} ${error}`)
  }

  const result = await response.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return new Response(
    JSON.stringify({ text }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Generate images (Imagen) - placeholder
async function handleGenerateImages(projectId: string, location: string, body: any, corsHeaders: any) {
  const { prompt, aspectRatio = '1:1', numberOfImages = 1 } = body

  if (!prompt) {
    throw new Error('Missing prompt parameter')
  }

  // Use generate-styled-image endpoint instead
  return await handleGenerateStyledImage(projectId, location, {
    prompt,
    imageUrls: [],
    quality: 'standard',
    style: 'realistic',
    aspectRatio
  }, corsHeaders)
}

// Generate styled image using Gemini image models
async function handleGenerateStyledImage(projectId: string, location: string, body: any, corsHeaders: any) {
  const { prompt, imageUrls = [], quality = 'standard', style = 'realistic', aspectRatio = '3:4' } = body

  if (!prompt && imageUrls.length === 0) {
    throw new Error('Missing prompt or imageUrls parameter')
  }

  const accessToken = await getAccessToken()

  // Map quality to model and imageSize
  // Note: imageSize values: "1K" (~1024px), "2K" (~2048px), "4K" (~4096px) per Vertex AI docs
  // Gemini 3 Pro Image supports: 1K, 2K, 4K
  // Gemini 2.5 Flash Image: default resolution only
  const qualityMap: Record<string, { model: string; imageSize?: string; useGlobal?: boolean }> = {
    'standard': { model: 'gemini-2.5-flash-image' },
    'regular': { model: 'gemini-2.5-flash-image' },
    'hd': { model: 'gemini-3-pro-image-preview', imageSize: '1K', useGlobal: true },
    'qhd': { model: 'gemini-3-pro-image-preview', imageSize: '2K', useGlobal: true },
    'uhd': { model: 'gemini-3-pro-image-preview', imageSize: '4K', useGlobal: true }
  }

  const config = qualityMap[quality] || qualityMap['standard']
  let model = config.model
  const imageSize = config.imageSize
  const useGlobal = config.useGlobal || false
  
  // Gemini 3 Pro Image Preview requires 'global' location, not regional
  const effectiveLocation = useGlobal ? 'global' : location
  console.log(`📊 Quality: ${quality}, Model: ${model}, ImageSize: ${imageSize || 'default'}, Location: ${effectiveLocation}`)

  // Build parts array
  const parts: any[] = []

  // Add reference images first
  for (const imageUrl of imageUrls) {
    try {
      // Process image - expect base64 data URL
      let imageData: string
      let mimeType: string
      
      if (imageUrl.startsWith('data:')) {
        // Full data URL format: data:image/png;base64,...
        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          mimeType = match[1]
          imageData = match[2]
        } else {
          // Fallback: try to extract
          const parts = imageUrl.split(',')
          imageData = parts[1] || imageUrl
          mimeType = imageUrl.match(/^data:([^;]+)/)?.[1] || 'image/png'
        }
      } else {
        // Assume it's already base64 without prefix
        imageData = imageUrl
        mimeType = 'image/png'
      }
      
      parts.push({
        inlineData: {
          mimeType,
          data: imageData
        }
      })
    } catch (error) {
      console.warn('Error processing reference image:', error)
    }
  }

  // Add text prompt
  if (prompt) {
    parts.push({ text: prompt })
  }

  // Build request body
  const requestBody: any = {
    contents: [{
      role: 'user',
      parts
    }],
    generationConfig: {
      responseModalities: ['IMAGE']
    }
  }

  // Add imageConfig for aspect ratio and size
  // Create imageConfig if we have either aspectRatio OR imageSize
  if (aspectRatio || (imageSize && model === 'gemini-3-pro-image-preview')) {
    requestBody.generationConfig.imageConfig = {}
    
    // Add aspect ratio if provided
    if (aspectRatio) {
      requestBody.generationConfig.imageConfig.aspectRatio = aspectRatio
    }
    
    // Add imageSize for gemini-3-pro-image-preview (supports 1K, 2K, 4K)
    if (imageSize && model === 'gemini-3-pro-image-preview') {
      requestBody.generationConfig.imageConfig.imageSize = imageSize
      console.log(`📐 Setting imageSize to: ${imageSize}`)
    }
  }

  // Try primary model first, fallback if needed
  // Gemini 3 Pro Image Preview uses 'global' endpoint (no regional prefix)
  // For global: https://aiplatform.googleapis.com/.../locations/global/...
  // For regional: https://us-central1-aiplatform.googleapis.com/.../locations/us-central1/...
  let apiUrl: string
  if (effectiveLocation === 'global') {
    apiUrl = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${model}:generateContent`
  } else {
    apiUrl = `https://${effectiveLocation}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${effectiveLocation}/publishers/google/models/${model}:generateContent`
  }
  console.log(`🌐 API URL: ${apiUrl}`)
  
  let response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  // Handle errors for Gemini 3 Pro Image
  if (!response.ok && model === 'gemini-3-pro-image-preview') {
    const errorText = await response.text().catch(() => 'Could not read error')
    let errorData: any = {}
    try {
      errorData = JSON.parse(errorText)
    } catch (e) {
      // Not JSON, use raw text
    }
    
    console.error(`❌ Gemini 3 Pro Image error (${response.status}):`, errorText)
    
    // Handle 429 (Rate Limit / Quota Exhausted) - retry with backoff before falling back
    if (response.status === 429) {
      console.log('⚠️ Rate limit (429) detected, retrying with exponential backoff...')
      
      // Retry up to 3 times with exponential backoff (2s, 4s, 8s)
      let retrySuccess = false
      for (let retry = 0; retry < 3; retry++) {
        const delay = Math.pow(2, retry + 1) * 1000 // 2s, 4s, 8s
        console.log(`⏳ Retry ${retry + 1}/3: Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Retry the same request
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
        
        if (response.ok) {
          console.log(`✅ Retry ${retry + 1} successful!`)
          retrySuccess = true
          break
        }
        
        // If still 429, continue to next retry
        if (response.status === 429) {
          const retryErrorText = await response.text().catch(() => '')
          console.log(`⚠️ Retry ${retry + 1} still got 429, will retry again...`)
        } else {
          // Different error, break and handle below
          break
        }
      }
      
      // If all retries failed, fall back to Gemini 2.5 Flash
      if (!retrySuccess && response.status === 429) {
        console.log('⚠️ All retries exhausted, falling back to Gemini 2.5 Flash Image')
        model = 'gemini-2.5-flash-image'
        // Remove imageSize for flash model and use regional location
        if (requestBody.generationConfig.imageConfig) {
          delete requestBody.generationConfig.imageConfig.imageSize
        }
        apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`
        console.log(`🔄 Fallback URL: ${apiUrl}`)
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      }
    }
    // Try fallback if it's a 404 or 403
    else if (response.status === 404 || response.status === 403) {
      console.log('⚠️ Gemini 3 Pro Image not available, falling back to Gemini 2.5 Flash Image')
      model = 'gemini-2.5-flash-image'
      // Remove imageSize for flash model and use regional location
      if (requestBody.generationConfig.imageConfig) {
        delete requestBody.generationConfig.imageConfig.imageSize
      }
      apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`
      console.log(`🔄 Fallback URL: ${apiUrl}`)
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    } else {
      // For other errors, throw with details
      const errorMessage = errorData?.error?.message || errorText || 'Unknown error'
      throw new Error(`Vertex AI API error: ${response.status} - ${errorMessage}`)
    }
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vertex AI API error: ${response.status} ${error}`)
  }

  const result = await response.json()
  
  // Extract image from response
  if (result.candidates && result.candidates.length > 0) {
    for (const candidate of result.candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64Image = part.inlineData.data
            const mimeType = part.inlineData.mimeType
            const imageDataUrl = `data:${mimeType};base64,${base64Image}`
            
            return new Response(
              JSON.stringify({ image: imageDataUrl }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
        }
      }
    }
  }

  throw new Error('No image generated from Vertex AI response')
}

// Generate video (Veo)
async function handleGenerateVideo(projectId: string, location: string, body: any, corsHeaders: any) {
  const { prompt, aspectRatio, resolution, sourceImage } = body

  if (!prompt) {
    throw new Error('Missing prompt parameter')
  }

  // Veo API implementation
  // TODO: Implement based on actual Vertex AI Veo API structure
  // This is a placeholder
  
  return new Response(
    JSON.stringify({
      operation: {
        name: `operations/veo-${Date.now()}`,
        done: false,
        metadata: {
          '@type': 'type.googleapis.com/google.cloud.aiplatform.v1.GenerateVideoOperationMetadata'
        }
      },
      message: 'Video generation endpoint - needs implementation based on Vertex AI Veo API'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Get video operation status
async function handleVideoOperationStatus(projectId: string, location: string, body: any, corsHeaders: any) {
  const { operationName } = body

  if (!operationName) {
    throw new Error('Missing operationName parameter')
  }

  // TODO: Implement actual operation status check
  // This is a placeholder
  
  return new Response(
    JSON.stringify({
      operation: {
        name: operationName,
        done: false,
        response: null
      },
      message: 'Video operation status check - needs implementation'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
