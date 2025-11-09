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
  
  // Store verifier in multiple locations for maximum reliability
  // Use both sessionStorage and localStorage, plus a backup key
  // Include timestamp to detect if storage was cleared or is too old
  if (typeof window !== 'undefined') {
    try {
      const timestamp = Date.now();
      const storageData = JSON.stringify({
        verifier: codeVerifier,
        timestamp: timestamp,
        redirectUri: redirectUri, // Store redirect URI too for verification
      });
      
      // Store in multiple locations
      sessionStorage.setItem('canva_code_verifier', storageData);
      localStorage.setItem('canva_code_verifier', storageData);
      // Backup storage with different key
      localStorage.setItem('_canva_pkce_verifier_backup', storageData);
      
      // Force a synchronous flush by reading back immediately
      // This ensures the storage is committed before redirect
      const verifyStorage = () => {
        const sessionCheck = sessionStorage.getItem('canva_code_verifier');
        const localCheck = localStorage.getItem('canva_code_verifier');
        const backupCheck = localStorage.getItem('_canva_pkce_verifier_backup');
        
        console.log('🔍 Storage verification:');
        console.log('  - sessionStorage:', sessionCheck ? '✅' : '❌');
        console.log('  - localStorage:', localCheck ? '✅' : '❌');
        console.log('  - backup:', backupCheck ? '✅' : '❌');
        
        return sessionCheck || localCheck || backupCheck;
      };
      
      // Verify multiple times to ensure it's committed
      let verified = false;
      for (let i = 0; i < 3; i++) {
        if (verifyStorage()) {
          verified = true;
          break;
        }
        // Small delay to allow storage to commit
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      if (!verified) {
        console.error('❌ Failed to verify code verifier storage after multiple attempts!');
        throw new Error('Storage verification failed - storage may not be available');
      }
      
      // Final verification of content
      const storedInSession = sessionStorage.getItem('canva_code_verifier');
      const storedInLocal = localStorage.getItem('canva_code_verifier');
      
      if (storedInSession) {
        const parsed = JSON.parse(storedInSession);
        if (parsed.verifier !== codeVerifier) {
          throw new Error('Stored verifier does not match generated verifier');
        }
      }
      
      if (storedInLocal) {
        const parsed = JSON.parse(storedInLocal);
        if (parsed.verifier !== codeVerifier) {
          throw new Error('Stored verifier does not match generated verifier');
        }
      }
      
      console.log('🔐 PKCE Code Verifier generated and stored');
      console.log('🔐 Code Challenge:', codeChallenge.substring(0, 20) + '...');
      console.log('✅ Verified: Stored in sessionStorage, localStorage, and backup');
      console.log('🔐 Verifier length:', codeVerifier.length);
      console.log('⏰ Timestamp:', new Date(timestamp).toISOString());
    } catch (storageError) {
      console.error('❌ Storage error:', storageError);
      throw new Error('Failed to store authentication data: ' + storageError.message);
    }
  }
  
  const params = new URLSearchParams({
    client_id: canvaConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'design:read design:write asset:read asset:write design:content:read design:content:write design:meta:read design:permission:read design:permission:write asset:read asset:write folder:read folder:write folder:permission:read folder:permission:write',
    state: 'canva_auth',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${CANVA_AUTH_BASE}/authorize?${params.toString()}`;
  
  // Log the URL for debugging (without sensitive data)
  console.log('🔗 Canva Auth URL generated');
  console.log('📍 Redirect URI:', redirectUri);
  console.log('🔑 Client ID:', canvaConfig.clientId);
  console.log('✅ Code Challenge Method: S256');
  console.log('🔗 Full Auth URL:', authUrl);
  
  return authUrl;
}

/**
 * Exchange authorization code for access token (with PKCE)
 * Uses Supabase Edge Function to avoid CORS issues with client credentials
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Retrieve code verifier from multiple sources with comprehensive fallback
  let verifier = codeVerifier;
  let storedData: { verifier: string; timestamp: number; redirectUri?: string } | null = null;
  
  if (!verifier && typeof window !== 'undefined') {
    console.log('🔍 Searching for code verifier in storage...');
    
    // Try sessionStorage first
    let sessionData = sessionStorage.getItem('canva_code_verifier');
    if (sessionData) {
      try {
        storedData = JSON.parse(sessionData);
        verifier = storedData.verifier;
        console.log('✅ Code verifier found in sessionStorage:', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
        if (storedData.timestamp) {
          const age = Date.now() - storedData.timestamp;
          console.log('⏰ Verifier age:', Math.round(age / 1000), 'seconds');
          if (age > 10 * 60 * 1000) { // 10 minutes
            console.warn('⚠️ Code verifier is older than 10 minutes, may be stale');
          }
        }
      } catch (e) {
        // Try as plain string (backward compatibility)
        verifier = sessionData;
        console.log('✅ Code verifier found in sessionStorage (plain):', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
      }
    } else {
      console.log('❌ Code verifier not in sessionStorage');
    }
    
    // If not in sessionStorage, try localStorage
    if (!verifier) {
      let localData = localStorage.getItem('canva_code_verifier');
      if (localData) {
        try {
          storedData = JSON.parse(localData);
          verifier = storedData.verifier;
          console.log('✅ Code verifier found in localStorage:', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
          if (storedData.timestamp) {
            const age = Date.now() - storedData.timestamp;
            console.log('⏰ Verifier age:', Math.round(age / 1000), 'seconds');
          }
        } catch (e) {
          // Try as plain string (backward compatibility)
          verifier = localData;
          console.log('✅ Code verifier found in localStorage (plain):', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
        }
      } else {
        console.log('❌ Code verifier not in localStorage');
      }
    }
    
    // Try backup storage key
    if (!verifier) {
      const backupData = localStorage.getItem('_canva_pkce_verifier_backup');
      if (backupData) {
        try {
          storedData = JSON.parse(backupData);
          verifier = storedData.verifier;
          console.log('✅ Code verifier found in backup storage:', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
          if (storedData.timestamp) {
            const age = Date.now() - storedData.timestamp;
            console.log('⏰ Verifier age:', Math.round(age / 1000), 'seconds');
          }
        } catch (e) {
          verifier = backupData;
          console.log('✅ Code verifier found in backup storage (plain):', verifier ? `${verifier.substring(0, 20)}...` : 'not found');
        }
      } else {
        console.log('❌ Code verifier not in backup storage');
      }
    }
    
    // Also check URL hash/params in case it was passed there
    if (!verifier) {
      const urlParams = new URLSearchParams(window.location.search);
      verifier = urlParams.get('code_verifier');
      if (verifier) {
        console.log('✅ Code verifier found in URL params:', verifier.substring(0, 20) + '...');
      } else {
        console.log('❌ Code verifier not in URL params');
      }
    }
    
    // Log all available storage keys for debugging
    if (!verifier) {
      console.error('❌ Code verifier not found in any location');
      console.error('📍 Available sessionStorage keys:', Object.keys(sessionStorage));
      console.error('📍 Available localStorage keys:', Object.keys(localStorage));
    }
    
    // Remove from all storage locations after successful retrieval
    if (verifier) {
      sessionStorage.removeItem('canva_code_verifier');
      localStorage.removeItem('canva_code_verifier');
      localStorage.removeItem('_canva_pkce_verifier_backup');
    }
  }

  if (!verifier) {
    console.error('❌ Code verifier not found in any storage location');
    console.error('📍 Available sessionStorage keys:', typeof window !== 'undefined' ? Object.keys(sessionStorage) : 'N/A');
    console.error('📍 Available localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'N/A');
    throw new Error('Code verifier not found. Please restart OAuth flow.');
  }
  
  console.log('✅ Code verifier found:', verifier.substring(0, 20) + '...');

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

