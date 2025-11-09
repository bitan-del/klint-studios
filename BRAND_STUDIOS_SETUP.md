# Brand Studios Feature - Setup Guide

## 🎯 Overview

Brand Studios is a new Advanced Mode feature that allows agencies to:
- Create brand style profiles for each client
- Train AI on client brand styles by uploading reference images
- Generate content automatically in the client's brand style

## 📋 Setup Steps

### 1. Run Database Migration

The database migration needs to be run in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Copy and paste the contents of `supabase/migrations/999_brand_profiles.sql`
4. Click "Run" to execute the migration

This will create:
- `brand_profiles` table
- RLS policies (users can only access their own profiles)
- Indexes for performance
- Auto-update trigger for `updated_at` timestamp

### 2. Verify Migration

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM brand_profiles LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'brand_profiles';
```

### 3. Access Brand Studios

1. **Login** to your Klint Studios account
2. **Switch to Advanced Mode** (if not already)
3. Look for the **"Brand Studios"** button in the header (purple button with sparkles icon)
4. Only visible for:
   - Users with `brand` plan
   - Admin users

## 🚀 How to Use

### Creating a Brand Studio

1. Click **"Brand Studios"** button in Advanced Mode
2. Click **"New Brand Studio"**
3. Enter:
   - **Brand Name**: e.g., "Nike", "Adidas", "Client Name"
   - **Client ID** (optional): e.g., "CLIENT-001"
4. Click **"Create"**

### Training a Brand Studio

1. Open your brand studio
2. Go to **"Train"** tab
3. **Upload Reference Images**:
   - Upload 5-10 images of past campaigns, brand guidelines, or style references
   - The AI will analyze these to learn the brand's visual identity
4. **Training Progress**:
   - Starts at 0%
   - Increases by ~10% per image
   - 50%+ = Good progress
   - 80%+ = Ready to generate

### Generating Content

1. Go to **"Generate"** tab
2. Enter what you want to generate (e.g., "Create 5 Instagram posts")
3. Click **"Generate"**
4. The system will use the learned brand style to create content

## 📁 File Structure

```
components/brand/
├── BrandStudiosDashboard.tsx    # Main dashboard (list of brand studios)
└── BrandStudioEditor.tsx        # Individual brand studio editor

services/
└── brandService.ts               # API service for brand profiles

types/
└── brand.ts                      # TypeScript types

supabase/migrations/
└── 999_brand_profiles.sql       # Database migration
```

## 🔧 Current Implementation Status

### ✅ Completed
- Database schema and migration
- Brand profile CRUD operations
- Brand Studios dashboard UI
- Brand Studio editor UI
- Training interface (upload images)
- Integration into Advanced Mode
- Access control (Brand plan only)

### 🚧 TODO (Future Enhancements)
- [ ] AI image analysis (currently placeholder)
- [ ] Color extraction from images
- [ ] Style description generation
- [ ] Chat interface for refinement
- [ ] Visual editor with sliders
- [ ] Batch generation with brand style
- [ ] Integration with generation prompts
- [ ] Image storage (currently using local URLs)

## 🧪 Testing Locally

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Login** with a Brand plan user or admin

3. **Switch to Advanced Mode** (if in Simple Mode)

4. **Click "Brand Studios"** button in header

5. **Create a test brand studio**:
   - Name: "Test Brand"
   - Upload a few test images
   - Check training progress updates

## 📝 Notes

- **Image Storage**: Currently using `URL.createObjectURL()` for local testing. In production, you'll need to:
  - Upload to Supabase Storage or Cloudinary
  - Store the public URLs in `reference_images` array

- **AI Analysis**: The `analyzeBrandStyle()` function is currently a placeholder. To implement:
  - Use image analysis API (e.g., Cloudinary, Google Vision)
  - Extract colors, composition, lighting
  - Generate style descriptions

- **Generation Integration**: Brand profiles are not yet integrated into the generation prompts. To add:
  - Modify generation services to include brand profile context
  - Use `color_palette`, `style_description`, etc. in prompts

## 🐛 Troubleshooting

### "Brand Studios" button not showing
- Check user plan is `brand` or role is `admin`
- Verify you're in Advanced Mode (not Simple Mode)
- Check browser console for errors

### Can't create brand studio
- Check database migration ran successfully
- Verify RLS policies are enabled
- Check browser console for errors

### Images not uploading
- Check browser console for errors
- Verify file size limits
- Check network tab for failed requests

## 📚 Next Steps

1. **Implement AI Analysis**: Add real image analysis to extract brand style
2. **Add Image Storage**: Integrate with Supabase Storage or Cloudinary
3. **Chat Interface**: Add conversational refinement
4. **Generation Integration**: Use brand profiles in generation prompts
5. **Batch Generation**: Implement bulk content generation

---

**Made with ❤️ for agencies and brands**

