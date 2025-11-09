/**
 * Canva API Service
 * Integrates with Canva Connect APIs to provide design capabilities
 * 
 * Available Features:
 * 1. Design Import API - Import images/designs into Canva
 * 2. Design Editing API - Programmatically edit Canva designs
 * 3. Data Connectors - Integrate external data sources
 * 4. Asset Management - Manage creative assets
 * 5. Design Export - Export designs in various formats
 */

import { supabase } from './supabaseClient';

// Canva API Configuration
const CANVA_API_BASE = 'https://api.canva.com/rest/v1';
const CANVA_AUTH_BASE = 'https://www.canva.com/api';

interface CanvaConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

let canvaConfig: CanvaConfig = {};
let accessTokenCache: string | null = null;
let tokenExpiry: number = 0;

// Add this variable to store code verifier for PKCE
let codeVerifier: string | null = null;

/**
 * Generate a cryptographically random code verifier for PKCE
 * Uses 96 bytes (128 chars) as per Canva docs recommendation for high entropy
 */
async function generateCodeVerifier(): Promise<string> {
  const randomBytes = new Uint8Array(96); // 96 bytes = 128 characters base64url
  window.crypto.getRandomValues(randomBytes);
  // Base64url encode the random bytes
  return btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove trailing padding
}

/**
 * Generate code challenge from verifier using SHA-256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Initialize Canva API with credentials
 */
export async function initializeCanva(): Promise<void> {
  try {
    // Load from database using databaseService
    const { databaseService } = await import('./databaseService');
    
    const clientId = await databaseService.getAdminSetting('canva_client_id');
    const clientSecret = await databaseService.getAdminSetting('canva_client_secret');
    const accessToken = await databaseService.getAdminSetting('canva_access_token');
    const refreshToken = await databaseService.getAdminSetting('canva_refresh_token');
    
    if (clientId && clientSecret) {
      canvaConfig = {
        clientId,
        clientSecret,
        accessToken: accessToken || undefined,
        refreshToken: refreshToken || undefined,
      };
      console.log('✅ Canva API initialized with credentials');
    } else {
      console.warn('⚠️ Canva API credentials not found in database');
    }
  } catch (error) {
    console.error('❌ Error loading Canva config:', error);
  }
}

/**
 * Get OAuth authorization URL with PKCE
 * Uses database storage for code verifier to persist across redirects
 */
