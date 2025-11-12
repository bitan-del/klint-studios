

import {
  StudioMode,
  Scene,
  AspectRatio,
  Animation,
  ColorGrade,
  Look,
  Background,
  User,
  EcommercePack,
  ChatMessage,
} from '../types';
import {
  ASPECT_RATIOS_LIBRARY,
  BACKGROUNDS_LIBRARY,
  LIGHTING_PRESETS,
  ECOMMERCE_PACKS,
  SOCIAL_MEDIA_PACK_SHOT_IDS,
  MOCKUP_PACK_SHOTS_3,
  MOCKUP_PACK_SHOTS_4,
  PRODUCT_ECOMMERCE_PACKS,
  SHOT_TYPES_LIBRARY,
  EXPRESSIONS,
  CAMERA_ANGLES_LIBRARY,
  FOCAL_LENGTHS_LIBRARY,
  CAMERA_ANGLES_LIBRARY_PRODUCT,
} from '../constants';
import { promptService } from '../services/promptService';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import type { StudioStoreSlice } from './StudioContext';
import { withRetry } from '../utils/colorUtils';
// FIX: Correctly import PLAN_DETAILS from permissionsService
import { PLAN_DETAILS } from '../services/permissionsService';

let generationController: AbortController | null = null;

const translations = {
  en: {
    usage_limits: 'Usage Limits',
    per_minute_limit: 'Per Minute Limit',
    images: 'Images',
    daily_limit: 'Daily Limit',
    inputs: 'Inputs',
    settings: 'Settings',
    drop_images_here: 'Drop images here',
    add_clothing_images: 'Add Item Images',
    drop_one_or_more: 'Drop one or more files',
    drag_to_reorder: 'Drag to reorder from innermost to outermost layer',
    ai_layering: 'AI Layering',
    limit_reached: 'Limit Reached',
    generating: 'Generating...',
    generate_social_pack: 'Generate Social Pack',
    generate: 'Generate',
    reimagine: 'Re-imagine',
    generate_video: 'Generate Video',
    model: 'Person',
    clothing: 'Items',
    product: 'Object',
    scene_props_tab: 'Scene & Props',
    mockup: 'Mockup',
    design: 'Design',
    source_photo: 'Source Photo',
    prompt_source: 'Prompt & Source',
    video: 'Video',
    empty_state_apparel: 'Add a subject and items to start your virtual photoshoot.',
    empty_state_product: 'Add an object to begin staging your product scene.',
    empty_state_design: 'Add a mockup and a design to create your product visuals.',
    empty_state_reimagine: 'Upload a source photo to start re-imagining it.',
    empty_state_video: 'Describe a scene or upload an image to generate a video.',
    canvas_apparel: 'Creative Canvas',
    canvas_product: 'Product Staging Canvas',
    canvas_design: 'Design Mockup Canvas',
    canvas_reimagine: 'Photo Re-imagination Canvas',
    canvas_video: 'Video Generation Canvas',
    dress_a_model: 'Virtual Photoshoot',
    stage_a_product: 'Stage an Object',
    create_mockups: 'MultiSnap',
    photo_editor: 'Variation Lab',
    ai_assistant: 'AI Assistant',
    ask_a_question: 'Ask a question...',
    output: 'Output',
    output_tooltip: 'Control the format and quantity of the images you generate, or choose an automated asset pack.',
    looks: 'Looks',
    looks_tooltip: "Save your current Scene and Creative Control settings as a reusable 'Look' for perfect consistency across different sessions.",
    creative_controls: 'Creative Controls',
    creative_controls_tooltip: 'Act as the photographer. Control the camera settings, pose, styling, and other advanced photographic elements.',
    scene_style: 'Scene & Style',
    scene_style_tooltip: 'Act as the art director. Define the environment, lighting, and overall aesthetic mood of the image.',
    post_production: 'Post-Production',
    post_production_tooltip: 'Enhance your generated image with one-click effects like color grading and realism boosts.',
    hyper_realism: 'Hyper Realism',
    cinematic_look: 'Cinematic Look',
    color_grade: 'Color Grade',
    shot_type_pose: 'Shot Type / Pose',
    model_expression: 'Model Expression',
    camera_angle: 'Camera Angle',
    focal_length: 'Focal Length',
    aperture: 'Aperture (Depth of Field)',
    fabric_simulation: 'Fabric Simulation',
    model_styling: 'Model Styling',
    hair_style: 'Hair Style',
    hair_style_desc: "Describe the model's hair.",
    hair_style_placeholder: 'e.g., sleek high ponytail, wavy bob, short braids',
    makeup_style: 'Makeup Style',
    makeup_style_desc: "Describe the model's makeup.",
    makeup_style_placeholder: 'e.g., natural look, bold red lip, smoky eye',
    garment_styling: 'Item Styling',
    styling_details: 'Styling Details',
    styling_details_desc: 'Describe how the item is worn or held.',
    styling_details_placeholder: 'e.g., sleeves rolled up, shirt half-tucked, collar popped',
    advanced_lighting: 'Advanced Lighting',
    light_direction: 'Light Direction',
    light_quality: 'Light Quality',
    eye_catchlight: 'Eye Catchlight',
    advanced_prompting: 'Advanced Prompting',
    negative_prompt: 'Negative Prompt',
    negative_prompt_desc: 'Describe elements to avoid in the image.',
    negative_prompt_placeholder: 'e.g., blurry, text, watermark',
    custom_prompt_override: 'Custom Prompt Override',
    custom_prompt_desc: "For advanced users. If filled, this prompt will be used INSTEAD of the settings above. You must still provide model and apparel images.",
    custom_prompt_placeholder: 'e.g., A fashion model wearing a blue t-shirt, standing on a beach at sunset, dramatic lighting, 85mm portrait lens...',
    on_model_photoshoot: 'On-Model Photoshoot',
    product_interaction: 'Product Interaction',
    custom_interaction: 'Custom Interaction',
    custom_interaction_desc: 'Describe exactly how the model should interact with the product.',
    custom_interaction_placeholder: 'e.g., wearing the watch on their left wrist',
    scene_templates: 'Scene Templates',
    save_current_scene: 'Save Current Scene',
    save_current_scene_desc: 'Save all current creative and scene settings as a reusable template.',
    save_current_scene_placeholder: "e.g., 'Dark & Moody Look'",
    save: 'Save',
    my_templates: 'My Templates',
    apply_template: 'Apply Template',
    delete_template: 'Delete Template',
    material_reflections: 'Material & Reflections',
    artistic_transformations: 'Artistic Transformations',
    surface_catchlight: 'Surface Catchlight',
    reimagine_settings: 'Re-imagine Settings',
    swap_controls: 'Swap Controls',
    new_model_desc: 'New Model Description',
    new_model_desc_desc: 'Describe the new model to swap in. Leave blank to keep the original.',
    new_model_desc_placeholder: 'e.g., A male model in his late 20s with short, dark hair and a beard',
    new_bg_desc: 'New Background Description',
    new_bg_desc_desc: 'Describe the new background. Leave blank to keep the original.',
    new_bg_desc_placeholder: 'e.g., Standing on a busy street in Tokyo at night, with glowing neon signs',
    design_settings: 'Design Settings',
    batch_tools: 'Batch Tools',
    material_engine: 'Material Engine',
    virtual_photoshoot: 'Virtual Photoshoot',
    design_placement: 'Design Placement',
    ecommerce_pack: 'E-commerce Pack',
    ecommerce_pack_desc: 'Automatically generate a standard set of shots for your product page.',
    social_media_pack: 'Social Media Pack',
    social_media_pack_desc: 'Generates a set of 4 lifestyle shots in 1:1 and 9:16 aspect ratios.',
    complete_asset_pack: 'Complete Asset Pack',
    complete_asset_pack_desc: 'Generates a full set of 8 e-commerce and social media assets in one click.',
    save_current_look: 'Save Current Look',
    save_current_look_desc: 'Save all current creative and scene settings as a reusable template.',
    save_current_look_placeholder: "e.g., 'Summer Campaign Look'",
    my_looks: 'My Looks',
    apply_look: 'Apply Look',
    delete_look: 'Delete Look',
    scene_props: 'Scene Props',
    scene_props_desc: 'Describe objects for the model to interact with or to place in the scene.',
    scene_props_placeholder: 'e.g., holding a cup of coffee, sitting on a vintage chair',
    environmental_effects: 'Environmental Effects',
    environmental_effects_desc: 'Add atmospheric details to the environment.',
    environmental_effects_placeholder: 'e.g., a gentle breeze blowing through hair, light drizzle, thick fog',
    background: 'Background',
    upload_custom_background: 'Upload Custom Background',
    ai_bg_generator: 'AI Background Generator',
    ai_bg_generator_desc: 'Describe the background scene you want to create.',
    ai_bg_generator_placeholder: 'e.g., A minimalist art gallery with a single concrete bench, lit by a soft skylight.',
    generate_background: 'Generate Background',
    generating_background: 'Generating...',
    lighting: 'Lighting',
    time_of_day: 'Time of Day',
    lighting_presets: 'Lighting Presets',
    style_reference: 'Style Reference',
    style_reference_desc: 'Upload an image to guide the aesthetic, color palette, and mood.',
    add_style_reference: 'Add style reference',
    drop_image_here: 'Drop image here',
    style_strength: 'Style Strength',
    surface: 'Surface',
    themed_scenes: 'Themed Scenes',
    ai_scene_stylist: 'AI Scene Stylist',
    suggest_scenes: 'Suggest Scenes',
    styling_scenes: 'Styling scenes...',
    apply_scene: 'Apply Scene',
    custom_shot_type_placeholder: 'e.g., leaning against a brick wall, looking thoughtfully into the distance.',
    custom_color_grade_placeholder: 'e.g., a warm, faded look with soft grain, reminiscent of old film.',
    item_details: 'Item Details',
    item_description_placeholder: 'e.g., A blue silk shirt with a floral pattern',
  },
  hinglish: {
    usage_limits: 'Istemal Ki Seema',
    per_minute_limit: 'Har Minute Ki Seema',
    images: 'Tasveerein',
    daily_limit: 'Rozana Seema',
    inputs: 'Inputs',
    settings: 'Settings',
    drop_images_here: 'Tasveerein yahan daalein',
    add_clothing_images: 'Item ki tasveerein daalein',
    drop_one_or_more: 'Ek ya zyada file daalein',
    drag_to_reorder: 'Sabse andar se bahar ki layer ke liye drag karein',
    ai_layering: 'AI Layering',
    limit_reached: 'Seema Poori Ho Gayi',
    generating: 'Bana raha hai...',
    generate_social_pack: 'Social Pack Banayein',
    generate: 'Banayein',
    reimagine: 'Phir se Kalpana Karein',
    generate_video: 'Video Banayein',
    model: 'Vyakti',
    clothing: 'Vastuon',
    product: 'Vastu',
    scene_props_tab: 'Scene aur Props',
    mockup: 'Mockup',
    design: 'Design',
    source_photo: 'Source Photo',
    prompt_source: 'Prompt aur Source',
    video: 'Video',
    empty_state_apparel: 'Apna virtual photoshoot shuru karne ke liye ek subject aur items daalein.',
    empty_state_product: 'Apna product scene set karne ke liye ek vastu daalein.',
    empty_state_design: 'Apne product visuals banane ke liye ek mockup aur design daalein.',
    empty_state_reimagine: 'Ise phir se kalpana karne ke liye ek source photo upload karein.',
    empty_state_video: 'Video banane ke liye ek scene ka varnan karein ya tasveer upload karein.',
    canvas_apparel: 'Creative Canvas',
    canvas_product: 'Product Staging Canvas',
    canvas_design: 'Design Mockup Canvas',
    canvas_reimagine: 'Photo Re-imagination Canvas',
    canvas_video: 'Video Generation Canvas',
    dress_a_model: 'Virtual Photoshoot',
    stage_a_product: 'Vastu ko Stage Karein',
    create_mockups: 'Mockups Banayein',
    photo_editor: 'Variation Lab',
    ai_assistant: 'AI Sahayak',
    ask_a_question: 'Ek sawaal poochein...',
    output: 'Output',
    output_tooltip: 'Aap jo images generate karte hain unki format aur sankhya ko control karein, ya ek automated asset pack chunein.',
    looks: 'Looks',
    looks_tooltip: "Alag-alag sessions mein bilkul saaf consistency ke liye apne vartaman Scene aur Creative Control settings ko ek 'Look' ke roop mein save karein.",
    creative_controls: 'Creative Controls',
    creative_controls_tooltip: 'Photographer ke roop mein kaam karein. Camera settings, pose, styling, aur anya advanced photographic tatvon ko control karein.',
    scene_style: 'Scene & Style',
    scene_style_tooltip: 'Art director ke roop mein kaam karein. Image ke vatavaran, roshni, aur samagra aesthetic mood ko paribhashit karein.',
    post_production: 'Post-Production',
    post_production_tooltip: 'Apni generate ki gayi image ko color grading aur realism boosts jaise one-click effects se behtar banayein.',
    hyper_realism: 'Hyper Realism',
    cinematic_look: 'Cinematic Look',
    color_grade: 'Color Grade',
    shot_type_pose: 'Shot Type / Pose',
    model_expression: 'Model Ka Bhaav',
    camera_angle: 'Camera Ka Angle',
    focal_length: 'Focal Length',
    aperture: 'Aperture (Depth of Field)',
    fabric_simulation: 'Kapde Ka Simulation',
    model_styling: 'Model Ki Styling',
    hair_style: 'Baalon Ka Style',
    hair_style_desc: "Model ke baalon ka varnan karein.",
    hair_style_placeholder: 'jaise, sleek high ponytail, wavy bob, chhoti braids',
    makeup_style: 'Makeup Ka Style',
    makeup_style_desc: "Model ke makeup ka varnan karein.",
    makeup_style_placeholder: 'jaise, natural look, gehra laal lipstick, smoky eye',
    garment_styling: 'Item Ki Styling',
    styling_details: 'Styling Ki Jaankari',
    styling_details_desc: 'Varnan karein ki vastu kaise pehni ya pakdi gayi hai.',
    styling_details_placeholder: 'jaise, aasteen upar mudi hui, shirt aadhi andar, collar khada',
    advanced_lighting: 'Advanced Roshni',
    light_direction: 'Roshni Ki Disha',
    light_quality: 'Roshni Ki Gunavatta',
    eye_catchlight: 'Aankhon Ki Chamak',
    advanced_prompting: 'Advanced Prompting',
    negative_prompt: 'Negative Prompt',
    negative_prompt_desc: 'Image mein bachne wale tatvon ka varnan karein.',
    negative_prompt_placeholder: 'jaise, dhundhla, text, watermark',
    custom_prompt_override: 'Custom Prompt Override',
    custom_prompt_desc: "Advanced users ke liye. Agar bhara gaya, to yeh prompt upar di gayi settings ke BAJAY istemal kiya jayega. Aapko abhi bhi model aur kapdon ki tasveerein deni hongi.",
    custom_prompt_placeholder: 'jaise, ek fashion model neeli t-shirt pehne hue, suryast ke samay samudra tat par khadi, dramatic roshni, 85mm portrait lens...',
    on_model_photoshoot: 'Model Par Photoshoot',
    product_interaction: 'Product Ke Saath Interaction',
    custom_interaction: 'Custom Interaction',
    custom_interaction_desc: 'Batayein ki model product ke saath kaise interact karega.',
    custom_interaction_placeholder: 'jaise, apne baayein haath mein ghadi pehne hue',
    scene_templates: 'Scene Templates',
    save_current_scene: 'Vartaman Scene Save Karein',
    save_current_scene_desc: 'Sabhi vartaman creative aur scene settings ko ek reusable template ke roop mein save karein.',
    save_current_scene_placeholder: "jaise, 'Dark & Moody Look'",
    save: 'Save Karein',
    my_templates: 'Mere Templates',
    apply_template: 'Template Lagayein',
    delete_template: 'Template Hatayein',
    material_reflections: 'Material Aur Reflections',
    artistic_transformations: 'Artistic Transformations',
    surface_catchlight: 'Satah Ki Chamak',
    reimagine_settings: 'Phir se Kalpana Settings',
    swap_controls: 'Badalne Ke Controls',
    new_model_desc: 'Naye Model Ka Vivaran',
    new_model_desc_desc: 'Badalne ke liye naye model ka vivaran dein. Asli wale ko rakhne ke liye khali chhod dein.',
    new_model_desc_placeholder: 'jaise, Ek purush model jiski umar 20s ke ant mein hai, chhote kale baal aur daadhi ke saath',
    new_bg_desc: 'Naye Background Ka Vivaran',
    new_bg_desc_desc: 'Naye background ka vivaran dein. Asli wale ko rakhne ke liye khali chhod dein.',
    new_bg_desc_placeholder: 'jaise, Tokyo ki ek vyast sadak par raat mein khada, chamakte neon sign ke saath',
    design_settings: 'Design Settings',
    batch_tools: 'Batch Tools',
    material_engine: 'Material Engine',
    virtual_photoshoot: 'Virtual Photoshoot',
    design_placement: 'Design Placement',
    ecommerce_pack: 'E-commerce Pack',
    ecommerce_pack_desc: 'Apne product page ke liye standard shots ka ek set automatically generate karein.',
    social_media_pack: 'Social Media Pack',
    social_media_pack_desc: '1:1 aur 9:16 aspect ratio mein 4 lifestyle shots ka ek set generate karta hai.',
    complete_asset_pack: 'Complete Asset Pack',
    complete_asset_pack_desc: 'Ek click mein 8 e-commerce aur social media assets ka poora set generate karta hai.',
    save_current_look: 'Vartaman Look Save Karein',
    save_current_look_desc: 'Sabhi vartaman creative aur scene settings ko ek reusable template ke roop mein save karein.',
    save_current_look_placeholder: "jaise, 'Summer Campaign Look'",
    my_looks: 'Mere Looks',
    apply_look: 'Look Lagayein',
    delete_look: 'Look Hatayein',
    scene_props: 'Scene Props',
    scene_props_desc: 'Model ke interact karne ya scene mein rakhne ke liye objects ka varnan karein.',
    scene_props_placeholder: 'jaise, coffee ka cup pakde hue, ek vintage kursi par baithe hue',
    environmental_effects: 'Paryavaran Ke Prabhav',
    environmental_effects_desc: 'Vatavaran mein vayumandaliya vivaran jodein.',
    environmental_effects_placeholder: 'jaise, baalon mein halki hawa, halki boonda-bandi, ghana kohra',
    background: 'Background',
    upload_custom_background: 'Custom Background Upload Karein',
    ai_bg_generator: 'AI Background Generator',
    ai_bg_generator_desc: 'Aap jo background scene banana chahte hain uska varnan karein.',
    ai_bg_generator_placeholder: 'jaise, Ek minimalist art gallery jisme ek concrete bench hai, jo ek naram skylight se roshan hai.',
    generate_background: 'Background Banayein',
    generating_background: 'Bana raha hai...',
    lighting: 'Roshni',
    time_of_day: 'Din Ka Samay',
    lighting_presets: 'Roshni Ke Presets',
    style_reference: 'Style Sandarbh',
    style_reference_desc: 'Aesthetic, rang palette, aur mood ko guide karne ke liye ek image upload karein.',
    add_style_reference: 'Style sandarbh jodein',
    drop_image_here: 'Image yahan daalein',
    style_strength: 'Style Ki Takat',
    surface: 'Satah',
    themed_scenes: 'Themed Scenes',
    ai_scene_stylist: 'AI Scene Stylist',
    suggest_scenes: 'Scenes Sujhayein',
    styling_scenes: 'Scenes style kar raha hai...',
    apply_scene: 'Scene Lagayein',
    custom_shot_type_placeholder: 'jaise, ek eet ki deewar ke sahare jhukna, sochte hue door dekhna.',
    custom_color_grade_placeholder: 'jaise, halka fika garam look, purani film ki tarah.',
    item_details: 'Item Ki Jaankari',
    item_description_placeholder: 'jaise, Ek neeli resham ki kameez phoolon ke pattern ke saath',
  },
};

