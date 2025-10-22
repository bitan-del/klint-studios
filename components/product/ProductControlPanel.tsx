import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
    APERTURES_LIBRARY, 
    FOCAL_LENGTHS_LIBRARY, 
    CAMERA_ANGLES_LIBRARY_PRODUCT,
    LIGHTING_DIRECTIONS_LIBRARY,
    LIGHT_QUALITIES_LIBRARY,
    CATCHLIGHT_STYLES_LIBRARY,
    COLOR_GRADING_PRESETS,
    PRODUCT_MATERIAL_LIBRARY,
    SHOT_TYPES_LIBRARY,
    EXPRESSIONS,
    CAMERA_ANGLES_LIBRARY,
    PRODUCT_INTERACTION_LIBRARY,
} from '../../constants';
import { OptionSelector } from '../shared/OptionSelector';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import { Sparkles, Film, Type, Save, Layers, Trash2, User } from 'lucide-react';
import { SettingSection } from '../settings/SettingSection';
import { PromptOptimizer } from '../shared/PromptOptimizer';

export const ProductControlPanel: React.FC = () => {
    const { productControls, updateProductControl, sceneTemplates, saveSceneTemplate, applySceneTemplate, deleteSceneTemplate, selectedModels, uploadedModelImage, t } = useStudio();
    const [templateName, setTemplateName] = useState('');
    
    const isModelSelected = selectedModels.length > 0 || !!uploadedModelImage;

    const handleSave = () => {
        saveSceneTemplate(templateName);
        setTemplateName('');
    }
    
    const standardMaterials = PRODUCT_MATERIAL_LIBRARY.filter(m => m.category === 'Standard');
    const artisticMaterials = PRODUCT_MATERIAL_LIBRARY.filter(m => m.category === 'Artistic');

    return (
        <div className="flex flex-col space-y-6">
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="hyper-realism-toggle-product" className="font-semibold text-zinc-100 flex items-center gap-2 cursor-pointer">
                        <Sparkles size={18} /> {t('hyper_realism')}
                    </label>
                    <ToggleSwitch
                        id="hyper-realism-toggle-product"
                        checked={productControls.isHyperRealismEnabled}
                        onChange={(checked) => updateProductControl('isHyperRealismEnabled', checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="cinematic-look-toggle-product" className="font-semibold text-zinc-100 flex items-center gap-2 cursor-pointer">
                        <Film size={18} /> {t('cinematic_look')}
                    </label>
                    <ToggleSwitch
                        id="cinematic-look-toggle-product"
                        checked={productControls.cinematicLook}
                        onChange={(checked) => updateProductControl('cinematicLook', checked)}
                    />
                </div>
            </div>
             <OptionSelector
                label={t('color_grade')}
                options={COLOR_GRADING_PRESETS}
                selectedOption={productControls.colorGrade}
                onSelect={(option) => updateProductControl('colorGrade', option)}
                gridCols="grid-cols-2"
                buttonTextSize="text-xs"
            />
             {productControls.colorGrade.id === 'custom' && (
                <div className="animate-fade-in -mt-4 relative">
                    <textarea
                        id="custom-color-grade-product"
                        value={productControls.customColorGrade}
                        onChange={(e) => updateProductControl('customColorGrade', e.target.value)}
                        placeholder={t('custom_color_grade_placeholder')}
                        rows={3}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={productControls.customColorGrade}
                        setPrompt={(v) => updateProductControl('customColorGrade', v)}
                        context="A custom color grade description"
                        className="absolute bottom-2 right-2"
                    />
                </div>
            )}
            
            {!isModelSelected && (
                 <>
                    <OptionSelector
                        label={t('material_reflections')}
                        options={standardMaterials}
                        selectedOption={productControls.productMaterial}
                        onSelect={(option) => updateProductControl('productMaterial', option)}
                        gridCols="grid-cols-2"
                    />
                    {productControls.productMaterial.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                id="custom-product-material"
                                value={productControls.customProductMaterial}
                                onChange={(e) => updateProductControl('customProductMaterial', e.target.value)}
                                placeholder={'e.g., a slightly translucent, frosted glass material with a soft glow.'}
                                rows={3}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={productControls.customProductMaterial}
                                setPrompt={(v) => updateProductControl('customProductMaterial', v)}
                                context="A custom product material description"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                    <OptionSelector
                        label={t('artistic_transformations')}
                        options={artisticMaterials}
                        selectedOption={productControls.productMaterial}
                        onSelect={(option) => updateProductControl('productMaterial', option)}
                        gridCols="grid-cols-3"
                        buttonTextSize="text-xs"
                    />
                 </>
            )}
           
             <OptionSelector
                label={t('camera_angle')}
                options={isModelSelected ? CAMERA_ANGLES_LIBRARY : CAMERA_ANGLES_LIBRARY_PRODUCT}
                selectedOption={productControls.cameraAngle}
                onSelect={(option) => updateProductControl('cameraAngle', option)}
                gridCols="grid-cols-2"
            />
            {productControls.cameraAngle.id === 'custom' && (
                <div className="animate-fade-in -mt-4 relative">
                    <textarea
                        id="custom-camera-angle-product"
                        value={productControls.customCameraAngle}
                        onChange={(e) => updateProductControl('customCameraAngle', e.target.value)}
                        placeholder={isModelSelected ? 'e.g., a dynamic shot from a very high angle' : 'e.g., shot from a slightly high angle, looking down'}
                        rows={3}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                     <PromptOptimizer
                        prompt={productControls.customCameraAngle}
                        setPrompt={(v) => updateProductControl('customCameraAngle', v)}
                        context="A custom camera angle"
                        className="absolute bottom-2 right-2"
                    />
                </div>
            )}
            <OptionSelector
                label={t('focal_length')}
                options={FOCAL_LENGTHS_LIBRARY}
                selectedOption={productControls.focalLength}
                onSelect={(option) => updateProductControl('focalLength', option)}
                gridCols="grid-cols-3"
            />
            {productControls.focalLength.id === 'custom' && (
                <div className="animate-fade-in -mt-4 relative">
                    <textarea
                        value={productControls.customFocalLength}
                        onChange={(e) => updateProductControl('customFocalLength', e.target.value)}
                        placeholder={'e.g., an extreme telephoto lens, creating a very compressed background.'}
                        rows={3}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={productControls.customFocalLength}
                        setPrompt={(v) => updateProductControl('customFocalLength', v)}
                        context="A custom focal length or lens effect"
                        className="absolute bottom-2 right-2"
                    />
                </div>
            )}
            <OptionSelector
                label={t('aperture')}
                options={APERTURES_LIBRARY}
                selectedOption={productControls.aperture}
                onSelect={(option) => updateProductControl('aperture', option)}
                gridCols="grid-cols-3"
            />
            {productControls.aperture.id === 'custom' && (
                <div className="animate-fade-in -mt-4 relative">
                    <textarea
                        value={productControls.customAperture}
                        onChange={(e) => updateProductControl('customAperture', e.target.value)}
                        placeholder={'e.g., an extremely shallow depth of field, with only one part of the product in focus.'}
                        rows={3}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={productControls.customAperture}
                        setPrompt={(v) => updateProductControl('customAperture', v)}
                        context="A custom aperture or depth of field effect"
                        className="absolute bottom-2 right-2"
                    />
                </div>
            )}
            
             {isModelSelected && (
                 <SettingSection title={t('on_model_photoshoot')} icon={<User size={18} />} defaultOpen>
                    <div className="space-y-6 pt-4">
                        <OptionSelector
                            label={t('shot_type_pose')}
                            options={SHOT_TYPES_LIBRARY}
                            selectedOption={productControls.shotType}
                            onSelect={(option) => updateProductControl('shotType', option)}
                            gridCols="grid-cols-2"
                            buttonTextSize="text-xs"
                        />
                         {productControls.shotType.id === 'custom' && (
                            <div className="animate-fade-in -mt-4 relative">
                                <textarea
                                    id="custom-shot-type-product"
                                    value={productControls.customShotType}
                                    onChange={(e) => updateProductControl('customShotType', e.target.value)}
                                    placeholder={t('custom_shot_type_placeholder')}
                                    rows={3}
                                    className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                                />
                                <PromptOptimizer
                                    prompt={productControls.customShotType}
                                    setPrompt={(v) => updateProductControl('customShotType', v)}
                                    context="A custom pose or shot type for a model with a product"
                                    className="absolute bottom-2 right-2"
                                />
                            </div>
                        )}
                        <OptionSelector
                            label={t('model_expression')}
                            options={EXPRESSIONS}
                            selectedOption={productControls.expression}
                            onSelect={(option) => updateProductControl('expression', option)}
                            gridCols="grid-cols-2"
                        />
                         {productControls.expression.id === 'custom' && (
                            <div className="animate-fade-in -mt-4 relative">
                                <textarea
                                    id="custom-expression-product"
                                    value={productControls.customExpression}
                                    onChange={(e) => updateProductControl('customExpression', e.target.value)}
                                    placeholder={'e.g., a slight smirk, looking directly at the camera.'}
                                    rows={3}
                                    className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                                />
                                <PromptOptimizer
                                    prompt={productControls.customExpression}
                                    setPrompt={(v) => updateProductControl('customExpression', v)}
                                    context="A custom model expression"
                                    className="absolute bottom-2 right-2"
                                />
                            </div>
                        )}
                        <OptionSelector
                            label={t('product_interaction')}
                            options={PRODUCT_INTERACTION_LIBRARY}
                            selectedOption={productControls.modelInteractionType}
                            onSelect={(option) => updateProductControl('modelInteractionType', option)}
                            gridCols="grid-cols-2"
                            buttonTextSize="text-xs"
                        />
                        {productControls.modelInteractionType.id === 'custom' && (
                            <div className="animate-fade-in relative">
                                <label htmlFor="model-interaction" className="text-sm font-semibold text-zinc-300">{t('custom_interaction')}</label>
                                <p className="text-xs text-zinc-400 mt-1 mb-2">{t('custom_interaction_desc')}</p>
                                <textarea
                                    id="model-interaction"
                                    value={productControls.customModelInteraction}
                                    onChange={(e) => updateProductControl('customModelInteraction', e.target.value)}
                                    placeholder={t('custom_interaction_placeholder')}
                                    rows={3}
                                    className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                                />
                                <PromptOptimizer
                                    prompt={productControls.customModelInteraction}
                                    setPrompt={(v) => updateProductControl('customModelInteraction', v)}
                                    context="How a model interacts with a product"
                                    className="absolute bottom-2 right-2"
                                />
                            </div>
                        )}
                    </div>
                </SettingSection>
            )}


            <SettingSection title={t('scene_templates')} icon={<Save size={18} />}>
                <div className="space-y-4 pt-4">
                    <div>
                        <label htmlFor="template-name" className="text-sm font-semibold text-zinc-300">{t('save_current_scene')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('save_current_scene_desc')}</p>
                        <div className="flex gap-2">
                            <input
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder={t('save_current_scene_placeholder')}
                                className="flex-1 p-2.5 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!templateName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>

                    {sceneTemplates.length > 0 && (
                        <div className="border-t border-zinc-700 pt-4">
                             <h4 className="text-sm font-semibold text-zinc-300 mb-2">{t('my_templates')}</h4>
                             <div className="space-y-2">
                                {sceneTemplates.map(template => (
                                    <div key={template.id} className="flex items-center justify-between p-2 rounded-md bg-zinc-800">
                                        <p className="text-sm text-zinc-200">{template.name}</p>
                                        <div className="flex items-center gap-1">
                                             <button onClick={() => applySceneTemplate(template.id)} className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors" title={t('apply_template')}>
                                                <Layers size={16} />
                                            </button>
                                            <button onClick={() => deleteSceneTemplate(template.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-md transition-colors" title={t('delete_template')}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </SettingSection>

            <SettingSection title={t('advanced_lighting')} icon={<Sparkles size={18} />}>
                <div className="space-y-6 pt-4">
                     <OptionSelector
                        label={t('light_direction')}
                        options={LIGHTING_DIRECTIONS_LIBRARY}
                        selectedOption={productControls.lightingDirection}
                        onSelect={(option) => updateProductControl('lightingDirection', option)}
                        gridCols="grid-cols-2"
                    />
                    {productControls.lightingDirection.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={productControls.customLightingDirection}
                                onChange={(e) => updateProductControl('customLightingDirection', e.target.value)}
                                placeholder={'e.g., a strong key light from the top left.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={productControls.customLightingDirection}
                                setPrompt={(v) => updateProductControl('customLightingDirection', v)}
                                context="A custom lighting direction"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                     <OptionSelector
                        label={t('light_quality')}
                        options={LIGHT_QUALITIES_LIBRARY}
                        selectedOption={productControls.lightQuality}
                        onSelect={(option) => updateProductControl('lightQuality', option)}
                        gridCols="grid-cols-2"
                    />
                    {productControls.lightQuality.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={productControls.customLightQuality}
                                onChange={(e) => updateProductControl('customLightQuality', e.target.value)}
                                placeholder={'e.g., extremely soft, diffused light with no visible shadows.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={productControls.customLightQuality}
                                setPrompt={(v) => updateProductControl('customLightQuality', v)}
                                context="A custom light quality"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                     <OptionSelector
                        label={t('surface_catchlight')}
                        options={CATCHLIGHT_STYLES_LIBRARY}
                        selectedOption={productControls.catchlightStyle}
                        onSelect={(option) => updateProductControl('catchlightStyle', option)}
                        gridCols="grid-cols-3"
                    />
                     {productControls.catchlightStyle.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={productControls.customCatchlightStyle}
                                onChange={(e) => updateProductControl('customCatchlightStyle', e.target.value)}
                                placeholder={'e.g., a large, square softbox catchlight.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={productControls.customCatchlightStyle}
                                setPrompt={(v) => updateProductControl('customCatchlightStyle', v)}
                                context="A custom catchlight style for a product"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                </div>
            </SettingSection>

            <SettingSection title={t('advanced_prompting')} icon={<Type size={18}/>}>
                <div className="pt-4 space-y-6">
                    <div className="relative">
                        <label htmlFor="negative-prompt-product" className="text-sm font-semibold text-zinc-300">{t('negative_prompt')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('negative_prompt_desc')}</p>
                        <textarea
                            id="negative-prompt-product"
                            value={productControls.negativePrompt}
                            onChange={(e) => updateProductControl('negativePrompt', e.target.value)}
                            placeholder={t('negative_prompt_placeholder')}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={productControls.negativePrompt}
                            setPrompt={(v) => updateProductControl('negativePrompt', v)}
                            context="A negative prompt to avoid elements in an image"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                
                    <div className="relative">
                        <label htmlFor="custom-prompt-product" className="text-sm font-semibold text-zinc-300">{t('custom_prompt_override')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">
                            {t('custom_prompt_desc')}
                        </p>
                        <textarea
                            id="custom-prompt-product"
                            value={productControls.customPrompt}
                            onChange={(e) => updateProductControl('customPrompt', e.target.value)}
                            placeholder="e.g., A watch on a marble slab, surrounded by coffee beans, dramatic side lighting..."
                            rows={5}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={productControls.customPrompt}
                            setPrompt={(v) => updateProductControl('customPrompt', v)}
                            context="A detailed, overriding photoshoot prompt for a product"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                </div>
            </SettingSection>
        </div>
    );
};