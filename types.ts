import type React from 'react';

// From types/shared.ts

export interface Aperture {
  id: string;
  name: string;
  description: string;
}

export interface FocalLength {
  id: string;
  name: string;
  description: string;
}

export interface CameraAngle {
  id: string;
  name: string;
  description: string;
}

export interface LightingDirection {
  id: string;
  name: string;
  description: string;
}

export interface LightQuality {
  id: string;
  name: string;
  description: string;
}

export interface CatchlightStyle {
  id: string;
  name: string;
  description: string;
}

export interface ColorGrade {
  id: string;
  name: string;
  description: string;
}

// Base controls shared between modes
export interface BaseCreativeControls {
  aperture: Aperture;
  focalLength: FocalLength;
  cameraAngle: CameraAngle;
  lightingDirection: LightingDirection;
  lightQuality: LightQuality;
  catchlightStyle: CatchlightStyle;
  colorGrade: ColorGrade;
  negativePrompt: string;
  isHyperRealismEnabled: boolean;
  cinematicLook: boolean;
  styleStrength: number;
  customPrompt: string;
  customLightingDirection: string;
  customLightQuality: string;
  customCatchlightStyle: string;
}

export interface Background {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image';
  value: string; // color hex, gradient CSS, image URL, or base64
  category?: string;
}

export interface Lighting {
  id:string;
  name: string;
  description: string;
  isDynamic?: boolean;
}

export interface Scene {
  background: Background;
  lighting: Lighting;
  timeOfDay: 'Sunrise' | 'Midday' | 'Golden Hour' | 'Twilight' | 'Night' | null;
  // FIX: Removed obsolete comment; properties are present.
  sceneProps: string;
  environmentalEffects: string;
}

// FIX: Correct GenerationMode to include video
export type GenerationMode = 'image' | 'video';

// FIX: Add 'reimagine' and 'video' to StudioMode type.
export type StudioMode = 'apparel' | 'product' | 'design' | 'reimagine' | 'video';

export interface AspectRatio {
    id: string;
    name: string;
    value: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
    icon: React.ReactNode;
}

// FIX: Add missing Animation interface
export interface Animation {
  id: string;
  name: string;
  description: string;
}


// from types/apparel.ts

// FIX: Add optional 'source' property to distinguish library models from user-saved models.
export interface AIModel {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  region: string;
  country: string;
  gender: 'Male' | 'Female';
  source?: 'library' | 'user-saved';
}

export type ApparelCategory = 'Uncategorized' | 'Upper Body' | 'Lower Body' | 'Full Body' | 'Outerwear' | 'Accessory' | 'Footwear' | 'Handheld';

export interface ApparelItem {
  id:string;
  base64: string; // Represents the Front View
  // FIX: Added missing optional properties for other apparel views.
  backViewBase64?: string | null;
  detailViewBase64?: string | null;
  description: string;
  category: ApparelCategory;
  isProcessing: boolean;
}

export interface ShotType {
  id: string;
  name: string;
  description: string;
  category: 'Standard' | 'Creative' | 'Detail';
}

export interface Expression {
  id: string;
  name: string;
  description: string;
}

export interface ProductInteraction {
  id: string;
  name: string;
  // FIX: Made 'description' required to align with helper function type constraints.
  description: string;
}

export interface Fabric {
  id: string;
  name: string;
  description: string;
}

// Controls specific to Apparel mode
export interface ApparelCreativeControls extends BaseCreativeControls {
  shotType: ShotType;
  customShotType: string;
  expression: Expression;
  customExpression: string;
  fabric: Fabric;
  customFabric: string;
  customColorGrade: string;
  customCameraAngle: string;
  customFocalLength: string;
  customAperture: string;
  // FIX: Removed obsolete comment; properties are present.
  hairStyle: string;
  makeupStyle: string;
  garmentStyling: string;
  // FIX: Added missing customAnimationPrompt for video generation
  customAnimationPrompt: string;
}

export interface ArtDirectorSuggestion {
  id: string;
  conceptName: string;
  shotTypeId: string;
  lightingId: string;
  backgroundId: string;
  expressionId: string;
  apertureId: string;
  focalLengthId: string;
  cameraAngleId: string;
  colorGradeId: string;
  reasoning: string;
}

export interface PackShot {
  shotId: string;
  expressionId: string;
  cameraAngleId?: string;
  name: string; 
}

// FIX: Add 'pov' to EcommercePack type to support point-of-view packshots.
export type EcommercePack = 'none' | 'essential' | 'plus' | 'dynamic' | 'editorial' | 'pov';

// FIX: Add missing 'Look' interface for saving and applying creative settings.
export interface Look {
  id: string;
  name: string;
  controls: ApparelCreativeControls;
  scene: Scene;
}

// from types/product.ts

export interface Surface {
  id: string;
  name: string;
  description: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  category: 'Standard' | 'Artistic';
}

// Controls specific to Product mode
export interface ProductCreativeControls extends BaseCreativeControls {
  productShadow: 'None' | 'Soft' | 'Hard';
  customProps: string;
  surface: Surface;
  customSurface: string;
  productMaterial: Material;
  customColorGrade: string;
  // On-model controls
  shotType: ShotType;
  customShotType: string;
  expression: Expression;
  customExpression: string;
  modelInteractionType: ProductInteraction;
  customModelInteraction: string;
  // FIX: Add missing properties to support custom product material and camera angle prompts.
  customProductMaterial: string;
  customCameraAngle: string;
  customFocalLength: string;
  customAperture: string;
  // FIX: Added missing customAnimationPrompt for video generation
  customAnimationPrompt: string;
}

