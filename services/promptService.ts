import type { AIModel, ApparelItem, Scene, GenerationMode, Animation, AspectRatio, ApparelCreativeControls, ProductCreativeControls, DesignPlacementControls, DesignInput, StagedAsset, ReimagineCreativeControls } from '../types';
import { FABRIC_STYLE_OPTIONS, MOCKUP_STYLE_OPTIONS, DESIGN_LIGHTING_STYLE_OPTIONS, DESIGN_CAMERA_ANGLE_OPTIONS, PRINT_STYLE_OPTIONS, DESIGN_PLACEMENT_OPTIONS } from '../constants';
import { geminiService } from './geminiService';

interface BasePromptParams {
    styleDescription?: string;
    aspectRatio: AspectRatio['value'];
}

interface ApparelPromptParams extends BasePromptParams {
    studioMode: 'apparel';
    uploadedModelImage: string | null;
    selectedModels: AIModel[];
    apparel: ApparelItem[];
    scene: Scene;
    animation?: Animation;
    generationMode: GenerationMode;
    promptedModelDescription: string;
    modelLightingDescription: string | null;
    apparelControls: ApparelCreativeControls;
    baseLookImageB64?: string | null;
    modelReferenceImage?: string | null;
}

interface ProductPromptParams extends BasePromptParams {
    studioMode: 'product';
    productImage: string | null;
    stagedAssets: StagedAsset[];
    scene: Scene;
    generationMode: GenerationMode;
    productControls: ProductCreativeControls;
    // Added for on-model product shots
    uploadedModelImage: string | null;
    selectedModels: AIModel[];
    promptedModelDescription: string;
    modelReferenceImage?: string | null;
    animation?: Animation;
}

interface DesignPromptParams extends BasePromptParams {
    studioMode: 'design';
    mockupImage: DesignInput;
    designImage: DesignInput;
    backDesignImage: DesignInput | null;
    designPlacementControls: DesignPlacementControls;
    scene: Scene;
    shotView: 'front' | 'back';
}

interface ReimaginePromptParams extends BasePromptParams {
    studioMode: 'reimagine';
    reimagineSourcePhoto: string;
    newModelPhoto: string | null;
    reimagineControls: ReimagineCreativeControls;
}


type PromptGenerationParams = ApparelPromptParams | ProductPromptParams | DesignPromptParams | ReimaginePromptParams;


const parseDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid data URL");
    }
    return {
        mimeType: match[1],
        data: match[2],
    };
};

const getAspectRatioPrompt = (aspectRatio: AspectRatio['value']): string => {
    switch (aspectRatio) {
        case '1:1':
            return `The final image output MUST have a square orientation with an aspect ratio of exactly 1:1 (e.g., 1024px width by 1024px height).`;
        case '4:3':
            return `The final image output MUST have a landscape orientation with an aspect ratio of exactly 4:3 (e.g., 1024px width by 768px height).`;
        case '16:9':
            return `The final image output MUST have a wide landscape orientation with an aspect ratio of exactly 16:9 (e.g., 1280px width by 720px height).`;
        case '9:16':
            return `The final image output MUST have a tall portrait orientation with an aspect ratio of exactly 9:16 (e.g., 720px width by 1280px height).`;
        case '3:4':
        default:
            return `The final image output MUST have a portrait orientation with an aspect ratio of exactly 3:4 (e.g., 1024px width by 1365px height).`;
    }
};

