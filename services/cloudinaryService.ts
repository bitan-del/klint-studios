/**
 * Cloudinary service for image storage
 * Handles upload, deletion, and URL management
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  created_at: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
}

class CloudinaryService {
  private config: CloudinaryConfig | null = null;

  /**
   * Initialize Cloudinary with configuration
   */
  initialize(config: CloudinaryConfig) {
    if (!config.cloudName || !config.uploadPreset) {
      throw new Error('Cloudinary config missing required fields: cloudName and uploadPreset');
    }
    this.config = config;
    console.log('✅ Cloudinary service initialized with config:', {
      cloudName: config.cloudName,
      uploadPreset: config.uploadPreset,
      hasApiKey: !!config.apiKey,
      hasApiSecret: !!config.apiSecret
    });
  }
  
  /**
   * Check if Cloudinary is initialized
   */
  isInitialized(): boolean {
    return this.config !== null && !!this.config.cloudName && !!this.config.uploadPreset;
  }

  /**
   * Upload image to Cloudinary
   * Note: Metadata is stored in our database, not sent to Cloudinary
   */
  async uploadImage(
    file: File,
    userId: string,
    folder: string = 'klint-studios'
  ): Promise<CloudinaryUploadResponse> {
    // If not initialized, try to initialize from database
    if (!this.isInitialized()) {
      console.warn('⚠️ Cloudinary not initialized, attempting to initialize from database...');
      try {
        const { initializeCloudinaryFromDatabase } = await import('./cloudinaryInit');
        const initialized = await initializeCloudinaryFromDatabase();
        if (!initialized) {
          throw new Error('Failed to initialize Cloudinary from database');
        }
      } catch (error) {
        console.error('❌ Cloudinary not initialized!');
        console.error('   Config:', this.config);
        console.error('   Error:', error);
        console.error('   Please check:');
        console.error('   1. Settings are in database (run: scripts/setup-cloudinary.sql)');
        console.error('   2. Or configure in Admin Panel → Integrations → Cloudinary');
        console.error('   3. Refresh the page after configuration');
        throw new Error('Cloudinary not initialized. Please set up Cloudinary credentials in Admin Panel → Integrations.');
      }
    }
    
    // Double-check after initialization attempt
    if (!this.isInitialized()) {
      throw new Error('Cloudinary initialization failed. Please check your settings and refresh the page.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    // Only add folder if it's a valid string (some presets don't allow folder)
    // formData.append('folder', `${folder}/${userId}`);
    
    // Note: Minimal upload - only file and upload_preset
    // Folder and other settings should be configured in the upload preset itself
    // This avoids any context/metadata errors

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
      
      console.log('📤 Uploading to Cloudinary:', {
        url: uploadUrl,
        preset: this.config.uploadPreset,
        fileSize: file.size,
        fileName: file.name
      });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error?.message || errorData.message || 'Failed to upload image');
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log('✅ Image uploaded to Cloudinary:', data.secure_url);
      return data;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('Cloudinary not initialized');
    }

    try {
      // For unsigned uploads, we need to use the delete API with signature
      // For now, we'll use a server-side endpoint or signed deletion
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            // Note: For production, you'll need to sign this request server-side
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete image');
      }

      console.log('✅ Image deleted from Cloudinary:', publicId);
      return true;
    } catch (error) {
      console.error('❌ Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(publicId: string, transformations?: string): string {
    if (!this.config) {
      throw new Error('Cloudinary not initialized');
    }

    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;
    const transform = transformations || 'q_auto,f_auto';
    return `${baseUrl}/${transform}/${publicId}`;
  }
}

export const cloudinaryService = new CloudinaryService();