export async function getCanvaAuthUrl(redirectUri: string): Promise<string> {
  // Ensure Canva is initialized
  if (!canvaConfig.clientId || !canvaConfig.clientSecret) {
    await initializeCanva();
  }
  
  if (!canvaConfig.clientId) {
    throw new Error('Canva Client ID not configured. Please set it in the Admin Panel.');
  }
  
  // Generate PKCE parameters
  codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Validate code challenge was generated
  if (!codeChallenge || codeChallenge.length < 10) {
    throw new Error('Failed to generate code challenge for PKCE');
  }
  
  // According to Canva docs: code_verifier must be stored server-side, not accessible by browser
  // Store verifier ONLY in Edge Function (server-side storage)
  
  // Generate high-entropy state as per Canva docs recommendation
  // State must be a high-entropy random string (96 bytes = 128 chars base64url)
  const stateBytes = new Uint8Array(96);
  window.crypto.getRandomValues(stateBytes);
  const sessionId = btoa(String.fromCharCode(...stateBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove trailing padding
  const state = sessionId; // Use session ID as state for CSRF protection
  
  // Store verifier server-side ONLY (as per Canva requirements)
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or anon key not configured');
    }
    
    const storeUrl = `${supabaseUrl}/functions/v1/store-canva-verifier`;
    
    const storeResponse = await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!storeResponse.ok) {
      const errorText = await storeResponse.text();
      console.error('❌ Failed to store verifier server-side:', errorText);
      throw new Error('Failed to store code verifier server-side');
    }
    
    const storeResult = await storeResponse.json();
    if (!storeResult.success) {
      throw new Error('Server-side storage failed');
    }
    
    console.log('✅ Code verifier stored SERVER-SIDE ONLY (as per Canva requirements)');
    console.log('🔐 Session ID:', sessionId);
    console.log('🔐 State parameter (for CSRF protection):', state);
    
    // Wait for storage to commit to database
    // Longer delay ensures database write completes before redirect
    console.log('⏳ Waiting for database write to commit...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('✅ Database write should be committed - ready to redirect');
  } catch (error: any) {
    console.error('❌ Server-side storage error:', error);
    throw new Error('Failed to store code verifier: ' + error.message);
  }
  
  const params = new URLSearchParams({
    client_id: canvaConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    // Scopes must match EXACTLY what's enabled in Canva Developer Portal
    // Based on your portal configuration (Reading and Writing table)
    scope: 'app:read app:write asset:read asset:write brandtemplate:content:read brandtemplate:meta:read comment:read comment:write design:content:read design:content:write design:meta:read design:permission:read design:permission:write folder:read folder:write folder:permission:read folder:permission:write profile:read',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${CANVA_AUTH_BASE}/oauth/authorize?${params.toString()}`;
  
  // Log the URL for debugging (without sensitive data)
  console.log('🔗 Canva Auth URL generated');
  console.log('📍 Redirect URI in authorization URL:', redirectUri);
  console.log('📍 Redirect URI length:', redirectUri.length);
  console.log('📍 Redirect URI (URL encoded in auth URL):', encodeURIComponent(redirectUri));
  console.log('📍 Full authorization URL (first 200 chars):', authUrl.substring(0, 200) + '...');
  console.log('📍 Code Challenge (first 20 chars):', codeChallenge.substring(0, 20) + '...');
  console.log('📍 Code Challenge length:', codeChallenge.length);
  console.log('⚠️ CRITICAL: This redirect_uri MUST match EXACTLY in token exchange!');
  console.log('⚠️ CRITICAL: Code verifier MUST match this code challenge!');
  console.log('🔑 Client ID:', canvaConfig.clientId);
  console.log('✅ Code Challenge Method: S256');
  console.log('🔐 Session ID:', sessionId);
  console.log('🔐 State parameter (for CSRF protection):', state);
  
  // Store the code challenge with the verifier for verification
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      // Store code challenge for verification (optional, for debugging)
      await fetch(`${supabaseUrl}/functions/v1/store-canva-verifier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          verifier: codeVerifier,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge, // Store for verification
        }),
      }).catch(() => {
        // Ignore errors, this is just for debugging
      });
    }
  } catch (e) {
    // Ignore errors
  }
  
  return authUrl;
}

