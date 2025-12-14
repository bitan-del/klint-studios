# Fixed: Image Quality Sizes & Gemini 3 Pro Location

## Issues Fixed

### 1. ✅ Image Quality Sizes Now Different
**Problem**: HD, QHD, and UHD were all generating the same size (2K)

**Solution**: Updated quality mapping:
- **Regular/Standard**: Gemini 2.5 Flash Image (default resolution)
- **HD**: Gemini 3 Pro Image Preview with **1K** resolution (~1024px)
- **QHD**: Gemini 3 Pro Image Preview with **2K** resolution (~2048px)  
- **UHD**: Gemini 3 Pro Image Preview with **4K** resolution (~4096px)

### 2. ✅ Gemini 3 Pro Image Location Fixed
**Problem**: Gemini 3 Pro Image was using `us-central1` location and getting 404 errors

**Solution**: 
- Gemini 3 Pro Image Preview now uses **`global`** location (required for preview models)
- Falls back to Gemini 2.5 Flash Image if Gemini 3 Pro is not available
- Better error handling for 403/404 errors

## What Changed

### Quality Mapping
```typescript
'hd': { model: 'gemini-3-pro-image-preview', imageSize: '1K', useGlobal: true }
'qhd': { model: 'gemini-3-pro-image-preview', imageSize: '2K', useGlobal: true }
'uhd': { model: 'gemini-3-pro-image-preview', imageSize: '4K', useGlobal: true }
```

### Location Handling
- Gemini 3 Pro Image: Uses `global` endpoint
- Gemini 2.5 Flash: Uses regional endpoint (e.g., `us-central1`)

## About Port 9999

The "listening to localhost:9999" logs you're seeing are likely from:
- **Supabase CLI** when running locally (though standard port is 54321)
- **Previous session logs** that are still visible
- **Another development tool** running in the background

**To check what's using port 9999:**
```bash
lsof -i :9999
```

**If you want to stop it:**
- It's likely harmless if it's just logs
- If it's a Supabase local instance, you can stop it with: `npx supabase stop`
- Or just ignore it - it doesn't affect your production Edge Function

## Testing

After redeployment, test each quality:

1. **Regular**: Should use Gemini 2.5 Flash (fast, default size)
2. **HD**: Should use Gemini 3 Pro with 1K resolution
3. **QHD**: Should use Gemini 3 Pro with 2K resolution  
4. **UHD**: Should use Gemini 3 Pro with 4K resolution

Check the Supabase logs to see:
- `📊 Quality: hd, Model: gemini-3-pro-image-preview, ImageSize: 1K, Location: global`
- `🌐 API URL: https://global-aiplatform.googleapis.com/...`

## Next Steps

1. ✅ Function has been redeployed
2. 🔄 Wait 30-60 seconds for deployment to propagate
3. 🧪 Test each quality level
4. 📊 Check Supabase logs to verify correct model and size are being used
