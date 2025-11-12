import { supabase } from './supabaseClient';
import type { PixelMuseProfile, PixelMuseGeneration } from '../types/pixelMuse';

/**
 * PixelMuse Service - Manages style profiles for creative projects
 */

/**
 * Get all PixelMuse profiles for the current user
 */
export async function getPixelMuseProfiles(): Promise<PixelMuseProfile[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pixel_muse_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching PixelMuse profiles:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Provide user-friendly error messages
      if (error.code === '42P01') {
        throw new Error('Database tables not found. Please run the PixelMuse migration in Supabase SQL Editor.');
      }
      throw error;
    }

    return (data || []).map(transformPixelMuseProfile);
  } catch (error) {
    console.error('Error in getPixelMuseProfiles:', error);
    throw error;
  }
}

/**
 * Get a single PixelMuse profile by ID
 */
export async function getPixelMuseProfile(id: string): Promise<PixelMuseProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pixel_muse_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching PixelMuse profile:', error);
      throw error;
    }

    return data ? transformPixelMuseProfile(data) : null;
  } catch (error) {
    console.error('Error in getPixelMuseProfile:', error);
    throw error;
  }
}

/**
 * Create a new PixelMuse profile
 */
export async function createPixelMuseProfile(
  name: string,
  clientId?: string
): Promise<PixelMuseProfile> {
  try {
    console.log('🎨 [PixelMuse] Starting profile creation...');
    console.log('📝 Profile name:', name);
    console.log('👤 Client ID:', clientId || 'none');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [PixelMuse] Auth error:', authError);
      throw new Error('Authentication error: ' + authError.message);
    }
    
    if (!user) {
      console.error('❌ [PixelMuse] No user found');
      throw new Error('User not authenticated');
    }
    
    console.log('✅ [PixelMuse] User authenticated:', user.id, user.email);

    const insertData = {
      user_id: user.id,
      name,
      client_id: clientId || null,
      color_palette: [],
      reference_images: [],
      training_images: [],
      feedback_history: [],
      training_completeness: 0,
    };
    
    console.log('💾 [PixelMuse] Inserting data:', insertData);

    const { data, error } = await supabase
      .from('pixel_muse_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [PixelMuse] Database error:', error);
      console.error('❌ [PixelMuse] Error code:', error.code);
      console.error('❌ [PixelMuse] Error message:', error.message);
      console.error('❌ [PixelMuse] Error details:', error.details);
      console.error('❌ [PixelMuse] Error hint:', error.hint);
      
      // Provide user-friendly error messages
      if (error.code === '42P01') {
        const msg = 'Database tables not found. Please run the PixelMuse migration in Supabase SQL Editor.\n\nFile: supabase/migrations/1000_pixel_muse_setup.sql';
        console.error('❌ [PixelMuse]', msg);
        throw new Error(msg);
      } else if (error.code === '23505') {
        throw new Error('A profile with this name already exists. Please choose a different name.');
      } else if (error.code === '23503') {
        throw new Error('Invalid user. Please log in again.');
      } else if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        throw new Error('Table not found. Please run the migration in Supabase SQL Editor:\n\nFile: supabase/migrations/1000_pixel_muse_setup.sql\n\nSee: RUN_PIXELMUSE_MIGRATION.md for instructions');
      } else {
        throw new Error(`Failed to create profile: ${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})`);
      }
    }

    console.log('✅ [PixelMuse] Profile created successfully:', data);
    const transformed = transformPixelMuseProfile(data);
    console.log('✅ [PixelMuse] Transformed profile:', transformed);
    return transformed;
  } catch (error) {
    console.error('Error in createPixelMuseProfile:', error);
    throw error;
  }
}

/**
 * Update a PixelMuse profile
 */