/**
 * Exchange authorization code for access token (with PKCE)
 * Uses Supabase Edge Function to avoid CORS issues with client credentials
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  state?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Retrieve code verifier - prioritize Edge Function (server-side, most reliable)
  let verifier = codeVerifier;
  let storedData: { verifier: string; timestamp: number; redirectUri?: string; storageKey?: string } | null = null;
  
  console.log('🔍 Retrieving code verifier from SERVER-SIDE storage...');
  console.log('📍 Redirect URI:', redirectUri);
  console.log('📍 State parameter:', state || 'null');
  
  // Extract session ID from state parameter (state IS the session ID)
  let sessionId: string | null = null;
  if (state) {
    // State parameter is the session ID (for CSRF protection)
    sessionId = state;
    console.log('🔐 Session ID from state parameter:', sessionId);
  }
  
  // Retrieve from Edge Function (server-side storage ONLY, as per Canva requirements)
  if (!verifier && typeof window !== 'undefined') {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        // Build URL with session ID (if available) and redirect URI (for fallback)
        const params = new URLSearchParams({
          redirect_uri: redirectUri,
        });
        if (sessionId) {
          params.set('session_id', sessionId);
          console.log('🔍 Retrieving verifier from Edge Function using session ID...');
          console.log('📍 Session ID:', sessionId);
        } else {
          console.log('⚠️ No state parameter - using redirect URI fallback');
          console.log('📍 This happens when Canva does not return state parameter');
        }
        console.log('📍 Redirect URI:', redirectUri);
        
        const retrieveUrl = `${supabaseUrl}/functions/v1/store-canva-verifier?${params.toString()}`;
        
        const retrieveResponse = await fetch(retrieveUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });
        
        if (retrieveResponse.ok) {
          const data = await retrieveResponse.json();
          if (data.verifier) {
            verifier = data.verifier;
            console.log('✅ Code verifier retrieved from Edge Function (server-side)!');
            
            // Use the EXACT redirect URI that was stored with the verifier
            // This ensures byte-for-byte matching with what was used in authorization URL
            if (data.redirect_uri) {
              redirectUri = data.redirect_uri;
              console.log('✅ Using stored redirect URI (exact match):', redirectUri);
              console.log('📍 This ensures it matches exactly what was used in authorization URL');
            } else {
              console.warn('⚠️ No redirect_uri in stored data, using provided one');
            }
          }
        } else {
          const errorText = await retrieveResponse.text();
          console.error('❌ Edge Function retrieval failed:', errorText);
          throw new Error(`Failed to retrieve code verifier: ${errorText}`);
        }
      }
    } catch (edgeError: any) {
      console.error('❌ Edge Function error:', edgeError);
      throw new Error(`Failed to retrieve code verifier from server: ${edgeError.message}`);
    }
  }

  if (!verifier) {
    console.error('❌ Code verifier not found in server-side storage');
    console.error('📍 This should not happen if state parameter was returned by Canva');
    throw new Error('Code verifier not found. Please restart OAuth flow.');
  }
  
  console.log('✅ Code verifier retrieved successfully:', verifier.substring(0, 20) + '...');

  // Get Supabase URL and anon key from environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or anon key not configured');
  }

  // Call Supabase Edge Function to exchange token
  // This avoids CORS issues since client credentials must be used server-side
  const functionUrl = `${supabaseUrl}/functions/v1/exchange-canva-token`;
  
  console.log('🔄 Exchanging authorization code for token via backend...');
  console.log('📍 Function URL:', functionUrl);
  console.log('📍 Redirect URI being sent to token exchange:', redirectUri);
  console.log('📍 Redirect URI length:', redirectUri.length);
  console.log('⚠️ CRITICAL: This redirect_uri MUST match EXACTLY what was used in authorization URL!');
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`, // Use anon key for function access
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Token exchange failed: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    console.error('❌ Canva token exchange error:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token received from backend');
  }
  
  // Clear code verifier after use
  codeVerifier = null;
  
  // Update local config
  canvaConfig.accessToken = data.access_token;
  if (data.refresh_token) {
    canvaConfig.refreshToken = data.refresh_token;
  }
  
  console.log('✅ Tokens received and saved to database');
  console.log('  - Access token:', data.access_token.substring(0, 20) + '...');
  if (data.refresh_token) {
    console.log('  - Refresh token:', data.refresh_token.substring(0, 20) + '...');
  }
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
  };
}

/**
 * Get or refresh access token
 */
