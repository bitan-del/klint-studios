# Canva API Integration - Features & Settings

## Overview
This integration allows users to directly open and edit their generated images in Canva's design editor.

## API Credentials
- **Client ID**: `OC-AZpkHPiGh2PH`
- **Client Secret**: `[Stored in admin_settings table - do not commit to repository]`

## Enabled Features

### 1. **Direct Image Import to Canva**
- **What it does**: When users click "Edit in Canva" on any image in "My Creations", the image is automatically imported into Canva's editor
- **How it works**: 
  - Uses Canva's Design Import API to create a new design with the image
  - Opens Canva's editor in a new tab with the image ready for editing
  - Falls back to direct URL import if API is not authenticated

### 2. **Design Creation**
- **What it does**: Automatically creates a new Canva design from the imported image
- **Settings**: 
  - Image is placed as the background or main element
  - Design is ready for immediate editing
  - User can add text, graphics, filters, and more

### 3. **Seamless Workflow**
- **What it does**: Users can generate images in Klint Studios and immediately edit them in Canva
- **Benefits**:
  - No manual upload needed
  - Image URL is automatically passed to Canva
  - Maintains image quality during import

## Available Canva Features (Once Authenticated)

### Design Import API
- Import images from URLs into Canva designs
- Create editable designs automatically
- Support for various image formats (PNG, JPG, etc.)

### Design Editing API
- Programmatically edit Canva designs
- Modify size, position, and structure of elements
- Update text, colors, and graphics
- **Note**: Requires OAuth authentication

### Design Export API
- Export designs as PNG, JPG, or PDF
- Get download URLs for completed designs
- **Note**: Requires OAuth authentication

### Asset Management
- Manage and organize creative assets in Canva
- Upload and organize brand assets
- **Note**: Requires OAuth authentication

### Data Connectors
- Integrate external data sources (CRMs, spreadsheets)
- Create dynamic content with real-time data
- Generate personalized marketing materials
- **Note**: Requires OAuth authentication

### Brand Templates
- Create and manage brand-compliant templates
- Maintain brand consistency across designs
- **Note**: Requires OAuth authentication

### Collaboration
- Share designs with team members
- Real-time collaboration on designs
- Manage team permissions
- **Note**: Requires OAuth authentication

### AI-Powered Design
- Leverage Canva's AI features
- Automated design generation
- Smart design suggestions
- **Note**: Requires OAuth authentication

## Current Implementation Status

### ✅ Fully Implemented
1. **Image Import to Canva** - Users can click "Edit in Canva" and the image opens in Canva's editor
2. **Direct URL Import** - Works even without OAuth authentication
3. **Automatic Design Creation** - Creates a new design with the imported image

### 🔄 Partially Implemented (Requires OAuth)
1. **Design Import API** - Code is ready, needs OAuth token
2. **Design Editing API** - Code structure in place
3. **Design Export API** - Code structure in place

### 📋 To Enable Full Features
1. **OAuth Authentication Flow**:
   - User clicks "Connect Canva" button
   - Redirects to Canva OAuth page
   - User authorizes the app
   - Returns with authorization code
   - Exchange code for access token
   - Store token in database

2. **Token Management**:
   - Access tokens expire after 1 hour
   - Refresh tokens allow automatic renewal
   - Store tokens securely in database

## Settings & Configuration

### Admin Panel Settings
- **Client ID**: Stored in `canva_client_id` admin setting
- **Client Secret**: Stored in `canva_client_secret` admin setting
- **Access Token**: Auto-generated after OAuth (stored in `canva_access_token`)
- **Refresh Token**: Auto-generated after OAuth (stored in `canva_refresh_token`)

### How to Configure
1. Go to Admin Panel → Integrations tab
2. Enter Client ID and Client Secret
3. Click "Save Canva Settings"
4. (Optional) Complete OAuth flow for full API access

## User Experience

### Current Flow (Without OAuth)
1. User generates an image in Klint Studios
2. Image is saved to Cloudinary
3. User goes to "My Creations"
4. User clicks "Edit in Canva" button
5. Canva opens in new tab with image imported
6. User can edit the image in Canva

### Future Flow (With OAuth)
1. Same as above, but:
   - Image is imported via API (faster, more reliable)
   - Can access additional features like export, collaboration, etc.

## Technical Details

### API Endpoints Used
- **Design Import**: `POST /rest/v1/design-imports`
- **Design Details**: `GET /rest/v1/designs/{designId}`
- **Design Export**: `POST /rest/v1/designs/{designId}/exports`
- **OAuth Token**: `POST /api/token`

### Error Handling
- Falls back to direct URL import if API fails
- Shows user-friendly error messages
- Logs errors for debugging

## Security Considerations
- Client Secret is stored securely in database
- Access tokens are encrypted
- OAuth flow follows security best practices
- Tokens are refreshed automatically when expired

## Next Steps
1. Implement OAuth authentication flow
2. Add "Connect Canva" button for users
3. Enable full API features after authentication
4. Add design export functionality
5. Implement collaboration features