export const promptService = {
    generatePrompt: async (params: PromptGenerationParams): Promise<{ parts: any[] }> => {
        const parts: any[] = [];
        
        // ===================================
        // --- RE-IMAGINE MODE PROMPT LOGIC ---
        // ===================================
        if (params.studioMode === 'reimagine') {
            const { reimagineSourcePhoto, newModelPhoto, reimagineControls, aspectRatio, styleDescription } = params;
            const { newModelDescription, newBackgroundDescription } = reimagineControls;

            if (!newModelPhoto && !newModelDescription.trim() && !newBackgroundDescription.trim()) {
                throw new Error("Please describe or upload a new model, or describe a new background.");
            }

            let textPrompt = `**PHOTO RE-IMAGINE DIRECTIVE**

**PRIMARY GOAL:** You are an expert photo editor. You are provided with a source image and other assets. Your mission is to generate a new, photorealistic image by editing the source image according to the instructions below.

**NON-NEGOTIABLE CORE RULE:** You MUST preserve the **exact outfit** (all clothing items, colors, and styles) and the **exact pose** of the person from the source image. This is the highest priority.

---
**1. ASSET ANALYSIS (CRITICAL)**
- **FIRST IMAGE (SOURCE PHOTO):** This is the source of truth for the **OUTFIT** and **POSE**.
${newModelPhoto ? '- **SECOND IMAGE (NEW MODEL REFERENCE):** This is the source of truth for the new person\'s **FACE and IDENTITY**.\n' : ''}
---
**2. EDITING INSTRUCTIONS**
`;

            if (newModelPhoto) {
                textPrompt += `- **MODEL SWAP BY PHOTO (CRITICAL):** Replace the person in the SOURCE PHOTO with the person from the NEW MODEL REFERENCE. You must transfer the face and identity from the NEW MODEL REFERENCE with perfect accuracy. The new person MUST be in the exact same pose and be wearing the exact same outfit as the person in the SOURCE PHOTO.\n`;
                if (newModelDescription.trim()) {
                     textPrompt += `- **MODEL STYLING (GUIDANCE):** After swapping the model, apply this additional styling guidance: "${newModelDescription.trim()}".\n`;
                }
            } else if (newModelDescription.trim()) {
                textPrompt += `- **MODEL SWAP BY DESCRIPTION (CRITICAL):** Replace the person in the source image with a new person who perfectly matches this description: "${newModelDescription.trim()}". The new person MUST be in the exact same pose and be wearing the exact same outfit as the person in the original image.\n`;
            } else {
                textPrompt += `- **MODEL PRESERVATION:** The person from the source image should be preserved with 100% accuracy.\n`;
            }

            if (newBackgroundDescription.trim()) {
                textPrompt += `- **BACKGROUND SWAP (CRITICAL):** Replace the background of the source image with a new, photorealistic scene that perfectly matches this description: "${newBackgroundDescription.trim()}". The person, their pose, and their outfit must be seamlessly integrated into this new background with realistic lighting and shadows.\n`;
            } else {
                textPrompt += `- **BACKGROUND PRESERVATION:** The background from the source image should be preserved.\n`;
            }

            textPrompt += `---
**3. FINAL OUTPUT REQUIREMENTS**
- The final image must be ultra-photorealistic.
- ${getAspectRatioPrompt(aspectRatio)}
`;
            if (reimagineControls.negativePrompt) {
                textPrompt += `- **AVOID:** Do not include the following: ${reimagineControls.negativePrompt}.\n`;
            }

            parts.push({ text: textPrompt });
            
            // Preprocess source image to match aspect ratio
            const resizedSourceImage = await geminiService.resizeImageToAspectRatio(reimagineSourcePhoto, params.aspectRatio);
            const sourceImageParts = parseDataUrl(resizedSourceImage);
            parts.push({ inlineData: { mimeType: sourceImageParts.mimeType, data: sourceImageParts.data } });

            if (newModelPhoto) {
                // Preprocess model image to match aspect ratio
                const resizedModelImage = await geminiService.resizeImageToAspectRatio(newModelPhoto, params.aspectRatio);
                const newModelImageParts = parseDataUrl(resizedModelImage);
                parts.push({ inlineData: { mimeType: newModelImageParts.mimeType, data: newModelImageParts.data } });
            }

            return { parts };
        }
        
        // ================================
        // --- DESIGN MODE PROMPT LOGIC ---
        // ================================
        if (params.studioMode === 'design') {
            const { mockupImage, designImage, backDesignImage, designPlacementControls, scene, shotView, aspectRatio } = params;

            const activeDesign = shotView === 'back' ? backDesignImage : designImage;
            if (!activeDesign) {
                throw new Error("No active design for the selected view.");
            }

            const activeSideControls = designPlacementControls[shotView];

            // Use the constants to find the selected options
            const mockupStyle = MOCKUP_STYLE_OPTIONS.find(o => o.id === designPlacementControls.mockupStyle)?.name || 'hanging';
            const fabricStyle = FABRIC_STYLE_OPTIONS.find(o => o.id === designPlacementControls.fabricStyle)?.name || 'standard jersey';
            const lightingStyle = DESIGN_LIGHTING_STYLE_OPTIONS.find(o => o.id === designPlacementControls.lightingStyle)?.name || 'studio softbox';
            const cameraAngle = DESIGN_CAMERA_ANGLE_OPTIONS.find(o => o.id === designPlacementControls.cameraAngle)?.name || 'eye-level front';
            const printStyle = PRINT_STYLE_OPTIONS.find(o => o.id === designPlacementControls.printStyle)?.name || 'screen print';
            const placement = DESIGN_PLACEMENT_OPTIONS.find(o => o.id === activeSideControls.placement)?.name || 'front center';
            
            const textPrompt = `**APPAREL MOCKUP GENERATION TASK**

**PRIMARY GOAL:** Create an ultra-photorealistic mockup of an apparel item with a design placed on it.

---
**1. ASSET ANALYSIS**
- **FIRST IMAGE (MOCKUP):** A blank apparel item. Your goal is to recreate this item realistically.
- **SECOND IMAGE (DESIGN):** The graphic to be placed onto the apparel item.

---
**2. MOCKUP INSTRUCTIONS**

**APPAREL STYLE:**
- Create a photorealistic image of a **${designPlacementControls.apparelType}**.
- The base color of the garment should be **${designPlacementControls.shirtColor}**.
- The fabric should have the texture of **${fabricStyle}**.
- The mockup should be styled as a **${mockupStyle}** shot.

**DESIGN PLACEMENT (${shotView.toUpperCase()} VIEW):**
- Place the DESIGN graphic onto the apparel.
- **Placement:** The graphic should be located at the **${placement}** position.
- **Scale:** The graphic should be scaled to approximately **${activeSideControls.scale}%** of the apparel's main surface area.
- **Rotation:** The graphic should be rotated by **${activeSideControls.rotation} degrees**.
- **Offset:** The graphic should be offset horizontally by **${activeSideControls.offsetX}%** and vertically by **${activeSideControls.offsetY}%**.

**REALISM ENGINE:**
- **Print Style:** The graphic should look like a **${printStyle}**.
- **Fabric Blend:** The design should blend into the fabric with an intensity of **${designPlacementControls.fabricBlend}%**, making it look like it's part of the fabric.
- **Wrinkle Conforming:** The design ${designPlacementControls.wrinkleConform ? 'MUST' : 'must NOT'} realistically conform to the wrinkles and shadows of the fabric.

**VIRTUAL PHOTOSHOOT:**
- **Background & Scene:** The scene is a ${scene.background.name}. ${scene.sceneProps}.
- **Lighting:** The lighting should be **${lightingStyle}**. ${scene.lighting.description}.
- **Camera Angle:** The shot should be from a **${cameraAngle}**.
- **Output Format:** ${getAspectRatioPrompt(aspectRatio)}

---
**CRITICAL FINAL INSTRUCTION:** The final image must be clean, professional, and indistinguishable from a real product photograph.`;

            parts.push({ text: textPrompt });
            
            // Preprocess mockup image to match aspect ratio
            const resizedMockupImage = await geminiService.resizeImageToAspectRatio(mockupImage.base64, params.aspectRatio);
            const mockupImageParts = parseDataUrl(resizedMockupImage);
            parts.push({ inlineData: { mimeType: mockupImageParts.mimeType, data: mockupImageParts.data } });

            // Preprocess design image to match aspect ratio
            const resizedDesignImage = await geminiService.resizeImageToAspectRatio(activeDesign.base64, params.aspectRatio);
            const designImageParts = parseDataUrl(resizedDesignImage);
            parts.push({ inlineData: { mimeType: designImageParts.mimeType, data: designImageParts.data } });
            
            return { parts };
        }


        // =================================
        // --- APPAREL/PRODUCT MODE BASE ---
        // =================================
        let scenePrompt = '';
        const { scene } = params;
        if (scene.background.type === 'color' || scene.background.type === 'gradient') {
            scenePrompt += `The background is a clean, professional studio backdrop with ${scene.background.name.toLowerCase()}.`;
        } else {
             scenePrompt += `The scene is ${scene.background.name}.`;
        }

        if (scene.timeOfDay) {
            scenePrompt += ` The time of day is ${scene.timeOfDay}.`;
        } else {
            scenePrompt += ` The lighting should be ${scene.lighting.description}.`;
        }
        
        if (scene.sceneProps) {
            scenePrompt += ` The scene includes the following props or elements: ${scene.sceneProps}.`;
        }
        if (scene.environmentalEffects) {
             scenePrompt += ` The following environmental effects are present: ${scene.environmentalEffects}.`;
        }
        
        // =====================================
        // --- APPAREL MODE-SPECIFIC PROMPTS ---
        // =====================================
        if (params.studioMode === 'apparel') {
            const { uploadedModelImage, selectedModels, apparel, animation, generationMode, promptedModelDescription, apparelControls, baseLookImageB64, modelReferenceImage } = params;
            
            let modelPrompt = '';
            if (uploadedModelImage) {
                // Scenario 1: User uploaded their own model image
                modelPrompt = 'The person in the **FIRST IMAGE** should be used. Preserve their identity, face, body, and ethnicity with 100% accuracy.';
                // Preprocess model image to match aspect ratio
                const resizedModelImage = await geminiService.resizeImageToAspectRatio(uploadedModelImage, params.aspectRatio);
                const modelImageParts = parseDataUrl(resizedModelImage);
                parts.push({ inlineData: { mimeType: modelImageParts.mimeType, data: modelImageParts.data } });
            } else if (modelReferenceImage) {
                // Scenario 3: Generating a pack from a reference model image
                modelPrompt = 'The person in the **FIRST IMAGE** should be used as the reference for the model. Recreate this person with high fidelity in the new pose and setting.';
                // Preprocess reference image to match aspect ratio
                const resizedReferenceImage = await geminiService.resizeImageToAspectRatio(modelReferenceImage, params.aspectRatio);
                const modelImageParts = parseDataUrl(resizedReferenceImage);
                parts.push({ inlineData: { mimeType: modelImageParts.mimeType, data: modelImageParts.data } });
            } else if (selectedModels.length > 0) {
                // Scenario 2: User selected model(s) from the library
                modelPrompt = `The model is: ${selectedModels.map(m => m.description).join(', ')}.`;
            } else if (promptedModelDescription.trim()) {
                 // Scenario 4: User described a model with a prompt
                 modelPrompt = `The model is: ${promptedModelDescription.trim()}.`;
            }

            const apparelDescriptions = apparel.map(item => `- ${item.description}`).join('\n');
            const itemPrompt = `The model is styled with the following item(s), which are provided as subsequent images:\n${apparelDescriptions}`;

             // --- ASSEMBLE THE FINAL PROMPT ---
             let finalPrompt = '';

             if (apparelControls.customPrompt) {
                 finalPrompt = apparelControls.customPrompt;
                 parts.push({ text: finalPrompt });
             } else {
                 const isVideo = generationMode === 'video' && animation;

                 const shotTypeDesc = getControlValue(apparelControls, 'shotType', 'customShotType');
                 const expressionDesc = getControlValue(apparelControls, 'expression', 'customExpression');
                 const fabricDesc = getControlValue(apparelControls, 'fabric', 'customFabric');
                 const colorGradeDesc = getControlValue(apparelControls, 'colorGrade', 'customColorGrade');
                 const cameraAngleDesc = getControlValue(apparelControls, 'cameraAngle', 'customCameraAngle');
                 const focalLengthDesc = getControlValue(apparelControls, 'focalLength', 'customFocalLength');
                 const apertureDesc = getControlValue(apparelControls, 'aperture', 'customAperture');
                 const lightingDirectionDesc = getControlValue(apparelControls, 'lightingDirection', 'customLightingDirection');
                 const lightQualityDesc = getControlValue(apparelControls, 'lightQuality', 'customLightQuality');
                 const catchlightStyleDesc = getControlValue(apparelControls, 'catchlightStyle', 'customCatchlightStyle');

                 finalPrompt = `**${isVideo ? 'VIDEO' : 'PHOTO'}SHOOT DIRECTIVE**

**PRIMARY GOAL:** Create an ultra-photorealistic ${isVideo ? 'video clip' : 'image'} of a fashion model styled with specific items in a described scene.

---
**1. ASSET ANALYSIS (CRITICAL)**
${uploadedModelImage || modelReferenceImage ? '- **FIRST IMAGE (MODEL):** This image contains the person to be featured.\n' : ''}- The subsequent image(s) contain the **ITEM(S)** to be worn or held.

---
**2. SCENE & STYLING**

**MODEL:**
- ${modelPrompt}
- **Pose & Expression:** The model is ${shotTypeDesc} with ${expressionDesc}.
- **Styling:**
    - Hair: ${apparelControls.hairStyle || 'As seen on the model or naturally styled.'}
    - Makeup: ${apparelControls.makeupStyle || 'Natural makeup.'}
    - Item Styling: ${apparelControls.garmentStyling || 'The items are worn or held naturally.'}

**ITEMS:**
- ${itemPrompt}
- The AI must perfectly transfer the item(s) from the source image(s) onto the specified model, ensuring a natural fit with realistic wrinkles, shadows, and lighting.
- Fabric simulation should be: ${fabricDesc}.

**ENVIRONMENT:**
- ${scenePrompt}

**PHOTOGRAPHY:**
- **Camera:** The shot is captured with ${focalLengthDesc}, ${apertureDesc}.
- **Angle:** The camera is positioned at a ${cameraAngleDesc}.
- **Lighting Details:** Light direction is ${lightingDirectionDesc}. Light quality is ${lightQualityDesc}. Eye catchlight style is ${catchlightStyleDesc}.
- **Color Grade:** ${colorGradeDesc}
- **Output Format:** ${getAspectRatioPrompt(params.aspectRatio)}
${isVideo ? `\n**ANIMATION:**\n- ${animation.description}` : ''}
`;

                if (apparelControls.isHyperRealismEnabled) finalPrompt += "\n- The final output must be hyper-realistic, with extreme detail in skin texture, fabric, and lighting.";
                if (apparelControls.cinematicLook) finalPrompt += "\n- The final output should have a cinematic, high-end fashion magazine aesthetic.";
                
                parts.push({ text: finalPrompt });
             }

             if (baseLookImageB64) {
                 // Preprocess look image to match aspect ratio
                 const resizedLookImage = await geminiService.resizeImageToAspectRatio(baseLookImageB64, params.aspectRatio);
                 const lookImageParts = parseDataUrl(resizedLookImage);
                 parts.unshift({ inlineData: { mimeType: lookImageParts.mimeType, data: lookImageParts.data } });
             }
             
             // Preprocess all apparel item images to match aspect ratio
             for (const item of apparel) {
                 const resizedItemImage = await geminiService.resizeImageToAspectRatio(item.base64, params.aspectRatio);
                 const itemImageParts = parseDataUrl(resizedItemImage);
                 parts.push({ inlineData: { mimeType: itemImageParts.mimeType, data: itemImageParts.data } });
             }
             return { parts };
        }

        // =====================================
        // --- PRODUCT MODE-SPECIFIC PROMPTS ---
        // =====================================
        // FIX: Replaced `if` with `else` to ensure all code paths return a value, satisfying TypeScript's control flow analysis.
        else if (params.studioMode === 'product') { // This must be 'product' mode
            const { productImage, stagedAssets, productControls, generationMode, animation, uploadedModelImage, selectedModels, promptedModelDescription, modelReferenceImage } = params;

            let finalPrompt = '';

            if (productControls.customPrompt) {
                 finalPrompt = productControls.customPrompt;
                 parts.push({ text: finalPrompt });
            } else {
                 const isVideo = generationMode === 'video' && animation;
                 const isModelShot = !!uploadedModelImage || selectedModels.length > 0 || !!promptedModelDescription.trim() || !!modelReferenceImage;

                 let modelPrompt = '';
                 if (isModelShot) {
                    if (uploadedModelImage) {
                        modelPrompt = 'The person in the **FIRST IMAGE** should be used. Preserve their identity, face, body, and ethnicity with 100% accuracy.';
                    } else if (modelReferenceImage) {
                        modelPrompt = 'The person in the **FIRST IMAGE** should be used as the reference for the model. Recreate this person with high fidelity in the new pose and setting.';
                    } else if (selectedModels.length > 0) {
                        modelPrompt = `The model is: ${selectedModels.map(m => m.description).join(', ')}.`;
                    } else if (promptedModelDescription.trim()) {
                        modelPrompt = `The model is: ${promptedModelDescription.trim()}.`;
                    }
                 }
                
                const materialDescription = getControlValue(productControls, 'productMaterial', 'customProductMaterial');
                const cameraAngleDescription = getControlValue(productControls, 'cameraAngle', 'customCameraAngle');
                const focalLengthDesc = getControlValue(productControls, 'focalLength', 'customFocalLength');
                const apertureDesc = getControlValue(productControls, 'aperture', 'customAperture');
                const colorGradeDesc = getControlValue(productControls, 'colorGrade', 'customColorGrade');
                const shotTypeDesc = getControlValue(productControls, 'shotType', 'customShotType');
                const expressionDesc = getControlValue(productControls, 'expression', 'customExpression');
                const interactionDesc = getControlValue(productControls, 'modelInteractionType', 'customModelInteraction');
                const lightingDirectionDesc = getControlValue(productControls, 'lightingDirection', 'customLightingDirection');
                const lightQualityDesc = getControlValue(productControls, 'lightQuality', 'customLightQuality');
                const catchlightStyleDesc = getControlValue(productControls, 'catchlightStyle', 'customCatchlightStyle');
                const surfaceDesc = getControlValue(productControls, 'surface', 'customSurface');
                
                finalPrompt = `**PRODUCT ${isVideo ? 'VIDEO' : 'PHOTO'}SHOOT DIRECTIVE**

**PRIMARY GOAL:** Create an ultra-photorealistic ${isVideo ? 'video clip' : 'image'} of a product within a described scene.

---
**1. ASSET ANALYSIS**
- The subsequent images are the product assets to be staged in the scene. Their relative positions and sizes are described below.

---
**2. SCENE & STYLING**

**PRODUCT & STAGING:**
- The primary product is placed on ${surfaceDesc}.
- **Staging Composition:** ${stagedAssets.map(a => `Asset '${a.id}' is at position (${a.x.toFixed(1)}%, ${a.y.toFixed(1)}%) with a scale of ${a.scale.toFixed(1)}% and layer order ${a.z}.`).join(' ')}
- The product's material should be rendered as a **${materialDescription}**.
- The product casts a **${productControls.productShadow.toLowerCase()} shadow**.
- Additional props: ${productControls.customProps || 'None.'}

${isModelShot ? `
**ON-MODEL SHOT DETAILS:**
- **Model:** ${modelPrompt}
- **Pose & Expression:** The model is ${shotTypeDesc} with ${expressionDesc}.
- **Interaction:** The model is ${interactionDesc}.
` : ''}

**ENVIRONMENT:**
- ${scenePrompt}

**PHOTOGRAPHY:**
- **Camera:** The shot is captured with ${focalLengthDesc}, ${apertureDesc}.
- **Angle:** The camera is positioned at a ${cameraAngleDescription}.
- **Lighting Details:** Light direction is ${lightingDirectionDesc}. Light quality is ${lightQualityDesc}. Catchlight style is ${catchlightStyleDesc}.
- **Color Grade:** ${colorGradeDesc}
- **Output Format:** ${getAspectRatioPrompt(params.aspectRatio)}
${isVideo ? `\n**ANIMATION:**\n- ${animation.description}` : ''}
`;
                if (productControls.isHyperRealismEnabled) finalPrompt += "\n- The final output must be hyper-realistic, with extreme detail in materials, textures, and lighting.";
                if (productControls.cinematicLook) finalPrompt += "\n- The final output should have a cinematic, high-end commercial aesthetic.";

                 parts.push({ text: finalPrompt });
            }
            
            if (modelReferenceImage) {
                // Preprocess reference model image to match aspect ratio
                const resizedModelImage = await geminiService.resizeImageToAspectRatio(modelReferenceImage, params.aspectRatio);
                const modelImageParts = parseDataUrl(resizedModelImage);
                parts.push({ inlineData: { mimeType: modelImageParts.mimeType, data: modelImageParts.data } });
            } else if (uploadedModelImage) {
                // Preprocess uploaded model image to match aspect ratio
                const resizedModelImage = await geminiService.resizeImageToAspectRatio(uploadedModelImage, params.aspectRatio);
                const modelImageParts = parseDataUrl(resizedModelImage);
                parts.push({ inlineData: { mimeType: modelImageParts.mimeType, data: modelImageParts.data } });
            }

            // Preprocess all staged asset images to match aspect ratio
            const sortedAssets = stagedAssets.sort((a,b) => a.id === 'product' ? -1 : b.id === 'product' ? 1 : 0);
            for (const asset of sortedAssets) {
                const resizedAssetImage = await geminiService.resizeImageToAspectRatio(asset.base64, params.aspectRatio);
                const assetImageParts = parseDataUrl(resizedAssetImage);
                parts.push({ inlineData: { mimeType: assetImageParts.mimeType, data: assetImageParts.data } });
            }
            
             return { parts };
        }

        // Fallback for exhaustive check, should not be reached
        return { parts };
    }
};

// FIX: The original generic constraint was overly complex and caused TypeScript to infer 'never' for propValue.
// Simplified the signature to be less restrictive and added a type assertion inside, which is safer due to runtime checks.
// Helper function to get value for custom-enabled controls
function getControlValue<T, P extends keyof T, C extends keyof T>(
    controls: T,
    prop: P,
    customProp: C
): string {
    const propValue = controls[prop];
    if (typeof propValue === 'object' && propValue && 'id' in propValue && (propValue as { id: string }).id === 'custom') {
        return controls[customProp] as string;
    }
    return (propValue as any).description;
}