const README_CONTENT = `# Klint Studios: The End of the Photoshoot

## 🚀 Core Concept & Introduction

Traditional photoshoots are the biggest bottleneck for modern fashion and e-commerce brands. They are incredibly **expensive**, requiring models, photographers, studios, and stylists. They are painstakingly **slow**, with weeks passing from shoot to final assets. And they are **logistically complex**, demanding immense coordination.

**Klint Studios is the solution.**

This is an AI-powered virtual content studio designed to completely eliminate the need for physical photoshoots. It empowers brands to generate an infinite variety of world-class, commercially-ready visuals—on-model, on-product, and on-demand—at a fraction of the cost and time.

---

## 🎯 Who Is This For? (The Commercial Purpose)

Klint Studios is built for the teams and individuals who create the visual identity of a brand.

*   **E-commerce & Brand Managers:** Drastically cut your content budget and accelerate your time-to-market. Generate a full suite of product page visuals, from packshots to lifestyle images, in minutes, not weeks.
*   **Marketing & Social Media Teams:** Never run out of content again. Create endless variations of on-brand imagery for campaigns, social media posts, and advertisements, perfectly tailored to any platform or audience.
*   **Fashion & Apparel Designers:** Visualize your creations instantly. See how your designs look on different models and in various styles long before the first sample is ever produced.
*   **Freelancers & Small Agencies:** Offer high-end virtual photography services to your clients without the overhead of a physical studio. Deliver more value, faster.

---

## ✨ Detailed Feature Breakdown

The platform is organized into three powerful, interconnected studios, each tailored to a specific workflow.

### 👕 The Apparel Studio: Virtual Try-On & On-Model Imagery

This is the heart of the platform, where your clothing meets your models.

*   **Upload Your Model:** Preserve your brand's unique identity. Upload an image of your own model, and our AI will maintain their face and body with stunning accuracy for true-to-brand virtual try-ons.
*   **AI Model Agency:** Don't have a model? Choose from our diverse library of professionally generated AI talent, or use the **AI Model Prompter** to create a completely new, exclusive model from a text description. You can even **save generated models** to your private "My Agency" roster for perfect consistency across campaigns.
*   **Intelligent Wardrobe:** Upload one or more flat-lay images of your apparel. The AI automatically analyzes each garment's category (top, outerwear, etc.) and the **AI Stylist** can even suggest the correct layering order.
*   **The Virtual Photoshoot:** This is where the magic happens. The AI seamlessly fuses your model and apparel into a single, photorealistic image. It understands fabric drape, creates natural wrinkles, and matches lighting and shadows perfectly.
*   **AI Art Director:** Feeling uninspired? Our AI assistant analyzes your garment and suggests complete photoshoot concepts—poses, lighting, backgrounds—that best match its style.

### 📦 The Product Studio: Dynamic Staging & Scene Creation

Elevate your product photography from simple cutouts to stunning lifestyle scenes.

*   **AI Background Removal:** Upload any product photo, and the AI will instantly and perfectly remove the background, giving you a clean asset to work with.
*   **Interactive Staging Canvas:** Go beyond text prompts. Visually arrange your product and companion assets (like packaging) on a simple 2D canvas. Drag, drop, scale, and layer your items, and the AI will replicate your exact composition in the final photorealistic render.
*   **AI Prop Assistant:** Need to add some life to your scene? Click "Suggest Props," and the AI will analyze your product and recommend relevant, artistic props to add to your shot.
*   **Hyper-Realistic Material Engine:** Specify your product's material—\`Matte\`, \`Glossy\`, \`Metallic\`, \`Glass\`—and the AI will render light, shadows, and reflections with incredible accuracy.

### 🎨 The Design Studio: The Ultimate Mockup Engine

From a simple graphic to a finished product shot in seconds.

*   **Live Design Preview:** No more guessing. As you upload your mockup (e.g., a blank t-shirt) and your design file, you get a real-time, interactive preview.
*   **WYSIWYG Placement Controls:** Adjust the scale, rotation, and position of your design with sliders and see the changes happen live on the preview canvas. What you see is what you get.
*   **AI Graphic Designer:** Don't have a design? Describe one. Use our Imagen-powered generator to create logos, graphics, and typography from a simple text prompt.
*   **Advanced Realism Engine:** Control how your design interacts with the garment. Use the "Fabric Blend" slider and "Wrinkle Conforming" toggle to create mockups that are indistinguishable from real life.
*   **One-Click Colorway Generator:** Add a list of color codes, and the AI will automatically generate your mockup in every single color variation.

---

### ⚡ Platform Power-Ups: Features Across All Studios

These tools enhance every workflow, providing professional-grade efficiency and quality.

*   **One-Click Asset Packs:** Stop manually resizing and cropping. Generate a complete set of assets from a single setup, including **E-commerce Packs** (front, back, detail shots), **Social Media Packs** (1:1 and 9:16 aspect ratios), or a **Complete Asset Pack** that combines both.
*   **Generative Video:** Bring your static images to life. Animate your final creations with subtle motion, perfect for product pages and social media ads.
*   **AI Post-Production Suite:** Your final image is just the beginning. Apply professional color grades, add a subtle film grain, or use the **Generative Edit** tool to make fine-tuned changes with a simple text prompt.
*   **"Looks" & Scene Templating:** Save any combination of settings—camera, lighting, background, props—as a reusable "Look." Apply it to any new product or model for perfect brand consistency with a single click.
`;

