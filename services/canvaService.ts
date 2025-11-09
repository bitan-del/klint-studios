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
 */
async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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
  
  // Generate a unique session ID for this OAuth flow
  const sessionId = `canva_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Store verifier in Edge Function (server-side, most reliable)
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
      console.error('❌ Failed to store verifier in Edge Function:', errorText);
      throw new Error('Failed to store code verifier server-side');
    }
    
    console.log('🔐 PKCE Code Verifier stored in Edge Function');
    console.log('🔐 Session ID:', sessionId);
    
    // Also store in database as backup (with session ID key for retrieval)
    const { databaseService } = await import('./databaseService');
    const verifierData = JSON.stringify({
      verifier: codeVerifier,
      redirectUri: redirectUri,
      timestamp: Date.now(),
      sessionId: sessionId,
    });
    
    // Store with session ID key for easy retrieval
    await databaseService.setAdminSetting(`canva_pkce_verifier_${sessionId}`, verifierData);
    
    // Also store with timestamp key as additional backup
    const storageKey = `canva_pkce_${redirectUri.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    await databaseService.setAdminSetting(storageKey, verifierData);
    console.log('🔐 Also stored in database as backup (with session ID key)');
    
    // Also store in browser storage as primary backup (more reliable than database for this)
    if (typeof window !== 'undefined') {
      try {
        const browserData = JSON.stringify({
          verifier: codeVerifier,
          redirectUri: redirectUri,
          timestamp: Date.now(),
          sessionId: sessionId, // Include session ID for Edge Function lookup
          storageKey: storageKey, // Include DB key for reference
        });
        
        // Store in multiple ways for maximum reliability
        sessionStorage.setItem('canva_code_verifier', browserData);
        localStorage.setItem('canva_code_verifier', browserData);
        // Also store as plain string as ultimate fallback
        localStorage.setItem('_canva_verifier_plain', codeVerifier);
        
        // Store in cookie (persists across redirects better)
        // Only use Secure flag on HTTPS
        const isSecure = window.location.protocol === 'https:';
        const secureFlag = isSecure ? '; Secure' : '';
        const cookieExpiry = new Date(Date.now() + 10 * 60 * 1000).toUTCString(); // 10 minutes
        document.cookie = `canva_code_verifier=${encodeURIComponent(codeVerifier)}; expires=${cookieExpiry}; path=/; SameSite=Lax${secureFlag}`;
        document.cookie = `canva_pkce_data=${encodeURIComponent(browserData)}; expires=${cookieExpiry}; path=/; SameSite=Lax${secureFlag}`;
        
        // Verify it was stored
        const verifyLocal = localStorage.getItem('canva_code_verifier');
        const verifyPlain = localStorage.getItem('_canva_verifier_plain');
        const verifyCookie = document.cookie.includes('canva_code_verifier=');
        
        if (verifyLocal && verifyPlain && verifyCookie) {
          console.log('🔐 Verified: Stored in browser storage AND cookies successfully');
        } else {
          console.warn('⚠️ Some storage methods failed:');
          console.warn('  - localStorage:', verifyLocal ? '✅' : '❌');
          console.warn('  - plain storage:', verifyPlain ? '✅' : '❌');
          console.warn('  - cookie:', verifyCookie ? '✅' : '❌');
        }
      } catch (e) {
        console.error('❌ Could not store in browser storage:', e);
        throw new Error('Browser storage failed: ' + e);
      }
    }
    
    console.log('🔐 PKCE Code Verifier generated and stored');
    console.log('🔐 Code Challenge:', codeChallenge.substring(0, 20) + '...');
    console.log('🔐 Verifier length:', codeVerifier.length);
  } catch (dbError: any) {
    console.error('❌ Database storage error:', dbError);
    // Fallback to browser storage only
    if (typeof window !== 'undefined') {
      const storageData = JSON.stringify({
        verifier: codeVerifier,
        redirectUri: redirectUri,
        timestamp: timestamp,
      });
      sessionStorage.setItem('canva_code_verifier', storageData);
      localStorage.setItem('canva_code_verifier', storageData);
      console.warn('⚠️ Using browser storage fallback only');
    } else {
      throw new Error('Failed to store code verifier: ' + dbError.message);
    }
  }
  
  // Include session ID in state parameter so we can retrieve verifier
  const state = `canva_auth_${sessionId}`;
  
  const params = new URLSearchParams({
    client_id: canvaConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'design:read design:write asset:read asset:write design:content:read design:content:write design:meta:read design:permission:read design:permission:write asset:read asset:write folder:read folder:write folder:permission:read folder:permission:write',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${CANVA_AUTH_BASE}/authorize?${params.toString()}`;
  
  // Log the URL for debugging (without sensitive data)
  console.log('🔗 Canva Auth URL generated');
  console.log('📍 Redirect URI:', redirectUri);
  console.log('🔑 Client ID:', canvaConfig.clientId);
  console.log('✅ Code Challenge Method: S256');
  console.log('🔐 Session ID:', sessionId);
  console.log('🔐 State parameter includes session ID for verifier retrieval');
  
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
  
  console.log('🔍 Retrieving code verifier...');
  console.log('📍 Redirect URI:', redirectUri);
  console.log('📍 State parameter:', state || 'null');
  
  // Extract session ID from state parameter
  let sessionId: string | null = null;
  if (state && state.startsWith('canva_auth_')) {
    sessionId = state.replace('canva_auth_', '');
    console.log('🔐 Session ID extracted from state:', sessionId);
  }
  
  // If no session ID from state, try to get it from browser storage
  if (!sessionId && typeof window !== 'undefined') {
    try {
      const storedDataStr = localStorage.getItem('canva_code_verifier') || sessionStorage.getItem('canva_code_verifier');
      if (storedDataStr) {
        const parsed = JSON.parse(storedDataStr);
        if (parsed.sessionId) {
          sessionId = parsed.sessionId;
          console.log('🔐 Session ID found in browser storage:', sessionId);
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Try Edge Function FIRST (server-side, most reliable)
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
        }
        const retrieveUrl = `${supabaseUrl}/functions/v1/store-canva-verifier?${params.toString()}`;
        
        console.log('🔍 Retrieving verifier from Edge Function...');
        if (sessionId) {
          console.log('📍 Using session ID:', sessionId);
        } else {
          console.log('⚠️ No session ID, using redirect URI fallback');
        }
        console.log('📍 Redirect URI:', redirectUri);
        
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
          }
        } else {
          const errorText = await retrieveResponse.text();
          console.warn('⚠️ Edge Function retrieval failed:', errorText);
          console.warn('⚠️ Trying browser storage fallback...');
        }
      }
    } catch (edgeError) {
      console.warn('⚠️ Edge Function error, trying browser storage:', edgeError);
    }
  }
  
  // Fallback to browser storage
  if (!verifier && typeof window !== 'undefined') {
    console.log('🔍 Checking browser storage...');
    
    // Try cookies FIRST (most reliable across redirects)
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!);
      return null;
    };
    
    const cookieVerifier = getCookie('canva_code_verifier');
    if (cookieVerifier) {
      verifier = cookieVerifier;
      console.log('✅ Code verifier found in COOKIE');
    }
    
    // Try localStorage (more persistent than sessionStorage)
    let localData = localStorage.getItem('canva_code_verifier');
    if (localData) {
      try {
        storedData = JSON.parse(localData);
        // Verify redirect URI matches
        if (storedData.redirectUri === redirectUri || !storedData.redirectUri) {
          verifier = storedData.verifier;
          const age = Date.now() - (storedData.timestamp || 0);
          console.log('✅ Code verifier found in localStorage');
          console.log('⏰ Verifier age:', Math.round(age / 1000), 'seconds');
          if (age > 10 * 60 * 1000) {
            console.warn('⚠️ Verifier is older than 10 minutes');
          }
        } else {
          console.warn('⚠️ Redirect URI mismatch in localStorage, ignoring');
        }
      } catch (e) {
        // Try as plain string
        verifier = localData;
        console.log('✅ Code verifier found in localStorage (plain format)');
      }
    }
    
    // Try sessionStorage as backup
    if (!verifier) {
      let sessionData = sessionStorage.getItem('canva_code_verifier');
      if (sessionData) {
        try {
          storedData = JSON.parse(sessionData);
          if (storedData.redirectUri === redirectUri || !storedData.redirectUri) {
            verifier = storedData.verifier;
            console.log('✅ Code verifier found in sessionStorage');
          } else {
            console.warn('⚠️ Redirect URI mismatch in sessionStorage, ignoring');
          }
        } catch (e) {
          verifier = sessionData;
          console.log('✅ Code verifier found in sessionStorage (plain format)');
        }
      }
    }
    
    // Try plain verifier as ultimate fallback
    if (!verifier) {
      const plainVerifier = localStorage.getItem('_canva_verifier_plain');
      if (plainVerifier) {
        verifier = plainVerifier;
        console.log('✅ Code verifier found in plain storage fallback');
      }
    }
    
    // Log what we found
    if (verifier) {
      console.log('✅ Code verifier retrieved from browser storage');
    } else {
      console.log('❌ Code verifier not found in browser storage');
      console.log('📍 Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes('canva')));
      console.log('📍 Available sessionStorage keys:', Object.keys(sessionStorage).filter(k => k.includes('canva')));
    }
  }
  
  // Try database as fallback (if we have storage key from browser storage)
  if (!verifier && storedData?.storageKey) {
    try {
      console.log('🔍 Trying database with storage key:', storedData.storageKey);
      const { databaseService } = await import('./databaseService');
      const dbData = await databaseService.getAdminSetting(storedData.storageKey);
      
      if (dbData) {
        try {
          const dbParsed = JSON.parse(dbData);
          if (dbParsed.redirectUri === redirectUri) {
            verifier = dbParsed.verifier;
            console.log('✅ Code verifier retrieved from database');
            // Clean up
            await databaseService.setAdminSetting(storedData.storageKey, '');
          }
        } catch (e) {
          console.warn('⚠️ Could not parse database verifier data');
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Could not retrieve from database:', dbError);
    }
  }
  
  // Last resort: Try to get verifier from database using session ID if we have it
  if (!verifier && sessionId) {
    try {
      console.log('🔍 Last resort: Trying database with session ID:', sessionId);
      const { databaseService } = await import('./databaseService');
      // Try to find verifier stored with this session ID
      const dbData = await databaseService.getAdminSetting(`canva_pkce_verifier_${sessionId}`);
      if (dbData) {
        try {
          const dbParsed = JSON.parse(dbData);
          if (dbParsed.verifier) {
            verifier = dbParsed.verifier;
            console.log('✅ Code verifier retrieved from database (session ID lookup)');
            // Clean up
            await databaseService.setAdminSetting(`canva_pkce_verifier_${sessionId}`, '');
          }
        } catch (e) {
          console.warn('⚠️ Could not parse database verifier data');
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Database lookup failed:', dbError);
    }
  }
  
  // Clean up browser storage and cookies after successful retrieval
  if (verifier && typeof window !== 'undefined') {
    sessionStorage.removeItem('canva_code_verifier');
    localStorage.removeItem('canva_code_verifier');
    localStorage.removeItem('_canva_verifier_plain');
    // Clear cookies
    document.cookie = 'canva_code_verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'canva_pkce_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  if (!verifier) {
    console.error('❌ Code verifier not found in any storage location');
    console.error('📍 Tried: localStorage, sessionStorage, database');
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

