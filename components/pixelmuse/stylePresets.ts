import { getStyleImagePath } from '../../utils/styleImageLoader';

export interface StylePreset {
  id: string;
  label: string;
  description: string;
  imageUrl: string; // Local image path for preview
}

// Using local style images from Style folder
// Each image represents the artistic style for style transfer
export const STYLE_PRESETS: StylePreset[] = [
  { 
    id: 'auto', 
    label: 'Auto', 
    description: 'Use reference images as style guide',
    imageUrl: getStyleImagePath('auto')
  },
  { 
    id: 'realistic', 
    label: 'Realistic', 
    description: 'Photo-realistic enhancement',
    imageUrl: getStyleImagePath('realistic')
  },
  { 
    id: 'cinematic-drama', 
    label: 'Cinematic Drama', 
    description: 'High contrast, dramatic lighting',
    imageUrl: getStyleImagePath('cinematic-drama')
  },
  { 
    id: '3d-render', 
    label: '3D Render', 
    description: 'Clean, cute 3D character style',
    imageUrl: getStyleImagePath('3d-render')
  },
  { 
    id: 'retro-print', 
    label: 'Retro Print', 
    description: 'Vintage halftone aesthetic',
    imageUrl: getStyleImagePath('retro-print')
  },
  { 
    id: 'aquarelle', 
    label: 'Aquarelle', 
    description: 'Soft, flowing watercolor',
    imageUrl: getStyleImagePath('aquarelle')
  },
  { 
    id: '80s-glow', 
    label: '80s Glow', 
    description: 'Neon lights and soft focus',
    imageUrl: getStyleImagePath('80s-glow')
  },
  { 
    id: '90s-vibe', 
    label: '90s Vibe', 
    description: 'Nostalgic film grain',
    imageUrl: getStyleImagePath('90s-vibe')
  },
  { 
    id: 'organic-shapes', 
    label: 'Organic Shapes', 
    description: 'Abstract, flowing forms',
    imageUrl: getStyleImagePath('organic-shapes')
  },
  { 
    id: 'analog-film', 
    label: 'Analog Film', 
    description: 'Classic film stock look',
    imageUrl: getStyleImagePath('analog-film')
  },
  { 
    id: 'line-art', 
    label: 'Line Art', 
    description: 'Clean black and white lines',
    imageUrl: getStyleImagePath('line-art')
  },
  { 
    id: 'storybook', 
    label: 'Storybook', 
    description: 'Whimsical illustration',
    imageUrl: getStyleImagePath('storybook')
  },
  { 
    id: 'sunset-glow', 
    label: 'Sunset Glow', 
    description: 'Warm golden hour light',
    imageUrl: getStyleImagePath('sunset-glow')
  },
  { 
    id: 'retro-geometric', 
    label: 'Retro Geometric', 
    description: 'Vintage geometric patterns',
    imageUrl: getStyleImagePath('retro-geometric')
  },
  { 
    id: 'pop-culture', 
    label: 'Pop Culture', 
    description: 'Bold colors and comic style',
    imageUrl: getStyleImagePath('pop-culture')
  },
  { 
    id: 'classic-oil', 
    label: 'Classic Oil', 
    description: 'Traditional oil painting',
    imageUrl: getStyleImagePath('classic-oil')
  },
  { 
    id: 'fashion-mag', 
    label: 'Fashion Mag', 
    description: 'High-end editorial look',
    imageUrl: getStyleImagePath('fashion-mag')
  },
  { 
    id: 'vintage-film', 
    label: 'Vintage Film', 
    description: 'Aged, expired film look',
    imageUrl: getStyleImagePath('vintage-film')
  },
  { 
    id: 'crimson-noir', 
    label: 'Crimson Noir', 
    description: 'Stylized red and black',
    imageUrl: getStyleImagePath('crimson-noir')
  },
  { 
    id: 'schematic', 
    label: 'Schematic', 
    description: 'Technical blueprint style',
    imageUrl: getStyleImagePath('schematic')
  },
  { 
    id: 'mixed-media', 
    label: 'Mixed Media', 
    description: 'Artistic collage style',
    imageUrl: getStyleImagePath('mixed-media')
  },
  { 
    id: 'hand-drawn', 
    label: 'Hand Drawn', 
    description: 'Playful doodle aesthetic',
    imageUrl: getStyleImagePath('hand-drawn')
  },
  { 
    id: 'retro-poster', 
    label: 'Retro Poster', 
    description: 'Vintage advertising style',
    imageUrl: getStyleImagePath('retro-poster')
  },
  { 
    id: 'raw-art', 
    label: 'Raw Art', 
    description: 'Expressive, rough style',
    imageUrl: getStyleImagePath('raw-art')
  },
  { 
    id: 'woodcut', 
    label: 'Woodcut', 
    description: 'Traditional block print',
    imageUrl: getStyleImagePath('woodcut')
  },
  { 
    id: 'anime', 
    label: 'Anime', 
    description: 'Japanese animation style',
    imageUrl: getStyleImagePath('anime')
  },
  { 
    id: 'deco-glamour', 
    label: 'Deco Glamour', 
    description: 'Elegant Art Deco style',
    imageUrl: getStyleImagePath('deco-glamour')
  },
  { 
    id: 'ethereal-aura', 
    label: 'Ethereal Aura', 
    description: 'Soft, glowing atmosphere',
    imageUrl: getStyleImagePath('ethereal-aura')
  },
  { 
    id: 'avant-garde', 
    label: 'Avant Garde', 
    description: 'Experimental fashion',
    imageUrl: getStyleImagePath('avant-garde')
  },
  { 
    id: 'modernist', 
    label: 'Modernist', 
    description: 'Clean Bauhaus geometry',
    imageUrl: getStyleImagePath('modernist')
  },
  { 
    id: 'motion-blur', 
    label: 'Motion Blur', 
    description: 'Dynamic movement',
    imageUrl: getStyleImagePath('motion-blur')
  },
  { 
    id: 'vivid-art', 
    label: 'Vivid Art', 
    description: 'Bright, saturated colors',
    imageUrl: getStyleImagePath('vivid-art')
  },
  { 
    id: 'cubist', 
    label: 'Cubist', 
    description: 'Abstract geometric forms',
    imageUrl: getStyleImagePath('cubist')
  },
  { 
    id: 'mystic-dark', 
    label: 'Mystic Dark', 
    description: 'Dark, mysterious aura',
    imageUrl: getStyleImagePath('mystic-dark')
  },
];

export const DEFAULT_STYLE = STYLE_PRESETS[0]; // Auto
