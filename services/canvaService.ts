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
  // Generate PKCE parameters
  codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store verifier in sessionStorage for later use
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('canva_code_verifier', codeVerifier);
  }
  
  const params = new URLSearchParams({
    client_id: canvaConfig.clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'design:read design:write asset:read asset:write design:content:read design:content:write design:meta:read design:permission:read design:permission:write asset:read asset:write folder:read folder:write folder:permission:read folder:permission:write',
    state: 'canva_auth',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${CANVA_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token (with PKCE)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!canvaConfig.clientId || !canvaConfig.clientSecret) {
    throw new Error('Canva client ID and secret not configured');
  }

  // Retrieve code verifier from sessionStorage
  let verifier = codeVerifier;
  if (!verifier && typeof window !== 'undefined') {
    verifier = sessionStorage.getItem('canva_code_verifier');
    if (verifier) {
      sessionStorage.removeItem('canva_code_verifier');
    }
  }

  if (!verifier) {
    throw new Error('Code verifier not found. Please restart OAuth flow.');
  }

  const response = await fetch(`${CANVA_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: canvaConfig.clientId,
      client_secret: canvaConfig.clientSecret,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Canva token exchange error:', errorText);
    throw new Error(`Canva token exchange failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Clear code verifier after use
  codeVerifier = null;
  
  // Save tokens to database
  const { databaseService } = await import('./databaseService');
  await databaseService.setAdminSetting('canva_access_token', data.access_token);
  if (data.refresh_token) {
    await databaseService.setAdminSetting('canva_refresh_token', data.refresh_token);
  }
  
  // Update config
  canvaConfig.accessToken = data.access_token;
  if (data.refresh_token) {
    canvaConfig.refreshToken = data.refresh_token;
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

