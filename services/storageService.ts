/**
 * Storage service for managing user images
 * Handles Cloudinary upload, compression, and storage tracking
 */

import { supabase } from './supabaseClient';
import { cloudinaryService } from './cloudinaryService';
import { compressImage } from '../utils/imageCompressor';
import type { UserPlan } from '../types';

export interface UserImage {
  id: string;
  user_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string | null;
  original_size: number | null;
  compressed_size: number | null;
  workflow_id: string | null;
  prompt: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  expires_at: string | null;
}

export interface StorageInfo {
  images_stored: number;
  storage_limit: number;
  usage_percentage: number;
}

class StorageService {
  /**
   * Upload image with compression
   */
  async uploadImage(
    file: File,
    userId: string,
    workflowId?: string,
    prompt?: string,
    metadata?: Record<string, any>
  ): Promise<UserImage> {
    console.log(`🗄️ [STORAGE] uploadImage called!`, {
      fileName: file.name,
      fileSize: file.size,
      userId,
      workflowId,
      hasPrompt: !!prompt
    });
    
    try {
      // 1. Compress image before upload
      console.log('📦 [STORAGE] Compressing image...');
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.75,
        format: 'webp',
        maxSizeMB: 1.0,
      });

      // 2. Check storage limit
      const storageInfo = await this.getStorageInfo(userId);
      if (storageInfo.images_stored >= storageInfo.storage_limit) {
        throw new Error(`Storage limit reached. You have ${storageInfo.images_stored}/${storageInfo.storage_limit} images. Please delete some images to free up space.`);
      }

      // 3. Ensure Cloudinary is initialized before upload
      const { cloudinaryService: cs } = await import('./cloudinaryService');
      if (!cs.isInitialized || !cs.isInitialized()) {
        console.warn('⚠️ Cloudinary not initialized, attempting to initialize...');
        const { initializeCloudinaryFromDatabase } = await import('./cloudinaryInit');
        const initialized = await initializeCloudinaryFromDatabase();
        if (!initialized) {
          throw new Error('Cloudinary initialization failed. Please check your settings in Admin Panel → Integrations.');
        }
      }
      
      // 4. Upload to Cloudinary
      console.log('☁️ [STORAGE] Uploading to Cloudinary...', {
        compressedSize: compressedFile.size,
        fileName: compressedFile.name
      });
      
      // Upload to Cloudinary without metadata (metadata stored in our database)
      const cloudinaryResponse = await cloudinaryService.uploadImage(
        compressedFile,
        userId,
        'klint-studios'
        // No metadata - we store it in our database instead
      );
      
      console.log('✅ [STORAGE] Cloudinary upload successful!', {
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id
      });

      // 5. Get user plan for expiration date
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // 5. Calculate expiration date based on plan
      const retentionDays = this.getRetentionDays(userProfile.plan);
      const expirationDate = retentionDays > 0
        ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // 6. Save to database
      const { data: imageData, error } = await supabase
        .from('user_images')
        .insert({
          user_id: userId,
          cloudinary_url: cloudinaryResponse.secure_url,
          cloudinary_public_id: cloudinaryResponse.public_id,
          original_size: file.size,
          compressed_size: compressedFile.size,
          workflow_id: workflowId || null,
          prompt: prompt || null,
          metadata: metadata || null,
          expires_at: expirationDate || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [STORAGE] Database insert error:', error);
        throw error;
      }

      // 8. Update user's storage count (trigger handles this, but can manually call for immediate UI update)
      console.log('🔄 [STORAGE] Updating user storage count...');
      await supabase.rpc('update_user_storage_count', { p_user_id: userId });

      console.log('✅ [STORAGE] Image uploaded and saved successfully!', {
        imageId: imageData.id,
        cloudinaryUrl: imageData.cloudinary_url,
        workflowId: imageData.workflow_id,
        userId: imageData.user_id
      });
      return imageData as UserImage;
    } catch (error) {
      console.error('❌ [STORAGE] Storage service error:', error);
      console.error('❌ [STORAGE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        userId,
        workflowId
      });
      throw error;
    }
  }

  /**
   * Get user's storage information
   */
  async getStorageInfo(userId: string): Promise<StorageInfo> {
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('images_stored, storage_limit')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      return {
        images_stored: 0,
        storage_limit: 10,
        usage_percentage: 0,
      };
    }

    const usage_percentage = userProfile.storage_limit > 0
      ? Math.min(100, (userProfile.images_stored / userProfile.storage_limit) * 100)
      : 0;

    return {
      images_stored: userProfile.images_stored || 0,
      storage_limit: userProfile.storage_limit || 10,
      usage_percentage,
    };
  }

  /**
   * Get user's images
   */
  async getUserImages(
    userId: string,
    workflowId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserImage[]> {
    let query = supabase
      .from('user_images')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching user images:', error);
      return [];
    }

    return (data || []) as UserImage[];
  }

  /**
   * Delete image (soft delete)
   */
  async deleteImage(imageId: string, userId: string): Promise<boolean> {
    try {
      // 1. Get image to get Cloudinary public_id
      const { data: image } = await supabase
        .from('user_images')
        .select('cloudinary_public_id')
        .eq('id', imageId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!image) {
        throw new Error('Image not found');
      }

      // 2. Soft delete in database
      const { error: dbError } = await supabase
        .from('user_images')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', imageId)
        .eq('user_id', userId);

      if (dbError) {
        throw dbError;
      }

      // 3. Delete from Cloudinary (optional - can be done in background)
      if (image.cloudinary_public_id) {
        try {
          await cloudinaryService.deleteImage(image.cloudinary_public_id);
        } catch (cloudinaryError) {
          console.warn('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
          // Continue even if Cloudinary deletion fails
        }
      }

      console.log('✅ Image deleted:', imageId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get storage limits by plan
   */
  getStorageLimit(plan: UserPlan): number {
    switch (plan) {
      case 'free':
        return 10;
      case 'solo':
        return 100;
      case 'studio':
        return 500;
      case 'brand':
        return 2000;
      default:
        return 10;
    }
  }

  /**
   * Get retention days by plan
   */
  getRetentionDays(plan: UserPlan): number {
    switch (plan) {
      case 'free':
        return 7;
      case 'solo':
        return 30;
      case 'studio':
        return 90;
      case 'brand':
        return 180;
      default:
        return 7;
    }
  }
}

export const storageService = new StorageService();