const initialScene: Scene = {
    background: BACKGROUNDS_LIBRARY[0],
    lighting: LIGHTING_PRESETS[1], // Studio Softbox
    timeOfDay: null,
    sceneProps: '',
    environmentalEffects: '',
};

export interface SharedState {
  studioMode: StudioMode;
  scene: Scene;
  aspectRatio: AspectRatio;
  numberOfImages: number;
  isGenerating: boolean;
  loadingMessage: string;
  generatedImages: (string | null)[] | null;
  activeImageSources: { web: { uri: string; title: string; } }[] | null;
  generatedVideoUrl: string | null;
  videoSourceImage: string | null; // For video thumbnail
  activeImageIndex: number | null;
  error: string | null;
  generationCount: number;
  styleReferenceImage: string | null;
  isEditing: boolean;
  imageBeingEdited: { original: string; index: number } | null;
  isApplyingEdit: boolean;
  isApplyingPost: boolean;
  isGuideActive: boolean;
  isBestPracticesModalOpen: boolean;
  isGeneratingBackground: boolean;
  requestTimestamps: number[];
  ecommercePack: EcommercePack;
  isSocialMediaPack: boolean;
  isCompletePack: boolean;
  // Chatbot State
  isChatbotOpen: boolean;
  chatHistory: ChatMessage[];
  isBotReplying: boolean;
  language: 'en' | 'hinglish';
  // Reference images from chat for Photoshoot
  chatReferenceImages: string[];
  // Last image generation context (for follow-up requests)
  lastImageGenerationContext: {
    referenceImages: string[];
    prompt: string;
    generatedImage?: string;
  } | null;
  // API Key State
  isApiKeySelectorOpen: boolean;
  hasSelectedApiKey: boolean;
}

export interface SharedActions {
  setStudioMode: (mode: StudioMode) => void;
  updateScene: (updates: Partial<Scene>) => void;
  selectAspectRatio: (aspectRatio: AspectRatio) => void;
  setNumberOfImages: (count: number) => void;
  setActiveImageIndex: (index: number | null) => void;
  clearError: () => void;
  generateAsset: (user: User | null, onGenerationComplete: (count: number) => Promise<void>) => Promise<void>;
  cancelCurrentProcess: () => void;
  setStyleReferenceImage: (base64: string | null) => void;
  startEditing: (index: number) => void;
  cancelEditing: () => void;
  applyGenerativeEdit: (maskB64: string, prompt: string, apparelRefB64?: string | null) => Promise<void>;
  revertEdit: () => void;
  applyColorGrade: (grade: ColorGrade) => Promise<void>;
  applyRealismBoost: () => Promise<void>;
  applyFilmGrain: (strength: 'Subtle' | 'Medium') => Promise<void>;
  applyHologramEffect: () => Promise<void>;
  generateVideoFromImage: (animation: Animation, onGenerationComplete: (count: number) => Promise<void>) => Promise<void>;
  generatePackFromReference: (onGenerationComplete: (count: number) => Promise<void>, user?: User | null) => Promise<void>;
  generateColorways: (colors: string[], onGenerationComplete: (count: number) => Promise<void>, user?: User | null) => Promise<void>;
  generateAIBackground: (prompt: string) => Promise<void>;
  setGuideActive: (isActive: boolean) => void;
  setBestPracticesModalOpen: (isOpen: boolean) => void;
  setEcommercePack: (pack: EcommercePack) => void;
  setIsSocialMediaPack: (isSocial: boolean) => void;
  setIsCompletePack: (isComplete: boolean) => void;
  // Chatbot Actions
  toggleChatbot: () => void;
  askChatbot: (question: string, images?: string[]) => Promise<void>;
  addReferenceImages: (images: string[]) => void;
  resetChat: () => void;
  // Language Actions
  setLanguage: (language: 'en' | 'hinglish') => void;
  t: (key: keyof (typeof translations)['en']) => string;
  // API Key Actions
  openApiKeySelector: () => void;
  closeApiKeySelector: () => void;
  setHasSelectedApiKey: (hasKey: boolean) => void;
  checkAndSetApiKey: () => Promise<boolean>;
}

