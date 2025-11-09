# Brand Studios - Image Storage Guide

## 📦 How Training Images Are Stored

Brand Studios uses the **existing storage service** to store reference images, which:
- ✅ Uses **admin Cloudinary credentials** (no user setup needed)
- ✅ Respects **plan-based storage limits** (Brand plan: 2000 images)
- ✅ Automatically **compresses images** before upload
- ✅ Tracks images in **user_images table** for management

## 🏗️ Storage Architecture

### 1. **Cloudinary Storage**
- **Service**: Cloudinary (same as other images)
- **Folder Structure**: `brand-references/{profile-id}/{filename}`
- **Example Path**: `brand-references/abc123-def456/image1.jpg`
- **Format**: Images are stored in their original format
- **Optimization**: Cloudinary automatically optimizes images (q_auto, f_auto)

### 2. **Database Storage**
- **Table**: `brand_profiles`
- **Column**: `reference_images` (JSONB array)
- **Stores**: Array of Cloudinary URLs
- **Example**:
  ```json
  [
    "https://res.cloudinary.com/your-cloud/image/upload/v123/brand-references/abc123/image1.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v123/brand-references/abc123/image2.jpg"
  ]
  ```

## 🔄 Upload Process

1. **User uploads images** in Brand Studio Editor → Train tab
2. **Storage service handles upload**:
   - Uses admin Cloudinary credentials (configured in Admin Panel)
   - Automatically compresses images (reduces size by 70-85%)
   - Checks storage limit (Brand plan: 2000 images)
   - Uploads to Cloudinary
   - Saves to `user_images` table with metadata
3. **URLs are saved to brand profile**:
   - Added to `reference_images` array in `brand_profiles` table
   - Training completeness is updated (10% per image)

## 🗑️ Deletion Process

1. **User clicks remove** on a reference image
2. **Storage service handles deletion**:
   - Finds image in `user_images` table by URL
   - Deletes from Cloudinary (via storage service)
   - Soft deletes from `user_images` table
   - Updates storage count
3. **URL is removed from brand profile**:
   - Removed from `reference_images` array
   - Training completeness recalculated

## 💾 Storage Limits

Brand reference images count toward the user's plan-based storage limit:
- **Free Plan**: 10 images
- **BASIC (Solo)**: 100 images
- **PRO (Studio)**: 500 images
- **ADVANCE (Brand)**: 2000 images ✅
- **Admin**: Unlimited

**Note**: Brand reference images are included in the total count, so if a Brand plan user has 500 generated images, they can upload up to 1500 brand reference images.

## 🔐 Security & Access

- **RLS Policies**: Users can only access their own brand profiles
- **Cloudinary**: Images are stored securely with signed URLs
- **Private by default**: Brand reference images are not publicly accessible without authentication

## 📊 Storage Structure

```
Cloudinary:
└── brand-references/
    ├── {profile-id-1}/
    │   ├── image1.jpg
    │   ├── image2.jpg
    │   └── image3.jpg
    ├── {profile-id-2}/
    │   ├── image1.jpg
    │   └── image2.jpg
    └── ...

Database (brand_profiles table):
└── reference_images: [
      "https://res.cloudinary.com/.../brand-references/{profile-id-1}/image1.jpg",
      "https://res.cloudinary.com/.../brand-references/{profile-id-1}/image2.jpg",
      ...
    ]
```

## 🛠️ Implementation Details

### Upload Function
```typescript
// In BrandStudioEditor.tsx
const handleImageUpload = async (files: FileList | null) => {
  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Use storage service (handles Cloudinary with admin credentials)
  const { storageService } = await import('../../services/storageService');
  
  // 3. Upload each file using storage service
  const urls = await Promise.all(
    files.map(file => 
      storageService.uploadImage(
        file,
        user.id,
        'brand-studios', // workflow_id
        `Brand reference for ${profile.name}`,
        {
          brand_profile_id: profile.id,
          brand_name: profile.name,
          type: 'brand_reference'
        }
      ).then(imageData => imageData.cloudinary_url)
    )
  );
  
  // 4. Save URLs to brand profile
  await updateBrandProfile(profile.id, {
    reference_images: [...existingUrls, ...urls]
  });
};
```

### Delete Function
```typescript
// In BrandStudioEditor.tsx
const handleRemoveImage = async (index: number) => {
  const imageUrl = uploadedImages[index];
  
  // 1. Find image in user_images table
  const { data: imageData } = await supabase
    .from('user_images')
    .select('id')
    .eq('cloudinary_url', imageUrl)
    .eq('workflow_id', 'brand-studios')
    .single();
  
  // 2. Delete using storage service (handles Cloudinary deletion)
  if (imageData?.id) {
    await storageService.deleteImage(imageData.id, user.id);
  }
  
  // 3. Remove from brand profile
  const newImages = uploadedImages.filter((_, i) => i !== index);
  await updateBrandProfile(profile.id, {
    reference_images: newImages
  });
};
```

## ✅ Benefits of This Approach

1. **No User Setup**: Uses admin Cloudinary credentials automatically
2. **Plan-Based Limits**: Respects user's plan storage limit (Brand: 2000 images)
3. **Automatic Compression**: Images compressed before upload (70-85% size reduction)
4. **Consistent Storage**: Uses same system as all other images
5. **Automatic Optimization**: Cloudinary optimizes images automatically
6. **CDN Delivery**: Fast image loading via Cloudinary CDN
7. **Secure**: Images are private and require authentication
8. **Easy Management**: Images tracked in user_images table, can be managed in "My Creations"

## 🔧 Setup Required

**No user setup needed!** ✅

The storage service uses **admin Cloudinary credentials** configured in:
- **Admin Panel** → **Integrations** → **Cloudinary**

Only the admin needs to configure Cloudinary once. All users automatically use the same credentials.

## 📝 Notes

- **Image Size**: No compression applied to reference images (preserve quality for training)
- **Format**: Original format preserved (JPEG, PNG, WebP, etc.)
- **Retention**: Images persist as long as the brand profile exists
- **Cleanup**: When a brand profile is deleted, images should be cleaned up (TODO: implement cleanup function)

---

**Made with ❤️ for agencies and brands**

