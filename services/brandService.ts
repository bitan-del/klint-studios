import { supabase } from './supabaseClient';
import type { BrandProfile } from '../types/brand';

/**
 * Brand Service - Manages brand profiles for Advanced Mode
 * Allows agencies to create and train brand style profiles
 */

/**
 * Get all brand profiles for the current user
 */
export async function getBrandProfiles(): Promise<BrandProfile[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brand profiles:', error);
      throw error;
    }

    return (data || []).map(transformBrandProfile);
  } catch (error) {
    console.error('Error in getBrandProfiles:', error);
    throw error;
  }
}

/**
 * Get a single brand profile by ID
 */
export async function getBrandProfile(id: string): Promise<BrandProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching brand profile:', error);
      throw error;
    }

    return data ? transformBrandProfile(data) : null;
  } catch (error) {
    console.error('Error in getBrandProfile:', error);
    throw error;
  }
}

/**
 * Create a new brand profile
 */
export async function createBrandProfile(
  name: string,
  clientId?: string
): Promise<BrandProfile> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: user.id,
        name,
        client_id: clientId || null,
        color_palette: [],
        reference_images: [],
        training_images: [],
        feedback_history: [],
        training_completeness: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brand profile:', error);
      throw error;
    }

    return transformBrandProfile(data);
  } catch (error) {
    console.error('Error in createBrandProfile:', error);
    throw error;
  }
}

/**
 * Update a brand profile
 */
export async function updateBrandProfile(
  id: string,
  updates: Partial<BrandProfile>
): Promise<BrandProfile> {
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
      .from('brand_profiles')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brand profile:', error);
      throw error;
    }

    return transformBrandProfile(data);
  } catch (error) {
    console.error('Error in updateBrandProfile:', error);
    throw error;
  }
}

/**
 * Delete a brand profile
 */
export async function deleteBrandProfile(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('brand_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting brand profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBrandProfile:', error);
    throw error;
  }
}

/**
 * Analyze reference images and extract brand style
 * This is a placeholder - in production, you'd use AI/ML to analyze images
 */
export async function analyzeBrandStyle(
  profileId: string,
  imageUrls: string[]
): Promise<Partial<BrandProfile>> {
  try {
    // TODO: Implement AI analysis
    // For now, return basic analysis
    // In production, this would:
    // 1. Download images
    // 2. Extract colors using color extraction
    // 3. Analyze composition, lighting, style
    // 4. Generate style description
    
    console.log('Analyzing brand style for profile:', profileId);
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
    console.error('Error analyzing brand style:', error);
    throw error;
  }
}

/**
 * Transform database row to BrandProfile type
 */
function transformBrandProfile(row: any): BrandProfile {
  return {
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
}