export type SharedSlice = SharedState & SharedActions;

const initialSharedState: SharedState = {
    studioMode: 'apparel',
    scene: initialScene,
    aspectRatio: ASPECT_RATIOS_LIBRARY.find(ar => ar.value === '9:16') || ASPECT_RATIOS_LIBRARY[0],
    numberOfImages: 1,
    isGenerating: false,
    loadingMessage: 'Generating your vision...',
    generatedImages: null,
    activeImageSources: null,
    generatedVideoUrl: null,
    videoSourceImage: null,
    activeImageIndex: null,
    error: null,
    generationCount: 0,
    styleReferenceImage: null,
    isEditing: false,
    imageBeingEdited: null,
    isApplyingEdit: false,
    isApplyingPost: false,
    isGuideActive: false,
    isBestPracticesModalOpen: false,
    isGeneratingBackground: false,
    requestTimestamps: [],
    ecommercePack: 'none',
    isSocialMediaPack: false,
    isCompletePack: false,
    // Chatbot - Load from localStorage if available
    isChatbotOpen: false,
    chatHistory: (() => {
        try {
            const saved = localStorage.getItem('klint_chat_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load chat history from localStorage:', e);
        }
        return [
            { role: 'model', text: "Hi! I'm your AI Assistant. How can I help you with your photoshoot today? You can ask me things like 'How do I use my own model?' or 'What are scene templates?'" }
        ];
    })(),
    isBotReplying: false,
    language: 'en',
    chatReferenceImages: (() => {
        try {
            const saved = localStorage.getItem('klint_chat_reference_images');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load chat reference images from localStorage:', e);
        }
        return [];
    })(),
    lastImageGenerationContext: (() => {
        try {
            const saved = localStorage.getItem('klint_last_image_context');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.referenceImages && parsed.prompt) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load last image generation context from localStorage:', e);
        }
        return null;
    })(),
    // API Key State
    isApiKeySelectorOpen: false,
    hasSelectedApiKey: false,
};


