import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
    SHOT_TYPES_LIBRARY, 
    EXPRESSIONS, 
    APERTURES_LIBRARY, 
    FOCAL_LENGTHS_LIBRARY, 
    FABRIC_TYPES_LIBRARY, 
    CAMERA_ANGLES_LIBRARY,
    LIGHTING_DIRECTIONS_LIBRARY,
    LIGHT_QUALITIES_LIBRARY,
    CATCHLIGHT_STYLES_LIBRARY,
    COLOR_GRADING_PRESETS
} from '../../constants';
import { OptionSelector } from '../shared/OptionSelector';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import { Sparkles, Film, Type, User, Layers } from 'lucide-react';
import { SettingSection } from './SettingSection';
import { PromptOptimizer } from '../shared/PromptOptimizer';

export const ControlPanel: React.FC = () => {
    const { apparelControls, updateApparelControl, t } = useStudio();

    return (
        <div className="flex flex-col space-y-2">
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="hyper-realism-toggle" className="font-semibold text-zinc-100 flex items-center gap-2 cursor-pointer">
                        <Sparkles size={18} /> {t('hyper_realism')}
                    </label>
                    <ToggleSwitch
                        id="hyper-realism-toggle"
                        checked={apparelControls.isHyperRealismEnabled}
                        onChange={(checked) => updateApparelControl('isHyperRealismEnabled', checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="cinematic-look-toggle" className="font-semibold text-zinc-100 flex items-center gap-2 cursor-pointer">
                        <Film size={18} /> {t('cinematic_look')}
                    </label>
                    <ToggleSwitch
                        id="cinematic-look-toggle"
                        checked={apparelControls.cinematicLook}
                        onChange={(checked) => updateApparelControl('cinematicLook', checked)}
                    />
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <OptionSelector
                    label={t('color_grade')}
                    options={COLOR_GRADING_PRESETS}
                    selectedOption={apparelControls.colorGrade}
                    onSelect={(option) => updateApparelControl('colorGrade', option)}
                    gridCols="grid-cols-2"
                    buttonTextSize="text-xs"
                />
                {apparelControls.colorGrade.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            id="custom-color-grade"
                            value={apparelControls.customColorGrade}
                            onChange={(e) => updateApparelControl('customColorGrade', e.target.value)}
                            placeholder={t('custom_color_grade_placeholder')}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customColorGrade}
                            setPrompt={(v) => updateApparelControl('customColorGrade', v)}
                            context="A custom color grade description"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                <OptionSelector
                    label={t('shot_type_pose')}
                    options={SHOT_TYPES_LIBRARY}
                    selectedOption={apparelControls.shotType}
                    onSelect={(option) => updateApparelControl('shotType', option)}
                    gridCols="grid-cols-2"
                    buttonTextSize="text-xs"
                />
                 {apparelControls.shotType.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            id="custom-shot-type"
                            value={apparelControls.customShotType}
                            onChange={(e) => updateApparelControl('customShotType', e.target.value)}
                            placeholder={t('custom_shot_type_placeholder')}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customShotType}
                            setPrompt={(v) => updateApparelControl('customShotType', v)}
                            context="A custom pose or shot type"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                <OptionSelector
                    label={t('model_expression')}
                    options={EXPRESSIONS}
                    selectedOption={apparelControls.expression}
                    onSelect={(option) => updateApparelControl('expression', option)}
                    gridCols="grid-cols-2"
                />
                 {apparelControls.expression.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            id="custom-expression"
                            value={apparelControls.customExpression}
                            onChange={(e) => updateApparelControl('customExpression', e.target.value)}
                            placeholder={'e.g., a slight smirk, looking directly at the camera.'}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                         <PromptOptimizer
                            prompt={apparelControls.customExpression}
                            setPrompt={(v) => updateApparelControl('customExpression', v)}
                            context="A custom model expression"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                <OptionSelector
                    label={t('camera_angle')}
                    options={CAMERA_ANGLES_LIBRARY}
                    selectedOption={apparelControls.cameraAngle}
                    onSelect={(option) => updateApparelControl('cameraAngle', option)}
                    gridCols="grid-cols-2"
                />
                {apparelControls.cameraAngle.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            value={apparelControls.customCameraAngle}
                            onChange={(e) => updateApparelControl('customCameraAngle', e.target.value)}
                            placeholder={'e.g., a dynamic shot from a very high angle, almost top-down.'}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customCameraAngle}
                            setPrompt={(v) => updateApparelControl('customCameraAngle', v)}
                            context="A custom camera angle"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                <OptionSelector
                    label={t('focal_length')}
                    options={FOCAL_LENGTHS_LIBRARY}
                    selectedOption={apparelControls.focalLength}
                    onSelect={(option) => updateApparelControl('focalLength', option)}
                    gridCols="grid-cols-3"
                />
                {apparelControls.focalLength.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            value={apparelControls.customFocalLength}
                            onChange={(e) => updateApparelControl('customFocalLength', e.target.value)}
                            placeholder={'e.g., an extreme telephoto lens, creating a very compressed background.'}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customFocalLength}
                            setPrompt={(v) => updateApparelControl('customFocalLength', v)}
                            context="A custom focal length or lens effect"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                <OptionSelector
                    label={t('aperture')}
                    options={APERTURES_LIBRARY}
                    selectedOption={apparelControls.aperture}
                    onSelect={(option) => updateApparelControl('aperture', option)}
                    gridCols="grid-cols-3"
                />
                {apparelControls.aperture.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            value={apparelControls.customAperture}
                            onChange={(e) => updateApparelControl('customAperture', e.target.value)}
                            placeholder={'e.g., an extremely shallow depth of field, with only the eyes in focus.'}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customAperture}
                            setPrompt={(v) => updateApparelControl('customAperture', v)}
                            context="A custom aperture or depth of field effect"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
                 <OptionSelector
                    label={t('fabric_simulation')}
                    options={FABRIC_TYPES_LIBRARY}
                    selectedOption={apparelControls.fabric}
                    onSelect={(option) => updateApparelControl('fabric', option)}
                    gridCols="grid-cols-2"
                />
                 {apparelControls.fabric.id === 'custom' && (
                    <div className="animate-fade-in -mt-4 relative">
                        <textarea
                            id="custom-fabric"
                            value={apparelControls.customFabric}
                            onChange={(e) => updateApparelControl('customFabric', e.target.value)}
                            placeholder={'e.g., a heavy, textured wool with visible knit patterns.'}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.customFabric}
                            setPrompt={(v) => updateApparelControl('customFabric', v)}
                            context="A custom fabric description"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                )}
            </div>

            <SettingSection title={t('model_styling')} icon={<User size={18}/>}>
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <label htmlFor="hair-style" className="text-sm font-semibold text-zinc-300">{t('hair_style')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('hair_style_desc')}</p>
                        <textarea
                            id="hair-style"
                            value={apparelControls.hairStyle}
                            onChange={(e) => updateApparelControl('hairStyle', e.target.value)}
                            placeholder={t('hair_style_placeholder')}
                            rows={2}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.hairStyle}
                            setPrompt={(v) => updateApparelControl('hairStyle', v)}
                            context="A model's hair style"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                     <div className="relative">
                        <label htmlFor="makeup-style" className="text-sm font-semibold text-zinc-300">{t('makeup_style')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('makeup_style_desc')}</p>
                        <textarea
                            id="makeup-style"
                            value={apparelControls.makeupStyle}
                            onChange={(e) => updateApparelControl('makeupStyle', e.target.value)}
                            placeholder={t('makeup_style_placeholder')}
                            rows={2}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.makeupStyle}
                            setPrompt={(v) => updateApparelControl('makeupStyle', v)}
                            context="A model's makeup style"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                </div>
            </SettingSection>

            <SettingSection title={t('garment_styling')} icon={<Layers size={18}/>}>
                 <div className="space-y-4 pt-4">
                    <div className="relative">
                        <label htmlFor="garment-styling" className="text-sm font-semibold text-zinc-300">{t('styling_details')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('styling_details_desc')}</p>
                        <textarea
                            id="garment-styling"
                            value={apparelControls.garmentStyling}
                            onChange={(e) => updateApparelControl('garmentStyling', e.target.value)}
                            placeholder={t('styling_details_placeholder')}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.garmentStyling}
                            setPrompt={(v) => updateApparelControl('garmentStyling', v)}
                            context="How an item is styled or held"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                </div>
            </SettingSection>

            <SettingSection title={t('advanced_lighting')} icon={<Sparkles size={18}/>}>
                <div className="space-y-6 pt-4">
                     <OptionSelector
                        label={t('light_direction')}
                        options={LIGHTING_DIRECTIONS_LIBRARY}
                        selectedOption={apparelControls.lightingDirection}
                        onSelect={(option) => updateApparelControl('lightingDirection', option)}
                        gridCols="grid-cols-2"
                    />
                    {apparelControls.lightingDirection.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={apparelControls.customLightingDirection}
                                onChange={(e) => updateApparelControl('customLightingDirection', e.target.value)}
                                placeholder={'e.g., a strong key light from the top left.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={apparelControls.customLightingDirection}
                                setPrompt={(v) => updateApparelControl('customLightingDirection', v)}
                                context="A custom lighting direction"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                     <OptionSelector
                        label={t('light_quality')}
                        options={LIGHT_QUALITIES_LIBRARY}
                        selectedOption={apparelControls.lightQuality}
                        onSelect={(option) => updateApparelControl('lightQuality', option)}
                        gridCols="grid-cols-2"
                    />
                    {apparelControls.lightQuality.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={apparelControls.customLightQuality}
                                onChange={(e) => updateApparelControl('customLightQuality', e.target.value)}
                                placeholder={'e.g., extremely soft, diffused light with no visible shadows.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                             <PromptOptimizer
                                prompt={apparelControls.customLightQuality}
                                setPrompt={(v) => updateApparelControl('customLightQuality', v)}
                                context="A custom light quality"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                     <OptionSelector
                        label={t('eye_catchlight')}
                        options={CATCHLIGHT_STYLES_LIBRARY}
                        selectedOption={apparelControls.catchlightStyle}
                        onSelect={(option) => updateApparelControl('catchlightStyle', option)}
                        gridCols="grid-cols-3"
                    />
                    {apparelControls.catchlightStyle.id === 'custom' && (
                        <div className="animate-fade-in -mt-4 relative">
                            <textarea
                                value={apparelControls.customCatchlightStyle}
                                onChange={(e) => updateApparelControl('customCatchlightStyle', e.target.value)}
                                placeholder={'e.g., a large, square softbox catchlight.'}
                                rows={2}
                                className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                            <PromptOptimizer
                                prompt={apparelControls.customCatchlightStyle}
                                setPrompt={(v) => updateApparelControl('customCatchlightStyle', v)}
                                context="A custom eye catchlight style"
                                className="absolute bottom-2 right-2"
                            />
                        </div>
                    )}
                </div>
            </SettingSection>

            <SettingSection title={t('advanced_prompting')} icon={<Type size={18}/>}>
                <div className="pt-4 space-y-6">
                    <div className="relative">
                        <label htmlFor="negative-prompt" className="text-sm font-semibold text-zinc-300">{t('negative_prompt')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('negative_prompt_desc')}</p>
                        <textarea
                            id="negative-prompt"
                            value={apparelControls.negativePrompt}
                            onChange={(e) => updateApparelControl('negativePrompt', e.target.value)}
                            placeholder={t('negative_prompt_placeholder')}
                            rows={3}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                        <PromptOptimizer
                            prompt={apparelControls.negativePrompt}
                            setPrompt={(v) => updateApparelControl('negativePrompt', v)}
                            context="A negative prompt to avoid elements in an image"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                
                    <div className="relative">
                        <label htmlFor="custom-prompt" className="text-sm font-semibold text-zinc-300">{t('custom_prompt_override')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">
                            {t('custom_prompt_desc')}
                        </p>
                        <textarea
                            id="custom-prompt"
                            value={apparelControls.customPrompt}
                            onChange={(e) => updateApparelControl('customPrompt', e.target.value)}
                            placeholder={t('custom_prompt_placeholder')}
                            rows={5}
                            className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                         <PromptOptimizer
                            prompt={apparelControls.customPrompt}
                            setPrompt={(v) => updateApparelControl('customPrompt', v)}
                            context="A detailed, overriding photoshoot prompt"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                </div>
            </SettingSection>
        </div>
    );
};