/**
 * Utility to load style images from the Style folder
 * Maps style IDs to their corresponding image filenames
 */

// Map style IDs to their image filenames in the Style folder
const STYLE_IMAGE_MAP: Record<string, string> = {
  'auto': 'Auto.png',
  'realistic': 'Realistic.png',
  'cinematic-drama': 'Cinematic Drama.png',
  '3d-render': '3D Render.png',
  'retro-print': 'Retro Print.png',
  'aquarelle': 'Aquarelle.png',
  '80s-glow': '80s Glow.png',
  '90s-vibe': '90s Vibe.png',
  'organic-shapes': 'Organic Shapes.png',
  'analog-film': 'Analog Film.png',
  'line-art': 'Line Art.png',
  'storybook': 'Storybook.png',
  'sunset-glow': 'Sunset Glow.png',
  'retro-geometric': 'Retro Geometric.png',
  'pop-culture': 'Pop Culture.png',
  'classic-oil': 'Classic Oil.png',
  'fashion-mag': 'Fashion Mag.png',
  'vintage-film': 'Vintage Film.png',
  'crimson-noir': 'Crimson Noir.png',
  'schematic': 'Schematic.png',
  'mixed-media': 'Mixed Media.png',
  'hand-drawn': 'Hand Drawn.png',
  'retro-poster': 'Retro Poster.png',
  'raw-art': 'Raw Art.png',
  'woodcut': 'Woodcut.png',
  'anime': 'Anime.png',
  'deco-glamour': 'Deco Glamour.png',
  'ethereal-aura': 'Ethereal Aura.png',
  'avant-garde': 'Avant Garde.png',
  'modernist': 'Modernist.png',
  'motion-blur': 'Motion Blur.png',
  'vivid-art': 'Vivid art.png',
  'cubist': 'Cubist.png',
  'mystic-dark': 'Mystic Dark.png',
};

/**
 * Load a style image as a base64 data URL
 * @param styleId - The style ID (e.g., 'realistic', 'anime')
 * @returns Promise resolving to base64 data URL
 */
export async function loadStyleImage(styleId: string): Promise<string> {
  const filename = STYLE_IMAGE_MAP[styleId];
  if (!filename) {
    console.warn(`Style image not found for style ID: ${styleId}`);
    return '';
  }

  try {
    // In Vite, files in public folder are served from root
    const imagePath = `/Style/${filename}`;
    
    const response = await fetch(imagePath);
    if (!response.ok) {
      throw new Error(`Failed to load style image: ${filename}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error loading style image for ${styleId}:`, error);
    return '';
  }
}

/**
 * Get the local image path for a style (for preview/display)
 * @param styleId - The style ID
 * @returns Local image path
 */
export function getStyleImagePath(styleId: string): string {
  const filename = STYLE_IMAGE_MAP[styleId];
  if (!filename) {
    return '';
  }
  return `/Style/${filename}`;
}

