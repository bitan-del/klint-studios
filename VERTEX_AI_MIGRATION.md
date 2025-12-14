# Vertex AI Migration Guide

This document describes the migration from Google Gemini API to Google Vertex AI.

## Overview

The application has been migrated from using the Gemini API directly to using Google Vertex AI through a backend API server. This provides better security, scalability, and access to enterprise features.

## Architecture Changes

### Before (Gemini API)
- Frontend directly called Gemini API using `@google/genai` SDK
- API keys stored in database/environment variables
- All processing happened client-side

### After (Vertex AI)
- Frontend calls a backend API server (runs on port 3001)
- Backend server uses `@google-cloud/vertexai` SDK
- Vertex AI configuration (project ID, location, credentials) stored in database
- Better security with service account credentials

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@google-cloud/vertexai` - Vertex AI SDK
- `tsx` - TypeScript execution for the server
- `concurrently` - Run frontend and backend together

### 2. Configure Vertex AI

#### Option A: Using Environment Variables (Local Development)

Create a `.env` file:

```env
VITE_VERTEX_PROJECT_ID=your-gcp-project-id
VITE_VERTEX_LOCATION=us-central1
VITE_VERTEX_CREDENTIALS_PATH=/path/to/service-account.json
VITE_VERTEX_API_URL=http://localhost:3001
```

#### Option B: Using Admin Panel (Production)

1. Start the application
2. Log in as admin
3. Go to Admin Panel → Integrations
4. Enter your Vertex AI configuration:
   - **Project ID**: Your Google Cloud Project ID
   - **Location**: Region (e.g., `us-central1`)
   - **Credentials Path**: (Optional) Path to service account JSON file

### 3. Set Up Google Cloud Credentials

#### Option 1: Service Account JSON File (Recommended for Production)

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable or provide path in admin panel

#### Option 2: Application Default Credentials (Recommended for Local)

```bash
gcloud auth application-default login
```

### 4. Start the Application

#### Development Mode (Frontend + Backend)

```bash
npm run dev:all
```

This starts:
- Frontend on `http://localhost:3000`
- Backend API on `http://localhost:3001`

#### Development Mode (Separate Terminals)

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:server
```

## API Endpoints

The backend server provides these endpoints:

- `GET /health` - Health check
- `POST /api/vertex/generate-content` - Generate text content
- `POST /api/vertex/generate-content-with-images` - Generate content with image inputs
- `POST /api/vertex/generate-images` - Generate images (Imagen)
- `POST /api/vertex/generate-video` - Generate videos (Veo)
- `POST /api/vertex/video-operation-status` - Check video generation status

## Code Changes

### Service Updates

- `services/geminiService.ts` → `services/vertexService.ts`
- All imports updated from `geminiService` to `vertexService`
- Backend API server created at `server/vertexApi.ts`

### Type Updates

- `GeminiSettings` → `VertexAISettings` in `types.ts`
- Updated to include `projectId`, `location`, and `credentialsPath`

### Component Updates

All components that used `geminiService` now use `vertexService`:
- `context/*.ts` - All store files
- `components/**/*.tsx` - All component files
- `services/videoService.ts` - Video generation service

## Migration Checklist

- [x] Update types to use VertexAISettings
- [x] Create vertexService.ts
- [x] Create backend API server
- [x] Update AuthContext to handle Vertex AI settings
- [x] Update App.tsx admin panel UI
- [x] Update all component imports
- [x] Update videoService.ts
- [x] Update environment variables
- [x] Update package.json scripts
- [x] Update vite.config.ts

## Troubleshooting

### Backend Server Not Starting

1. Check that port 3001 is available
2. Verify Node.js version (requires Node 18+)
3. Check that dependencies are installed: `npm install`

### Vertex AI Authentication Errors

1. Verify service account has proper permissions
2. Check that credentials file path is correct
3. For local development, try: `gcloud auth application-default login`

### API Connection Errors

1. Verify `VITE_VERTEX_API_URL` is set correctly
2. Check that backend server is running
3. Check browser console for CORS errors

### Model Not Available

1. Verify Vertex AI API is enabled in Google Cloud Console
2. Check that your project has access to the models you're using
3. Verify billing is enabled for your GCP project

## Next Steps

1. Test all features to ensure they work with Vertex AI
2. Update any remaining mock functions in vertexService
3. Implement missing methods (some are placeholders)
4. Add error handling and retry logic
5. Set up monitoring and logging

## Notes

- The old `geminiService.ts` file is kept for reference but is no longer used
- Some methods in `vertexService.ts` are placeholders and need full implementation
- The backend server needs to be deployed separately for production use
- Consider using a reverse proxy (nginx) for production deployments