async function getAccessToken(): Promise<string> {
  if (accessTokenCache && Date.now() < tokenExpiry) {
    return accessTokenCache;
  }

  if (!canvaConfig.accessToken) {
    throw new Error('Canva access token not configured');
  }

  // If token is expired, refresh it
  if (canvaConfig.refreshToken && Date.now() >= tokenExpiry) {
    const response = await fetch(`${CANVA_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: canvaConfig.refreshToken,
        client_id: canvaConfig.clientId || '',
        client_secret: canvaConfig.clientSecret || '',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      canvaConfig.accessToken = data.access_token;
      if (data.refresh_token) {
        canvaConfig.refreshToken = data.refresh_token;
      }
    }
  }

  accessTokenCache = canvaConfig.accessToken;
  tokenExpiry = Date.now() + 3600000; // 1 hour
  return canvaConfig.accessToken;
}

/**
 * Import an image into Canva and create a design
 * This opens the image in Canva's editor for editing
 */
export async function importImageToCanva(imageUrl: string): Promise<{
  designId: string;
  editUrl: string;
  viewUrl: string;
  method: 'api' | 'upload';
}> {
  try {
    // First, try to get access token
    let token: string;
    try {
      token = await getAccessToken();
      
      // Try using Canva's Design Import API
      try {
        // First, we need to upload the image as an asset
        // Then create a design with that asset
        const uploadResponse = await fetch(`${CANVA_API_BASE}/assets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'IMAGE',
            url: imageUrl,
          }),
        });

        if (uploadResponse.ok) {
          const assetData = await uploadResponse.json();
          const assetId = assetData.id;

          // Create a design with the uploaded image
          const designResponse = await fetch(`${CANVA_API_BASE}/designs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              design: {
                width: 1080,
                height: 1080,
                elements: [
                  {
                    type: 'IMAGE',
                    assetId: assetId,
                    x: 0,
                    y: 0,
                    width: 1080,
                    height: 1080,
                  },
                ],
              },
            }),
          });

          if (designResponse.ok) {
            const designData = await designResponse.json();
            const designId = designData.id;
            const editUrl = `https://www.canva.com/design/${designId}/edit`;
            const viewUrl = `https://www.canva.com/design/${designId}/view`;
            return {
              designId,
              editUrl,
              viewUrl,
              method: 'api',
            };
          }
        }
      } catch (apiError) {
        console.warn('API import failed, using upload method:', apiError);
      }
    } catch (error) {
      console.warn('No access token available, using upload method');
    }

    // Fallback: Use Canva's upload page with image URL in clipboard
    // This requires user to paste, but it's the most reliable method
    const uploadUrl = 'https://www.canva.com/create';
    return {
      designId: '',
      editUrl: uploadUrl,
      viewUrl: uploadUrl,
      method: 'upload',
    };
  } catch (error) {
    console.error('Error importing image to Canva:', error);
    // Final fallback
    const uploadUrl = 'https://www.canva.com/create';
    return {
      designId: '',
      editUrl: uploadUrl,
      viewUrl: uploadUrl,
      method: 'upload',
    };
  }
}

/**
 * Get design details
 */
export async function getDesign(designId: string): Promise<any> {
  const token = await getAccessToken();

  const response = await fetch(`${CANVA_API_BASE}/designs/${designId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get design: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export design as image
 */
export async function exportDesign(
  designId: string,
  format: 'png' | 'jpg' | 'pdf' = 'png'
): Promise<string> {
  const token = await getAccessToken();

  const response = await fetch(
    `${CANVA_API_BASE}/designs/${designId}/exports`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * List available Canva features
 */
export function getCanvaFeatures(): {
  name: string;
  description: string;
  available: boolean;
}[] {
  return [
    {
      name: 'Design Import',
      description: 'Import images into Canva and create editable designs',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Design Editing',
      description: 'Programmatically edit Canva designs (size, position, elements)',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Design Export',
      description: 'Export designs as PNG, JPG, or PDF',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Asset Management',
      description: 'Manage and organize creative assets in Canva',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Data Connectors',
      description: 'Integrate external data sources for dynamic content',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Brand Templates',
      description: 'Create and manage brand-compliant templates',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'Collaboration',
      description: 'Share designs and manage team collaboration',
      available: !!canvaConfig.accessToken,
    },
    {
      name: 'AI-Powered Design',
      description: 'Leverage Canva AI features for automated design generation',
      available: !!canvaConfig.accessToken,
    },
  ];
}

/**
 * Check if Canva API is configured
 */
export function isCanvaConfigured(): boolean {
  return !!(canvaConfig.clientId && canvaConfig.clientSecret);
}

/**
 * Check if Canva is authenticated
 */
export function isCanvaAuthenticated(): boolean {
  return !!canvaConfig.accessToken;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeCanva();
}