// FIX: Added missing StagedAsset type for product staging.
export interface StagedAsset {
  id: string; // 'product' or index of companion asset
  base64: string;
  x: number; // percentage
  y: number; // percentage
  z: number; // z-index
  scale: number; // percentage of canvas size
}

export interface ProductSceneTemplate {
  id: string;
  name:string;
  description: string;
  scene: Partial<Scene>;
  controls: Partial<ProductCreativeControls>;
  // FIX: Added missing stagedAssets property.
  stagedAssets?: StagedAsset[];
}

export type ProductEcommercePack = 'none' | 'essential' | 'plus';

export interface ProductPackShot {
  name: string;
  cameraAngleId: string;
  focalLengthId?: string;
}

// FIX: Add missing SceneSuggestion interface to resolve import error.
export interface SceneSuggestion {
  conceptName: string;
  sceneDescription: string;
  previewPrompt: string;
  previewImageB64?: string | null;
}

// from types/design.ts

export interface DesignInput {
  id:string;
  base64: string; 
  name: string;
}

export type DesignPlacement = 'frontCenter' | 'leftChest' | 'rightChest' | 'frontTopCenter' | 'backCenter' | 'fullFront' | 'leftSleeve';
export type MockupStyle = 'hanging' | 'flatLay' | 'folded';
export type FabricStyle = 'standard' | 'heavy' | 'vintage' | 'acidWash';
export type DesignLightingStyle = 'studio' | 'dramatic' | 'topDown';
export type DesignCameraAngle = 'front' | 'angled' | 'hero' | 'detail' | 'back';
export type PrintStyle = 'screen' | 'embroidery' | 'vintage' | 'puff';

export interface DesignSceneTemplate {
  id: string;
  name: string;
  description: string;
  scene: Partial<Scene>;
  photography: {
    lightingStyle: DesignLightingStyle;
    cameraAngle: DesignCameraAngle;
  }
}

interface DesignSideControls {
  placement: DesignPlacement;
  scale: number; // percentage 5-200
  rotation: number; // degrees -180 to 180
  offsetX: number; // percentage -50 to 50
  offsetY: number; // percentage -50 to 50
}

export interface DesignPlacementControls {
  // Placement
  front: DesignSideControls;
  back: DesignSideControls;
  // Realism
  fabricBlend: number; // percentage 0-100
  wrinkleConform: boolean;
  // Material Engine
  mockupStyle: MockupStyle;
  fabricStyle: FabricStyle;
  shirtColor: string; // hex code
  apparelType: string; // e.g., "Oversized heavy cotton t-shirt"
  printStyle: PrintStyle;
  // Photography
  lightingStyle: DesignLightingStyle;
  cameraAngle: DesignCameraAngle;
  // Batch
  isMockupPackActive: boolean;
}

// from types/auth.ts
// FIX: Add 'free' to UserPlan to support the free tier defined in permissionsService.
export type UserPlan = 'free' | 'solo' | 'studio' | 'brand';
// FIX: Add UserRole type
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  role?: UserRole;
  generationsUsed: number;
  // FIX: Add missing properties for daily usage tracking to resolve type errors in App.tsx and AuthContext.tsx.
  dailyGenerationsUsed: number;
  // FIX: Add missing property for daily video usage tracking to resolve type errors in AuthContext.tsx.
  dailyVideosUsed: number;
  lastGenerationDate: string;
}
// FIX: Add missing ReimagineCreativeControls interface.
// from types/reimagine.ts
export interface ReimagineCreativeControls {
    newModelDescription: string;
    newBackgroundDescription: string;
    negativePrompt: string;
}
// FIX: Add missing ReimagineState interface to resolve import error.
// from types/reimagine.ts
export interface ReimagineState {
  reimagineSourcePhoto: string | null;
  newModelPhoto: string | null;
  reimagineControls: ReimagineCreativeControls;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  images?: string[]; // Array of image data URLs for reference images
  generatedImage?: string; // Generated image data URL (for model responses)
}

// FIX: Add missing Video types
export interface VideoCreativeControls {
  resolution: '720p' | '1080p';
}

export interface VideoState {
  videoPrompt: string;
  videoSourceImage: string | null;
  videoControls: VideoCreativeControls;
  isSuggestingPrompts: boolean;
  promptSuggestions: string[];
}

// from types/admin.ts
export interface PaymentGatewaySettings {
  publishableKey: string;
  secretKey: string;
}

export interface PaymentSettings {
  stripe: PaymentGatewaySettings;
  razorpay: PaymentGatewaySettings;
}

export type Currency = 'USD' | 'EUR' | 'INR';

export interface PlanPrices {
  solo: number;
  studio: number;
  brand: number;
}

export interface SupabaseSettings {
  url: string;
  anonKey: string;
}

export interface GeminiSettings {
  apiKey: string;
}

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface CanvaSettings {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiSettings {
  supabase: SupabaseSettings;
  gemini: GeminiSettings;
  cloudinary: CloudinarySettings;
  canva?: CanvaSettings;
}