export async function updatePixelMuseProfile(
  id: string,
  updates: Partial<PixelMuseProfile>
): Promise<PixelMuseProfile> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Transform updates to match database schema
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
    if (updates.color_palette !== undefined) dbUpdates.color_palette = updates.color_palette;
    if (updates.typography !== undefined) dbUpdates.typography = updates.typography;
    if (updates.composition_style !== undefined) dbUpdates.composition_style = updates.composition_style;
    if (updates.lighting_style !== undefined) dbUpdates.lighting_style = updates.lighting_style;
    if (updates.model_preferences !== undefined) dbUpdates.model_preferences = updates.model_preferences;
    if (updates.reference_images !== undefined) dbUpdates.reference_images = updates.reference_images;
    if (updates.training_images !== undefined) dbUpdates.training_images = updates.training_images;
    if (updates.style_description !== undefined) dbUpdates.style_description = updates.style_description;
    if (updates.feedback_history !== undefined) dbUpdates.feedback_history = updates.feedback_history;
    if (updates.training_completeness !== undefined) dbUpdates.training_completeness = updates.training_completeness;

    const { data, error } = await supabase
      .from('pixel_muse_profiles')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating PixelMuse profile:', error);
      throw error;
    }

    return transformPixelMuseProfile(data);
  } catch (error) {
    console.error('Error in updatePixelMuseProfile:', error);
    throw error;
  }
}

/**
 * Delete a PixelMuse profile
 */
export async function deletePixelMuseProfile(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('pixel_muse_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting PixelMuse profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deletePixelMuseProfile:', error);
    throw error;
  }
}

/**
 * Get past generations for a profile
 */
export async function getPixelMuseGenerations(profileId: string): Promise<PixelMuseGeneration[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pixel_muse_generations')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Get last 50 generations

    if (error) {
      console.error('Error fetching PixelMuse generations:', error);
      throw error;
    }

    return (data || []).map(transformPixelMuseGeneration);
  } catch (error) {
    console.error('Error in getPixelMuseGenerations:', error);
    throw error;
  }
}

/**
 * Analyze reference images and extract style
 */
export async function analyzePixelMuseStyle(
  profileId: string,
  imageUrls: string[]
): Promise<Partial<PixelMuseProfile>> {
  try {
    console.log('Analyzing style for profile:', profileId);
    console.log('Image URLs:', imageUrls);

    // Placeholder: Extract colors from first image
    // In production, use actual image analysis
    const extractedColors = ['#000000', '#FFFFFF', '#FF0000']; // Placeholder
    
    return {
      color_palette: extractedColors,
      style_description: 'Bold, minimalist style with high contrast',
      training_completeness: Math.min(100, imageUrls.length * 10), // 10% per image
    };
  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
}

/**
 * Transform database row to PixelMuseProfile type
 */
function transformPixelMuseProfile(row: any): PixelMuseProfile {
  console.log('🔄 [PixelMuse] Transforming profile row:', row);
  
  const transformed = {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    client_id: row.client_id,
    color_palette: row.color_palette || [],
    typography: row.typography || {},
    composition_style: row.composition_style,
    lighting_style: row.lighting_style,
    model_preferences: row.model_preferences || {},
    reference_images: row.reference_images || [],
    training_images: row.training_images || [],
    style_description: row.style_description,
    feedback_history: row.feedback_history || [],
    training_completeness: row.training_completeness || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  
  console.log('✅ [PixelMuse] Transformed profile:', transformed);
  return transformed;
}

/**
 * Transform database row to PixelMuseGeneration type
 */
function transformPixelMuseGeneration(row: any): PixelMuseGeneration {
  return {
    id: row.id,
    profile_id: row.profile_id,
    user_id: row.user_id,
    image_url: row.image_url,
    post_copy: row.post_copy,
    prompt: row.prompt,
    aspect_ratio: row.aspect_ratio,
    generation_index: row.generation_index,
    batch_id: row.batch_id,
    created_at: row.created_at,
    is_saved_to_creations: row.is_saved_to_creations || false,
    saved_at: row.saved_at,
    model_name: row.model_name,
  };
}

