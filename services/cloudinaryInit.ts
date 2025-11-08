/**
 * Initialize Cloudinary service on app startup
 * This ensures Cloudinary is ready even before AuthContext loads
 */

import { cloudinaryService } from './cloudinaryService';
import { databaseService } from './databaseService';

let initializationAttempted = false;
let initializationPromise: Promise<boolean> | null = null;

export const initializeCloudinaryFromDatabase = async (force: boolean = false): Promise<boolean> => {
  // If there's already an initialization in progress, wait for it (unless forcing)
  if (initializationPromise && !force) {
    return initializationPromise;
  }
  
  // Check if already initialized (using the imported service)
  if (!force && cloudinaryService.isInitialized && cloudinaryService.isInitialized()) {
    console.log('✅ Cloudinary already initialized, skipping...');
    return true;
  }
  
  initializationAttempted = true;
  
  initializationPromise = (async () => {
    try {
      console.log('🔄 Attempting to initialize Cloudinary from database...');
      
      // Load Cloudinary settings from database
      const cloudinaryCloudName = await databaseService.getAdminSetting('cloudinary_cloud_name');
      const cloudinaryUploadPreset = await databaseService.getAdminSetting('cloudinary_upload_preset');
      const cloudinaryApiKey = await databaseService.getAdminSetting('cloudinary_api_key');
      const cloudinaryApiSecret = await databaseService.getAdminSetting('cloudinary_api_secret');
      
      console.log('📦 Retrieved Cloudinary settings:', {
        cloudName: cloudinaryCloudName ? `"${cloudinaryCloudName}"` : 'null',
        uploadPreset: cloudinaryUploadPreset ? `"${cloudinaryUploadPreset}"` : 'null',
        apiKey: cloudinaryApiKey ? 'Found' : 'null',
        apiSecret: cloudinaryApiSecret ? 'Found' : 'null'
      });
      
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        console.log('✅ Cloudinary settings found in database:', {
          cloudName: cloudinaryCloudName,
          uploadPreset: cloudinaryUploadPreset,
          hasApiKey: !!cloudinaryApiKey,
          hasApiSecret: !!cloudinaryApiSecret
        });
        
        // Initialize Cloudinary service
        cloudinaryService.initialize({
          cloudName: String(cloudinaryCloudName),
          uploadPreset: String(cloudinaryUploadPreset),
          apiKey: cloudinaryApiKey ? String(cloudinaryApiKey) : undefined,
          apiSecret: cloudinaryApiSecret ? String(cloudinaryApiSecret) : undefined
        });
        
        console.log('✅ Cloudinary service initialized successfully');
        return true;
      } else {
        console.error('❌ Cloudinary settings not found in database!');
        console.error('   Cloud Name:', cloudinaryCloudName);
        console.error('   Upload Preset:', cloudinaryUploadPreset);
        console.error('   Please run: scripts/setup-cloudinary.sql');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing Cloudinary:', error);
      initializationAttempted = false; // Allow retry on error
      initializationPromise = null;
      return false;
    }
  })();
  
  return initializationPromise;
};

// Auto-initialize when this module loads (if we're in browser)
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure database is ready
  setTimeout(() => {
    initializeCloudinaryFromDatabase();
  }, 1000);
}