export const createSharedSlice: StudioStoreSlice<SharedSlice> = (set, get) => ({
  ...initialSharedState,

  setStudioMode: (mode) => {
    set({ studioMode: mode });
    const currentAspectRatio = get().aspectRatio;

    if (mode === 'video') {
        if (currentAspectRatio.value !== '9:16' && currentAspectRatio.value !== '16:9') {
            const defaultVideoAR = ASPECT_RATIOS_LIBRARY.find(ar => ar.value === '9:16');
            if (defaultVideoAR) {
                set({ aspectRatio: defaultVideoAR });
            }
        }
    } else if (mode === 'apparel' || mode === 'product') {
        const allowedRatios: Array<AspectRatio['value']> = ['1:1', '9:16', '16:9', '3:4', '4:3']; // Expanded for non-pack modes
        if (!allowedRatios.includes(currentAspectRatio.value)) {
            const defaultAR = ASPECT_RATIOS_LIBRARY.find(ar => ar.value === '9:16');
            if (defaultAR) {
                set({ aspectRatio: defaultAR });
            }
        }
    }
  },

  updateScene: (updates) => {
    set(state => ({ scene: { ...state.scene, ...updates } }));
  },

  selectAspectRatio: (aspectRatio) => set({ aspectRatio }),

  setNumberOfImages: (count) => set({ numberOfImages: count }),

  setActiveImageIndex: (index) => set({ activeImageIndex: index, generatedVideoUrl: null }),

  clearError: () => set({ error: null }),
  
  setStyleReferenceImage: (base64) => set({ styleReferenceImage: base64 }),

  cancelCurrentProcess: () => {
    if (generationController) {
      generationController.abort();
    }
    set({ isGenerating: false, loadingMessage: '' });
  },

    setEcommercePack: (pack) => {
      set({ ecommercePack: pack });
      if (pack !== 'none') {
          set({ isSocialMediaPack: false, isCompletePack: false, productEcommercePack: 'none' });
      }
    },

    setIsSocialMediaPack: (isSocial) => {
        set({ isSocialMediaPack: isSocial });
        if (isSocial) {
            set({ ecommercePack: 'none', isCompletePack: false, productEcommercePack: 'none' });
        }
    },

    setIsCompletePack: (isComplete) => {
        set({ isCompletePack: isComplete });
        if (isComplete) {
            set({ ecommercePack: 'none', isSocialMediaPack: false });
        }
    },

    openApiKeySelector: () => set({ isApiKeySelectorOpen: true }),
    closeApiKeySelector: () => set({ isApiKeySelectorOpen: false }),
    setHasSelectedApiKey: (hasKey) => set({ hasSelectedApiKey: hasKey }),
    
    checkAndSetApiKey: async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        set({ hasSelectedApiKey: hasKey });
        return hasKey;
      }
      // In environments without aistudio, assume key is present (e.g. local dev with .env)
      set({ hasSelectedApiKey: true }); 
      return true;
    },

  // Helper function to save generated images to Cloudinary
  saveGeneratedImages: async (user: User | null, studioMode: StudioMode, prompt?: string): Promise<void> => {
    if (!user) {
      console.warn('⚠️ [STORAGE] Cannot save images: User not logged in');
      return;
    }

    const state = get();
    const generatedImages = state.generatedImages;
    
    if (!generatedImages || generatedImages.length === 0 || generatedImages.every(img => !img)) {
      console.warn('⚠️ [STORAGE] No images to save');
      return;
    }

    // Map studio mode to workflow ID (matching MyCreations workflow IDs)
    const workflowIdMap: Record<StudioMode, string> = {
      'apparel': 'ai-photoshoot', // Virtual Photoshoot maps to AI Photoshoot
      'product': 'product-photography', // Stage an Object maps to Product Photography
      'design': 'product-photography', // MultiSnap maps to Product Photography (design mode)
      'reimagine': 'photo-editor', // Variation Lab maps to Photo Editor
      'video': 'video',
    };

    const workflowId = workflowIdMap[studioMode] || 'unknown';
    const finalPrompt = prompt || `Generated ${studioMode} image`;

    console.log(`💾 [STORAGE] Saving ${generatedImages.filter(img => img).length} image(s) for workflow: ${workflowId}`);

    // Helper to convert base64 to File
    const base64ToFile = (base64: string, filename: string): File => {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    };

    let savedCount = 0;
    let failedCount = 0;

    // Save each image
    for (let i = 0; i < generatedImages.length; i++) {
      const imageB64 = generatedImages[i];
      if (!imageB64) {
        console.warn(`⚠️ [STORAGE] Skipping empty image at index ${i}`);
        continue;
      }

      try {
        const imageFile = base64ToFile(imageB64, `${workflowId}_${Date.now()}_${i}.png`);
        await storageService.uploadImage(imageFile, user.id, workflowId, `${finalPrompt} (${i + 1}/${generatedImages.length})`);
        savedCount++;
        console.log(`✅ [STORAGE] Saved image ${i + 1}/${generatedImages.length}`);
      } catch (error) {
        console.error(`❌ [STORAGE] Failed to save image ${i + 1}:`, error);
        failedCount++;
      }
    }

    console.log(`✅ [STORAGE] Save complete: ${savedCount} saved, ${failedCount} failed`);
  },

  generateAsset: async (user, onGenerationComplete) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentTimestamps = get().requestTimestamps.filter(ts => ts > oneMinuteAgo);

    if (user && PLAN_DETAILS[user.plan].rpmLimit && recentTimestamps.length >= PLAN_DETAILS[user.plan].rpmLimit) {
        set({ error: `Rate limit exceeded. Please wait a moment before generating more.` });
        return;
    }

    set({ requestTimestamps: [...recentTimestamps, now] });

    set({
      isGenerating: true,
      error: null,
      generatedImages: null,
      generatedVideoUrl: null,
      activeImageIndex: 0,
      loadingMessage: 'Preparing your vision...',
    });

    try {
      // FIX: Moved onRetry function definition inside the try block to resolve a potential scoping issue in complex control flows.
      const onRetry = (attempt: number, delay: number) => {
          set({ loadingMessage: `API is busy. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt})` });
      };

        const { studioMode, isCompletePack, isSocialMediaPack, ecommercePack, selectedModels, uploadedModelImage } = get();
        const isModelSelected = !!uploadedModelImage || (selectedModels && selectedModels.length > 0);
        const isProductMode = studioMode === 'product';

        const handlePackGeneration = async (packType: 'complete' | 'social') => {
            const essentialPack = ECOMMERCE_PACKS['essential'];
            const socialShotIds = SOCIAL_MEDIA_PACK_SHOT_IDS;
            
            const shotsForEcommerce = packType === 'complete' ? essentialPack.shots : [];
            const shotsForSocial = (packType === 'complete' || packType === 'social') ? socialShotIds : [];

            const totalImages = shotsForEcommerce.length + shotsForSocial.length * 2;
            const packName = packType === 'complete' ? 'Complete Pack' : 'Social Pack';
            
            set({ generatedImages: Array(totalImages).fill(null), activeImageIndex: 0, loadingMessage: `Generating ${packName}... (1/${totalImages})` });
            let imageIndex = 0;

            // --- Generate E-commerce Pack shots ---
            for (const shot of shotsForEcommerce) {
                set({ loadingMessage: `Generating ${packName}... (${imageIndex + 1}/${totalImages})` });
                const state = get();
                const controls = isProductMode ? state.productControls : state.apparelControls;
                const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shot.shotId) || (isProductMode ? state.productControls.shotType : state.apparelControls.shotType);
                const expression = EXPRESSIONS.find(e => e.id === shot.expressionId) || controls.expression;
                const cameraAngle = CAMERA_ANGLES_LIBRARY.find(c => c.id === shot.cameraAngleId) || controls.cameraAngle;

                const overriddenControls = { ...controls, shotType, expression, cameraAngle };
                
                const promptParams = isProductMode
                    ? { ...state, studioMode: 'product', generationMode: 'image', productControls: overriddenControls, aspectRatio: state.aspectRatio.value }
                    : { ...state, studioMode: 'apparel', generationMode: 'image', apparelControls: overriddenControls, aspectRatio: state.aspectRatio.value };

                const { parts } = await promptService.generatePrompt(promptParams as any);

                await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                    set(currentState => {
                        const newImages = [...(currentState.generatedImages || [])];
                        if (imageIndex < newImages.length) newImages[imageIndex] = imageB64;
                        return { generatedImages: newImages };
                    });
                }), { onRetry: onRetry });
                imageIndex++;
            }

            // --- Generate Social Media Pack shots ---
            for (const shotId of shotsForSocial) {
                for (const arValue of ['1:1', '9:16'] as const) {
                    const ar = ASPECT_RATIOS_LIBRARY.find(a => a.value === arValue);
                    if (!ar) continue;
                    
                    set({ loadingMessage: `Generating ${packName}... (${imageIndex + 1}/${totalImages})` });
                    const state = get();
                    const controls = isProductMode ? state.productControls : state.apparelControls;
                    const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shotId) || (isProductMode ? state.productControls.shotType : state.apparelControls.shotType);
                    const overriddenControls = { ...controls, shotType };
                    
                    const promptParams = isProductMode
                        ? { ...state, studioMode: 'product', generationMode: 'image', productControls: overriddenControls, aspectRatio: ar.value }
                        : { ...state, studioMode: 'apparel', generationMode: 'image', apparelControls: overriddenControls, aspectRatio: ar.value };

                    const { parts } = await promptService.generatePrompt(promptParams as any);
                    
                    await withRetry(() => geminiService.generatePhotoshootImage(parts, ar.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                        set(currentState => {
                            const newImages = [...(currentState.generatedImages || [])];
                            if (imageIndex < newImages.length) newImages[imageIndex] = imageB64;
                            return { generatedImages: newImages };
                        });
                    }), { onRetry: onRetry });
                    imageIndex++;
                }
            }
            // Save images before completing
            await get().saveGeneratedImages(user, studioMode, `Complete Pack Generation`);
            await onGenerationComplete(totalImages);
        };

        const isPackMode = (studioMode === 'apparel' || (isProductMode && isModelSelected));
        if (isPackMode && isCompletePack) {
            await handlePackGeneration('complete');
            return;
        }
        if (isPackMode && isSocialMediaPack) {
            await handlePackGeneration('social');
            return;
        }

        // --- Fallback to mode-specific generation ---
        switch (studioMode) {
            case 'apparel': {
                const { numberOfImages, apparelControls } = get();
                if (ecommercePack !== 'none') {
                    const pack = ECOMMERCE_PACKS[ecommercePack];
                    const packShots = pack.shots;
                    set({ generatedImages: Array(packShots.length).fill(null), activeImageIndex: 0, loadingMessage: `Generating ${pack.name}... (1/${packShots.length})` });

                    for (const [index, shot] of packShots.entries()) {
                        set({ loadingMessage: `Generating ${pack.name}... (${index + 1}/${packShots.length})` });
                        const state = get();
                        const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shot.shotId) || state.apparelControls.shotType;
                        const expression = EXPRESSIONS.find(e => e.id === shot.expressionId) || state.apparelControls.expression;
                        const cameraAngle = CAMERA_ANGLES_LIBRARY.find(c => c.id === shot.cameraAngleId) || state.apparelControls.cameraAngle;

                        const overriddenControls = { ...state.apparelControls, shotType, expression, cameraAngle };
                        const { parts } = await promptService.generatePrompt({ ...state, studioMode: 'apparel', generationMode: 'image', apparelControls: overriddenControls });
                        
                        await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                            set(currentState => {
                                const newImages = [...(currentState.generatedImages || [])];
                                newImages[index] = imageB64;
                                return { generatedImages: newImages };
                            });
                        }), { onRetry: onRetry });
                    }
                    // Save images before completing
                    await get().saveGeneratedImages(user, 'apparel', `Virtual Photoshoot E-commerce Pack`);
                    await onGenerationComplete(packShots.length);
                } else {
                    set({ generatedImages: Array(numberOfImages).fill(null), activeImageIndex: 0 });
                    const { parts } = await promptService.generatePrompt({ studioMode: 'apparel', generationMode: 'image', ...get() });
                    await withRetry(() => geminiService.generatePhotoshootImage(parts, get().aspectRatio.value, numberOfImages, apparelControls.negativePrompt, (imageB64, index) => {
                      set(state => {
                        const newImages = [...(state.generatedImages || Array(numberOfImages).fill(null))];
                        newImages[index] = imageB64;
                        return { generatedImages: newImages };
                      });
                    }), { onRetry: onRetry });
                    // Save images before completing
                    await get().saveGeneratedImages(user, 'apparel', `Virtual Photoshoot Generation`);
                    await onGenerationComplete(numberOfImages);
                }
                break;
            }
            case 'product': {
                const { productEcommercePack, numberOfImages, productControls } = get();
                if (isModelSelected && ecommercePack !== 'none') {
                    const pack = ECOMMERCE_PACKS[ecommercePack];
                    const packShots = pack.shots;
                    set({ generatedImages: Array(packShots.length).fill(null), activeImageIndex: 0, loadingMessage: `Generating ${pack.name}... (1/${packShots.length})` });
            
                    for (const [index, shot] of packShots.entries()) {
                        set({ loadingMessage: `Generating ${pack.name}... (${index + 1}/${packShots.length})` });
                        const state = get();
                        const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shot.shotId) || state.productControls.shotType;
                        const expression = EXPRESSIONS.find(e => e.id === shot.expressionId) || state.productControls.expression;
                        const cameraAngle = CAMERA_ANGLES_LIBRARY.find(c => c.id === shot.cameraAngleId) || state.productControls.cameraAngle;
                        const overriddenControls = { ...state.productControls, shotType, expression, cameraAngle };
                        const { parts } = await promptService.generatePrompt({ ...state, studioMode: 'product', generationMode: 'image', productControls: overriddenControls });
            
                        await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                            set(currentState => {
                                const newImages = [...(currentState.generatedImages || [])];
                                if (newImages.length > index) newImages[index] = imageB64;
                                return { generatedImages: newImages };
                        });
                    }), { onRetry: onRetry });
                    }
                    // Save images before completing
                    await get().saveGeneratedImages(user, 'product', `Stage an Object E-commerce Pack`);
                    await onGenerationComplete(packShots.length);
                } else if (!isModelSelected && productEcommercePack !== 'none') {
                    const pack = PRODUCT_ECOMMERCE_PACKS[productEcommercePack];
                    const packShots = pack.shots;
                    set({ generatedImages: Array(packShots.length).fill(null), activeImageIndex: 0, loadingMessage: `Generating ${pack.name}... (1/${packShots.length})` });
            
                    for (const [index, shot] of packShots.entries()) {
                        set({ loadingMessage: `Generating ${pack.name}... (${index + 1}/${packShots.length})` });
                        const state = get();
                        const cameraAngle = CAMERA_ANGLES_LIBRARY_PRODUCT.find(c => c.id === shot.cameraAngleId) || state.productControls.cameraAngle;
                        const focalLength = FOCAL_LENGTHS_LIBRARY.find(f => f.id === shot.focalLengthId) || state.productControls.focalLength;
                        const overriddenControls = { ...state.productControls, cameraAngle, focalLength };
                        const { parts } = await promptService.generatePrompt({ ...state, studioMode: 'product', generationMode: 'image', productControls: overriddenControls });
            
                        await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                            set(currentState => {
                                const newImages = [...(currentState.generatedImages || [])];
                                if (newImages.length > index) newImages[index] = imageB64;
                                return { generatedImages: newImages };
                        });
                    }), { onRetry: onRetry });
                    }
                    // Save images before completing
                    await get().saveGeneratedImages(user, 'product', `Stage an Object Product Pack`);
                    await onGenerationComplete(packShots.length);
                } else {
                    set({ generatedImages: Array(numberOfImages).fill(null), activeImageIndex: 0 });
                    const { parts } = await promptService.generatePrompt({ studioMode: 'product', generationMode: 'image', ...get() });
                    await withRetry(() => geminiService.generatePhotoshootImage(parts, get().aspectRatio.value, numberOfImages, productControls.negativePrompt, (imageB64, index) => {
                        set(state => {
                            const newImages = [...(state.generatedImages || Array(numberOfImages).fill(null))];
                            newImages[index] = imageB64;
                            return { generatedImages: newImages };
                        });
                    }), { onRetry: onRetry });
                    // Save images before completing
                    await get().saveGeneratedImages(user, 'product', `Stage an Object Generation`);
                    await onGenerationComplete(numberOfImages);
                }
                break;
            }
            case 'design': {
              const state = get();
              if (!state.mockupImage || !state.designImage) {
                throw new Error("Cannot generate design: mockup or design image is missing.");
              }

              const { isMockupPackActive, ...restControls } = state.designPlacementControls;
              
              if (isMockupPackActive) {
                const shots = state.backDesignImage ? MOCKUP_PACK_SHOTS_4 : MOCKUP_PACK_SHOTS_3;
                set({ generatedImages: Array(shots.length).fill(null), activeImageIndex: 0, loadingMessage: `Generating Mockup Pack... (1/${shots.length})` });
                
                for (const [index, shot] of shots.entries()) {
                    set({ loadingMessage: `Generating Mockup Pack... (${index + 1}/${shots.length})` });
                    const overriddenControls: typeof restControls = {
                        ...restControls,
                        cameraAngle: shot.angle,
                        lightingStyle: shot.lighting,
                    };
                     const { parts } = await promptService.generatePrompt({
                        studioMode: 'design',
                        mockupImage: state.mockupImage,
                        designImage: state.designImage,
                        backDesignImage: state.backDesignImage,
                        designPlacementControls: { ...overriddenControls, isMockupPackActive },
                        scene: state.scene,
                        shotView: shot.view,
                        aspectRatio: state.aspectRatio.value,
                    });
                     await withRetry(() => geminiService.generatePhotoshootImage(parts, get().aspectRatio.value, 1, undefined, (imageB64) => {
                        set(currentState => {
                            const newImages = [...(currentState.generatedImages || [])];
                            if (newImages.length > index) newImages[index] = imageB64;
                            return { generatedImages: newImages };
                        });
                    }), { onRetry: onRetry });
                }
                // Save images before completing
                await get().saveGeneratedImages(user, 'design', `MultiSnap Mockup Pack Generation`);
                await onGenerationComplete(shots.length);

              } else {
                const { numberOfImages } = get();
                set({ generatedImages: Array(numberOfImages).fill(null), activeImageIndex: 0 });
                const { parts } = await promptService.generatePrompt({
                    studioMode: 'design',
                    mockupImage: state.mockupImage,
                    designImage: state.designImage,
                    backDesignImage: state.backDesignImage,
                    designPlacementControls: state.designPlacementControls,
                    scene: state.scene,
                    shotView: 'front',
                    aspectRatio: state.aspectRatio.value,
                });
                await withRetry(() => geminiService.generatePhotoshootImage(parts, get().aspectRatio.value, numberOfImages, undefined, (imageB64, index) => {
                    set(state => {
                        const newImages = [...(state.generatedImages || Array(numberOfImages).fill(null))];
                        newImages[index] = imageB64;
                        return { generatedImages: newImages };
                    });
                }), { onRetry: onRetry });
                // Save images before completing
                await get().saveGeneratedImages(user, 'design', `MultiSnap Generation`);
                await onGenerationComplete(numberOfImages);
              }
              break;
            }
            case 'reimagine': {
                const { numberOfImages, reimagineControls } = get();
                 set({ generatedImages: Array(numberOfImages).fill(null), activeImageIndex: 0 });
                const { parts } = await promptService.generatePrompt({ studioMode: 'reimagine', ...get() });
                await withRetry(() => geminiService.generatePhotoshootImage(parts, get().aspectRatio.value, numberOfImages, reimagineControls.negativePrompt, (imageB64, index) => {
                    set(state => {
                        const newImages = [...(state.generatedImages || Array(numberOfImages).fill(null))];
                        newImages[index] = imageB64;
                        return { generatedImages: newImages };
                    });
                }), { onRetry: onRetry });
                // Save images before completing
                await get().saveGeneratedImages(user, 'reimagine', `Variation Lab Generation`);
                await onGenerationComplete(numberOfImages);
                break;
            }
            case 'video': {
                const hasKey = await get().checkAndSetApiKey();
                if (!hasKey) {
                    get().openApiKeySelector();
                    set({ isGenerating: false }); // Stop generation process
                    return;
                }

                const { videoPrompt, videoSourceImage, aspectRatio, videoControls } = get();
                if (!videoPrompt.trim() && !videoSourceImage) {
                    throw new Error("A video prompt or a source image is required to generate a video.");
                }
                const finalPrompt = videoPrompt.trim() || "Animate the provided image with subtle, realistic motion.";
      
                set({ isGenerating: true, error: null, generatedVideoUrl: null, videoSourceImage, loadingMessage: `Sending to video model...`, activeImageIndex: null });
      
                generationController = new AbortController();
                const signal = generationController.signal;
      
                try {
                    let operation: any = await withRetry(() => geminiService.generatePhotoshootVideo(finalPrompt, aspectRatio.value, videoControls.resolution, videoSourceImage), { onRetry: onRetry });
      
                    if (signal.aborted) return;
                    
                    set({ loadingMessage: 'Video is processing... This may take a few minutes.' });
                    
                    while (!operation.done) {
                        if (signal.aborted) return;
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        if (signal.aborted) return;
                        operation = await geminiService.getVideoOperationStatus(operation);
                    }
      
                    if (signal.aborted) return;
                    
                    if (operation.error) {
                        throw new Error(`Video generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
                    }

                    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                    if (downloadLink) {
                        set({ loadingMessage: 'Fetching final video...' });
                        const blobUrl = await geminiService.fetchVideoAsBlobUrl(downloadLink);
                        if (signal.aborted) {
                            URL.revokeObjectURL(blobUrl);
                            return;
                        }
                        set({ generatedVideoUrl: blobUrl });
                        await onGenerationComplete(1);
                    } else {
                        console.error("Video operation details:", JSON.stringify(operation, null, 2));
                        if (operation.response?.raiMediaFilteredReasons?.length > 0) {
                            throw new Error(`Video generation failed: ${operation.response.raiMediaFilteredReasons.join('. ')}`);
                        }
                        throw new Error("Video generation completed but no video URL was returned. The operation may have failed without an explicit error message.");
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError' || signal.aborted) {
                        console.log('Video generation cancelled by user.');
                        return;
                    }
                    if (e.message && e.message.includes("Requested entity was not found.")) {
                        set({ hasSelectedApiKey: false, error: "Your API key is invalid. Please select a valid key to continue.", isGenerating: false });
                        get().openApiKeySelector();
                        return;
                    }
                    console.error("Failed to generate video:", e);
                    set({ error: e.message || "An unknown error occurred during video generation." });
                } finally {
                    generationController = null;
                }
                break;
            }
        }
    } catch (e: any) {
      console.error(e);
      set({ error: e.message || 'An unknown error occurred during generation.' });
    } finally {
      set({ isGenerating: false, generationCount: get().generationCount + 1, loadingMessage: '' });
    }
  },

  startEditing: (index) => {
    const original = get().generatedImages?.[index];
    if (original) {
      set({ isEditing: true, imageBeingEdited: { original, index }, error: null });
    }
  },

  cancelEditing: () => {
    const { imageBeingEdited } = get();
    if(imageBeingEdited) {
       set(state => {
         const newImages = [...(state.generatedImages || [])];
         newImages[imageBeingEdited.index] = imageBeingEdited.original;
         return {
           isEditing: false,
           imageBeingEdited: null,
           generatedImages: newImages,
         }
       })
    } else {
        set({ isEditing: false, imageBeingEdited: null });
    }
  },
  
  revertEdit: () => {
      const { imageBeingEdited } = get();
      if(imageBeingEdited) {
          set(state => {
             const newImages = [...(state.generatedImages || [])];
             newImages[imageBeingEdited.index] = imageBeingEdited.original;
             return { generatedImages: newImages, generationCount: state.generationCount + 1 };
          });
      }
  },
  
  applyGenerativeEdit: async (maskB64, prompt, apparelRefB64) => {
    const { activeImageIndex, generatedImages } = get();
    if (activeImageIndex === null || !generatedImages?.[activeImageIndex]) return;

    set({ isApplyingEdit: true, error: null, loadingMessage: 'Applying generative edit...' });
    const onRetry = (attempt: number, delay: number) => {
        set({ loadingMessage: `API is busy. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt})` });
    };

    try {
      const originalImageB64 = generatedImages[activeImageIndex]!;
      const result = await withRetry(() => geminiService.generativeEdit({
        originalImageB64,
        maskImageB64: maskB64,
        prompt,
        apparelImageB64: apparelRefB64
      }), { onRetry: onRetry });
      set(state => {
        const newImages = [...(state.generatedImages || [])];
        if (activeImageIndex !== null) {
            newImages[activeImageIndex] = result;
        }
        return {
          generatedImages: newImages,
          generationCount: state.generationCount + 1,
        };
      });
    } catch (e: any) {
      set({ error: e.message || "Generative edit failed." });
    } finally {
      set({ isApplyingEdit: false });
    }
  },
  
  applyColorGrade: async(grade) => {},
  applyRealismBoost: async() => {},
  applyFilmGrain: async(strength) => {},
  applyHologramEffect: async() => {},
  generateVideoFromImage: async (animation, onGenerationComplete) => {
    const { studioMode, activeImageIndex, generatedImages, aspectRatio, videoControls } = get();
    if (activeImageIndex === null || !generatedImages || !generatedImages[activeImageIndex]) {
        set({ error: "No reference image selected to generate a video from." });
        return;
    }

    const hasKey = await get().checkAndSetApiKey();
    if (!hasKey) {
        get().openApiKeySelector();
        return;
    }

    const referenceImageB64 = generatedImages[activeImageIndex];

    set({
        isGenerating: true,
        error: null,
        generatedVideoUrl: null,
        videoSourceImage: referenceImageB64,
        loadingMessage: `Animating your image...`,
        activeImageIndex: null, // Switch view to video player
    });
    
    const onRetry = (attempt: number, delay: number) => {
        set({ loadingMessage: `API is busy. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt})` });
    };

    generationController = new AbortController();
    const signal = generationController.signal;

    try {
        let promptParams: any;

        if (studioMode === 'apparel') {
            promptParams = { ...get(), studioMode: 'apparel', generationMode: 'video', animation };
        } else if (studioMode === 'product') {
            promptParams = { ...get(), studioMode: 'product', generationMode: 'video', animation };
        } else {
            throw new Error("Video generation is not supported in this mode.");
        }

        const { parts } = await promptService.generatePrompt(promptParams);
        const textPrompt = parts.find(p => 'text' in p)?.text || '';
        if (!textPrompt) throw new Error("Could not generate a valid prompt for video generation.");

        set({ loadingMessage: 'Sending to video model...' });
        let operation: any = await withRetry(() => geminiService.generatePhotoshootVideo(textPrompt, aspectRatio.value, videoControls.resolution, referenceImageB64), { onRetry: onRetry });
        
        if (signal.aborted) return;
        
        set({ loadingMessage: 'Video is processing... This may take a few minutes.' });
        
        while (!operation.done) {
            if (signal.aborted) {
                // TODO: Add cancellation logic on the backend if available
                console.log('Video generation cancelled by user.');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            if (signal.aborted) return;
            operation = await geminiService.getVideoOperationStatus(operation);
        }

        if (signal.aborted) return;
        
        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            set({ loadingMessage: 'Fetching final video...' });
            const blobUrl = await geminiService.fetchVideoAsBlobUrl(downloadLink);
            if (signal.aborted) {
                URL.revokeObjectURL(blobUrl);
                return;
            }
            set({ generatedVideoUrl: blobUrl });
            await onGenerationComplete(1); // Consumes 1 generation credit
        } else {
            console.error("Video operation details:", JSON.stringify(operation, null, 2));
            if (operation.response?.raiMediaFilteredReasons?.length > 0) {
                throw new Error(`Video generation failed: ${operation.response.raiMediaFilteredReasons.join('. ')}`);
            }
            throw new Error("Video generation completed but no video URL was returned. The operation may have failed without an explicit error message.");
        }

    } catch (e: any) {
        if (e.name === 'AbortError' || signal.aborted) {
            console.log('Video generation cancelled by user.');
            return;
        }
        if (e.message && e.message.includes("Requested entity was not found.")) {
            set({ hasSelectedApiKey: false, error: "Your API key is invalid. Please select a valid key to continue.", isGenerating: false });
            get().openApiKeySelector();
            return;
        }
        console.error("Failed to generate video:", e);
        set({ error: e.message || "An unknown error occurred during video generation." });
    } finally {
        set({ isGenerating: false, loadingMessage: '' });
        generationController = null;
    }
  },
  generatePackFromReference: async (onGenerationComplete, user) => {
    const { studioMode, activeImageIndex, generatedImages } = get();
    if (activeImageIndex === null || !generatedImages || !generatedImages[activeImageIndex]) {
      set({ error: "No reference image selected to generate a pack." });
      return;
    }

    const referenceImageB64 = generatedImages[activeImageIndex];

    set({
      isGenerating: true,
      error: null,
      generatedVideoUrl: null,
      videoSourceImage: null,
      loadingMessage: `Generating asset pack...`,
    });
    
    const onRetry = (attempt: number, delay: number) => {
        set({ loadingMessage: `API is busy. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt})` });
    };

    try {
      if (studioMode === 'apparel') {
        const { ecommercePack } = get();
        if (ecommercePack === 'none') throw new Error("No e-commerce pack is selected in the settings.");
        
        const pack = ECOMMERCE_PACKS[ecommercePack];
        const packShots = pack.shots;

        set({ generatedImages: Array(packShots.length).fill(null), activeImageIndex: 0 });

        for (const [index, shot] of packShots.entries()) {
            const state = get();
            const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shot.shotId) || state.apparelControls.shotType;
            const expression = EXPRESSIONS.find(e => e.id === shot.expressionId) || state.apparelControls.expression;
            const cameraAngle = CAMERA_ANGLES_LIBRARY.find(c => c.id === shot.cameraAngleId) || state.apparelControls.cameraAngle;

            const overriddenControls = { ...state.apparelControls, shotType, expression, cameraAngle };

            const { parts } = await promptService.generatePrompt({
                ...state,
                studioMode: 'apparel',
                generationMode: 'image',
                apparelControls: overriddenControls,
                modelReferenceImage: referenceImageB64,
            });

            await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                set(currentState => {
                    const newImages = [...(currentState.generatedImages || [])];
                    if (newImages.length > index) newImages[index] = imageB64;
                    return { generatedImages: newImages };
                });
            }), { onRetry: onRetry });
        }
        // Save images before completing
        if (user) {
            await get().saveGeneratedImages(user, 'apparel', `Virtual Photoshoot Pack from Reference`);
        }
        await onGenerationComplete(packShots.length);

      } else if (studioMode === 'product') {
        const { ecommercePack, productEcommercePack } = get();

        // This function only supports on-model pack generation, which uses `ecommercePack`.
        if (ecommercePack === 'none') {
            if (productEcommercePack !== 'none') {
                // If the user selected a product-only pack, guide them with a specific error.
                throw new Error("Generating a pack from a reference image is for on-model shots. Please select a model and choose a pack from the 'E-commerce Pack' options.");
            } else {
                throw new Error("Select an E-commerce Pack in Settings for on-model pack generation.");
            }
        }
        
        const pack = ECOMMERCE_PACKS[ecommercePack];
        const packShots = pack.shots;

        set({ generatedImages: Array(packShots.length).fill(null), activeImageIndex: 0 });
        
        for (const [index, shot] of packShots.entries()) {
            const state = get();
            const shotType = SHOT_TYPES_LIBRARY.find(s => s.id === shot.shotId) || state.productControls.shotType;
            const expression = EXPRESSIONS.find(e => e.id === shot.expressionId) || state.productControls.expression;
            const cameraAngle = CAMERA_ANGLES_LIBRARY.find(c => c.id === shot.cameraAngleId) || state.productControls.cameraAngle;
            
            const overriddenControls = { ...state.productControls, shotType, expression, cameraAngle };

            const { parts } = await promptService.generatePrompt({
                ...state,
                studioMode: 'product',
                generationMode: 'image',
                productControls: overriddenControls,
                modelReferenceImage: referenceImageB64
            });

            await withRetry(() => geminiService.generatePhotoshootImage(parts, state.aspectRatio.value, 1, overriddenControls.negativePrompt, (imageB64) => {
                set(currentState => {
                    const newImages = [...(currentState.generatedImages || [])];
                    if (newImages.length > index) newImages[index] = imageB64;
                    return { generatedImages: newImages };
                });
            }), { onRetry: onRetry });
        }
        // Save images before completing
        if (user) {
            await get().saveGeneratedImages(user, 'product', `Stage an Object Pack from Reference`);
        }
        await onGenerationComplete(packShots.length);
      }
    } catch (e: any) {
      console.error("Failed to generate pack from reference:", e);
      set({ error: e.message || "Failed to generate pack from reference image." });
    } finally {
        set({ isGenerating: false, loadingMessage: '' });
    }
  },
  generateColorways: async (colors, onGenerationComplete, user) => {
    const state = get();
    if (state.studioMode !== 'design' || !state.mockupImage || !state.designImage) {
        set({ error: "Colorway generation is only available in Design Mode with a mockup and design."});
        return;
    }

    set({ 
        isGenerating: true, 
        error: null, 
        generatedImages: Array(colors.length).fill(null),
        activeImageIndex: 0,
        loadingMessage: `Generating ${colors.length} colorways... (1/${colors.length})`
    });

    try {
        for (const [index, color] of colors.entries()) {
            set({ loadingMessage: `Generating ${colors.length} colorways... (${index + 1}/${colors.length})` });
            const currentState = get();
            const overriddenControls = { ...currentState.designPlacementControls, shirtColor: color };
            
            const { parts } = await promptService.generatePrompt({
                ...currentState,
                studioMode: 'design',
                designPlacementControls: overriddenControls,
                shotView: 'front',
            });

            await withRetry(() => geminiService.generatePhotoshootImage(parts, currentState.aspectRatio.value, 1, undefined, (imageB64) => {
                set(s => {
                    const newImages = [...(s.generatedImages || [])];
                    if (newImages.length > index) newImages[index] = imageB64;
                    return { generatedImages: newImages };
                });
            }), { onRetry: onRetry });
        }
        // Save images before completing
        if (user) {
            await get().saveGeneratedImages(user, 'design', `MultiSnap Colorway Generation`);
        }
        await onGenerationComplete(colors.length);
    } catch (e: any) {
        console.error("Colorway generation failed:", e);
        set({ error: e.message || "Failed to generate colorways." });
    } finally {
        set({ isGenerating: false, loadingMessage: '' });
    }
  },
  generateAIBackground: async (prompt) => {
    if (!prompt.trim()) return;
    set({ isGeneratingBackground: true, error: null });
    const onRetry = (attempt: number, delay: number) => {
        set({ loadingMessage: `Background generation is busy. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt})` });
    };
    try {
        const imageB64 = await withRetry(() => geminiService.generateWithImagen(prompt, get().aspectRatio.value), { onRetry: onRetry });
        const customBg: Background = {
            id: 'custom-ai',
            name: prompt.substring(0, 30),
            type: 'image',
            value: imageB64,
            category: 'AI Generated'
        };
        get().updateScene({ background: customBg });
    } catch (e: any) {
        console.error("Failed to generate AI background:", e);
        set({ error: "AI Background generation failed. Please try a different prompt." });
    } finally {
        set({ isGeneratingBackground: false });
    }
  },
  setGuideActive: (isActive) => set({ isGuideActive: isActive }),
  setBestPracticesModalOpen: (isOpen) => set({ isBestPracticesModalOpen: isOpen }),
  
  // Chatbot
  toggleChatbot: () => set(state => ({ isChatbotOpen: !state.isChatbotOpen })),
  askChatbot: async (question, images) => {
      const userMessage: ChatMessage = { 
          role: 'user', 
          text: question,
          ...(images && images.length > 0 && { images })
      };
      
      set(state => {
          const newHistory = [...state.chatHistory, userMessage];
          // Save to localStorage
          try {
              localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
          } catch (e) {
              console.error('Failed to save chat history to localStorage:', e);
          }
          return { 
              chatHistory: newHistory,
              isBotReplying: true,
          };
      });

      try {
          const state = get();
          
          // Check if this is a follow-up request to improve/modify the last generated image
          const followUpKeywords = [
              /(make|make it|do it|try|try again|redo|regenerate).*(better|improved|improve|different|again)/i,
              /(better|improve|improved|enhance|fix|change|modify|adjust|tweak|redo|regenerate|try again)/i,
              /(don't like|don't|dislike|not good|not right|wrong|fix this|make it a bit)/i,
              /(a bit|slightly|more|less|too much|too little)/i
          ];
          
          const isFollowUpRequest = followUpKeywords.some(regex => regex.test(question));
          const hasLastContext = state.lastImageGenerationContext !== null;
          
          // If it's a follow-up request and no new images provided, use stored context
          // If new images are provided, treat as new request
          const shouldUseStoredContext = isFollowUpRequest && hasLastContext && (!hasImages || images.length === 0);
          
          // Check if this is an image generation request
          // Detect requests like: "add X to Y", "blend", "combine", "put X in Y", etc.
          const imageGenerationKeywords = [
              /add.*to|put.*in|place.*in|blend|combine|merge|mix|insert|include|show.*with|display.*with/i,
              /edit|modify|change|alter|transform|create.*from|make.*from/i,
              /generate|create|make.*image|make.*picture/i
          ];
          
          const hasImageKeywords = imageGenerationKeywords.some(regex => regex.test(question));
          const hasImages = images && images.length > 0;
          const isImageRequest = hasImages && (hasImageKeywords || question.length < 100); // If images provided and short question, likely image gen
          
          // Handle follow-up requests using stored context
          if (shouldUseStoredContext && state.lastImageGenerationContext) {
              const context = state.lastImageGenerationContext;
              console.log('🔄 [CHATBOT] Follow-up request detected, using stored context');
              console.log('📝 [CHATBOT] Original prompt:', context.prompt);
              console.log('📸 [CHATBOT] Reference images:', context.referenceImages.length);
              
              // Build enhanced prompt combining original with improvement request
              let improvementPrompt = question.trim();
              
              // Remove question marks
              improvementPrompt = improvementPrompt.replace(/\?/g, '').trim();
              
              // Combine with original prompt
              const combinedPrompt = `${context.prompt}. ${improvementPrompt}. Make sure to maintain the same style and composition from the reference images.`;
              
              // Add quality instructions
              let finalPrompt = combinedPrompt;
              if (!/professional|high.?quality|detailed|realistic|photorealistic/i.test(finalPrompt)) {
                  finalPrompt = `${finalPrompt} Professional, high-quality, photorealistic result with perfect blending and composition.`;
              }
              
              console.log('🎨 [CHATBOT] Combined prompt:', finalPrompt);
              
              const generatedImage = await geminiService.generateStyledImage(finalPrompt, context.referenceImages);
              
              // Update context with new generated image
              const updatedContext = {
                  ...context,
                  prompt: finalPrompt,
                  generatedImage: generatedImage
              };
              
              const responseMessage: ChatMessage = {
                  role: 'model',
                  text: "I've improved the image based on your feedback! Here's the updated result:",
                  generatedImage: generatedImage
              };
              
              set(state => {
                  const newHistory = [...state.chatHistory, responseMessage];
                  // Save to localStorage
                  try {
                      localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
                      localStorage.setItem('klint_last_image_context', JSON.stringify(updatedContext));
                  } catch (e) {
                      console.error('Failed to save chat history to localStorage:', e);
                  }
                  return {
                      chatHistory: newHistory,
                      lastImageGenerationContext: updatedContext,
                  };
              });
          } else if (isImageRequest && hasImages) {
              // Generate image using reference images
              console.log('🎨 [CHATBOT] Detected image generation request with', images.length, 'reference images');
              console.log('📝 [CHATBOT] Prompt:', question);
              
              // Build enhanced prompt for image generation
              let imagePrompt = question.trim();
              
              // Remove question marks and common phrases
              imagePrompt = imagePrompt.replace(/\?/g, '').trim();
              
              // Enhance prompt if it's too short
              if (imagePrompt.length < 20) {
                  imagePrompt = `Create a high-quality image: ${imagePrompt}`;
              }
              
              // Add style instructions if not present
              if (!/professional|high.?quality|detailed|realistic|photorealistic/i.test(imagePrompt)) {
                  imagePrompt = `${imagePrompt}. Professional, high-quality, photorealistic result with perfect blending and composition.`;
              }
              
              console.log('🎨 [CHATBOT] Enhanced prompt:', imagePrompt);
              
              const generatedImage = await geminiService.generateStyledImage(imagePrompt, images);
              
              // Store context for future follow-up requests
              const context = {
                  referenceImages: images,
                  prompt: imagePrompt,
                  generatedImage: generatedImage
              };
              
              const responseMessage: ChatMessage = {
                  role: 'model',
                  text: "I've generated the image for you! Here's the result:",
                  generatedImage: generatedImage
              };
              
              set(state => {
                  const newHistory = [...state.chatHistory, responseMessage];
                  // Save to localStorage
                  try {
                      localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
                      localStorage.setItem('klint_last_image_context', JSON.stringify(context));
                  } catch (e) {
                      console.error('Failed to save chat history to localStorage:', e);
                  }
                  return {
                      chatHistory: newHistory,
                      lastImageGenerationContext: context,
                  };
              });
          } else if (hasImageKeywords && !hasImages) {
              // Image request but no images provided
              const response = "I can help you generate or edit images! Please upload one or more reference images and describe what you'd like me to create or modify.";
              set(state => {
                  const newHistory = [...state.chatHistory, { role: 'model', text: response }];
                  try {
                      localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
                  } catch (e) {
                      console.error('Failed to save chat history to localStorage:', e);
                  }
                  return {
                      chatHistory: newHistory,
                  };
              });
          } else {
              // Regular text response
              const response = await geminiService.getChatbotResponse(question, README_CONTENT);
              set(state => {
                  const newHistory = [...state.chatHistory, { role: 'model', text: response }];
                  // Save to localStorage
                  try {
                      localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
                  } catch (e) {
                      console.error('Failed to save chat history to localStorage:', e);
                  }
                  return {
                      chatHistory: newHistory,
                  };
              });
          }
      } catch (e) {
          console.error("Chatbot error:", e);
          set(state => {
              const newHistory = [...state.chatHistory, { role: 'model', text: "Sorry, I encountered an error. Please try again." }];
              // Save to localStorage
              try {
                  localStorage.setItem('klint_chat_history', JSON.stringify(newHistory));
              } catch (e) {
                  console.error('Failed to save chat history to localStorage:', e);
              }
              return {
                  chatHistory: newHistory,
              };
          });
      } finally {
          set({ isBotReplying: false });
      }
  },
  addReferenceImages: (images) => {
      set(state => {
          const newImages = [...state.chatReferenceImages, ...images];
          // Save to localStorage
          try {
              localStorage.setItem('klint_chat_reference_images', JSON.stringify(newImages));
          } catch (e) {
              console.error('Failed to save chat reference images to localStorage:', e);
          }
          return { chatReferenceImages: newImages };
      });
  },
  resetChat: () => {
      const defaultHistory: ChatMessage[] = [
          { role: 'model', text: "Hi! I'm your AI Assistant. How can I help you with your photoshoot today? You can ask me things like 'How do I use my own model?' or 'What are scene templates?'" }
      ];
      // Clear localStorage
      try {
          localStorage.removeItem('klint_chat_history');
          localStorage.removeItem('klint_chat_reference_images');
          localStorage.removeItem('klint_last_image_context');
      } catch (e) {
          console.error('Failed to clear chat from localStorage:', e);
      }
      set({ 
          chatHistory: defaultHistory,
          chatReferenceImages: [],
          lastImageGenerationContext: null
      });
  },

  // Language
  setLanguage: (language) => set({ language }),
  t: (key) => {
    const { language } = get();
    return translations[language][key] || translations['en'][key];
  },
});