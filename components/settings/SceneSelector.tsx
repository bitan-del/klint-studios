import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Trash2, CheckCircle2, UploadCloud, Loader2, Layers, Wind, Sparkles, Wand2, Lock } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { BACKGROUNDS_LIBRARY, LIGHTING_PRESETS, TIME_OF_DAY_OPTIONS } from '../../constants';
import type { Background, Lighting } from '../../types';
import { OptionSelector } from '../shared/OptionSelector';
import { useAuth } from '../../context/AuthContext';
import { PromptOptimizer } from '../shared/PromptOptimizer';

const AIGeneratedBackground: React.FC = () => {
    const { generateAIBackground, isGeneratingBackground, t } = useStudio();
    const { hasPermission } = useAuth();
    const [prompt, setPrompt] = useState('');
    const canGenerate = hasPermission('imagenGeneration');

    const handleGenerate = () => {
        if (canGenerate && prompt.trim()) {
            generateAIBackground(prompt);
        }
    };

    return (
        <div 
            className="p-3 rounded-lg bg-zinc-800/50 border border-white/10 space-y-3 relative"
            title={!canGenerate ? 'Available on Studio and Brand plans' : ''}
        >
             <fieldset disabled={!canGenerate} className={`${!canGenerate ? 'opacity-50' : ''}`}>
                <label className="font-semibold text-zinc-100 flex items-center gap-2">
                    <Wand2 size={18} /> {t('ai_bg_generator')}
                    {!canGenerate && <Lock size={12} className="inline-block ml-1.5 text-emerald-400" />}
                </label>
                <p className="text-xs text-zinc-400 mt-1 mb-3">
                    {t('ai_bg_generator_desc')}
                </p>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('ai_bg_generator_placeholder')}
                        rows={3}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={prompt}
                        setPrompt={setPrompt}
                        context="An AI-generated background scene"
                        className="absolute bottom-2 right-2"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGeneratingBackground || !prompt.trim()}
                    className="w-full bg-brand-primary disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
                >
                    {isGeneratingBackground ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isGeneratingBackground ? t('generating_background') : t('generate_background')}
                </button>
             </fieldset>
             {!canGenerate && <div className="absolute inset-0 rounded-lg cursor-not-allowed"></div>}
        </div>
    );
};

export const SceneSelector: React.FC = () => {
    const { 
        scene, 
        updateScene, 
        styleReferenceImage, 
        setStyleReferenceImage, 
        uploadedModelImage, 
        analyzeAndSetModelLighting,
        isAnalyzingLighting,
        apparelControls,
        updateApparelControl,
        t,
    } = useStudio();

    const backgroundCategories = BACKGROUNDS_LIBRARY.reduce((acc, bg) => {
        const category = bg.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(bg);
        return acc;
    }, {} as Record<string, Background[]>);

    const onCustomBackgroundDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    const customBg: Background = {
                        id: 'custom',
                        name: 'Custom Background',
                        type: 'image',
                        value: event.target.result as string,
                        category: 'Custom'
                    };
                    updateScene({ background: customBg });
                }
            };
            reader.readAsDataURL(file);
        }
    }, [updateScene]);

    const { getRootProps: getCustomBgRootProps, getInputProps: getCustomBgInputProps, isDragActive: isCustomBgDragActive } = useDropzone({
        onDrop: onCustomBackgroundDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false
    });

    const handleRemoveCustomBackground = () => {
        // Revert to a default background
        updateScene({ background: BACKGROUNDS_LIBRARY[0] });
    };


    const handleBackgroundSelect = (bg: Background) => {
        updateScene({ background: bg });
    };

    const onStyleDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    setStyleReferenceImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [setStyleReferenceImage]);

    const { getRootProps: getStyleRootProps, getInputProps: getStyleInputProps, isDragActive: isStyleDragActive } = useDropzone({
        onDrop: onStyleDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false
    });
    
    return (
        <div className="flex flex-col space-y-6">
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10 space-y-4">
                 <div className="relative">
                    <label htmlFor="scene-props" className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                        <Layers size={16} /> {t('scene_props')}
                    </label>
                    <p className="text-xs text-zinc-400 mt-1 mb-2">{t('scene_props_desc')}</p>
                    <textarea
                        id="scene-props"
                        value={scene.sceneProps}
                        onChange={(e) => updateScene({ sceneProps: e.target.value })}
                        placeholder={t('scene_props_placeholder')}
                        rows={2}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={scene.sceneProps}
                        setPrompt={(v) => updateScene({ sceneProps: v })}
                        context="Props or elements in a scene"
                        className="absolute bottom-2 right-2"
                    />
                </div>
                 <div className="relative">
                    <label htmlFor="env-effects" className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                        <Wind size={16} /> {t('environmental_effects')}
                    </label>
                    <p className="text-xs text-zinc-400 mt-1 mb-2">{t('environmental_effects_desc')}</p>
                    <textarea
                        id="env-effects"
                        value={scene.environmentalEffects}
                        onChange={(e) => updateScene({ environmentalEffects: e.target.value })}
                        placeholder={t('environmental_effects_placeholder')}
                        rows={2}
                        className="w-full p-2.5 pr-12 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                    />
                    <PromptOptimizer
                        prompt={scene.environmentalEffects}
                        setPrompt={(v) => updateScene({ environmentalEffects: v })}
                        context="Environmental or atmospheric effects"
                        className="absolute bottom-2 right-2"
                    />
                </div>
            </div>


            <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t('background')}</h3>
                 {/* Custom Background Uploader & Thumbnail */}
                 {scene.background.id === 'custom' ? (
                     <div className="relative group mb-4">
                        <div
                            className="relative h-20 rounded-lg ring-2 ring-offset-2 ring-emerald-500 ring-offset-zinc-925"
                            style={{ backgroundImage: `url(${scene.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors rounded-lg flex items-center justify-center p-2 text-center">
                                 <span className="relative z-10 bg-black/50 text-white px-2 py-1 rounded-full text-xs">{scene.background.name}</span>
                            </div>
                           
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomBackground();
                                }}
                                className="absolute top-1 right-1 bg-zinc-900/50 hover:bg-red-600/80 text-white p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
                                aria-label="Remove custom background"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                     </div>
                ) : (
                    <div {...getCustomBgRootProps()} className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors duration-200 mb-4 ${isCustomBgDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                        <input {...getCustomBgInputProps()} />
                        <UploadCloud className="text-zinc-400" size={20} />
                        <p className="text-zinc-300 text-sm font-semibold">
                            {t('upload_custom_background')}
                        </p>
                    </div>
                )}

                 <div className="mb-4">
                    <AIGeneratedBackground />
                </div>
                
                {Object.entries(backgroundCategories).map(([category, backgrounds]) => (
                     <div key={category} className="mb-4">
                        <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">{category}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {backgrounds.map(bg => {
                                const isSelected = scene.background.id === bg.id;
                                return (
                                    <div
                                        key={bg.id}
                                        onClick={() => handleBackgroundSelect(bg)}
                                        className={`relative h-20 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-center text-xs p-1 group
                                            ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-500 ring-offset-zinc-925' : 'hover:scale-105'}`}
                                        style={
                                            bg.type === 'color' ? { backgroundColor: bg.value } :
                                            bg.type === 'gradient' ? { background: bg.value } :
                                            { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                        }
                                    >
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 z-10 text-white bg-emerald-600 rounded-full shadow-lg">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors rounded-lg" />
                                        <span className="relative z-10 bg-black/50 text-white px-2 py-1 rounded-full">{bg.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t('lighting')}</h3>
                 <OptionSelector
                    label={t('time_of_day')}
                    options={TIME_OF_DAY_OPTIONS}
                    selectedOption={TIME_OF_DAY_OPTIONS.find(o => o.name === (scene.timeOfDay || 'None')) || TIME_OF_DAY_OPTIONS[0]}
                    onSelect={(option) => updateScene({ timeOfDay: option.name === 'None' ? null : option.name })}
                    gridCols="grid-cols-3"
                    className="mb-6"
                    buttonTextSize="text-xs"
                />

                <div className="relative">
                    <fieldset disabled={!!scene.timeOfDay}>
                         <h4 className="text-sm font-semibold text-zinc-300 mb-3">{t('lighting_presets')}</h4>
                        <div className="space-y-2">
                            {LIGHTING_PRESETS.map(light => {
                                const isSelected = scene.lighting.id === light.id;
                                const isDynamicAndReady = isAnalyzingLighting && light.isDynamic;
                                const isDisabled = (light.isDynamic && !uploadedModelImage) || (isAnalyzingLighting && !light.isDynamic);

                                const handleClick = () => {
                                    if (isDisabled) return;
                                    if (light.isDynamic) {
                                        analyzeAndSetModelLighting();
                                    } else {
                                        updateScene({ lighting: light });
                                    }
                                };

                                return (
                                    <button
                                        key={light.id}
                                        onClick={handleClick}
                                        disabled={isDisabled}
                                        className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200 border flex flex-col justify-center min-h-[74px]
                                        ${isSelected ? 'bg-emerald-600/20 border-emerald-500/80' : 'bg-zinc-850/80 border-white/10 hover:bg-zinc-800 hover:border-white/20'}
                                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                                            {isDynamicAndReady ? <Loader2 size={16} className="animate-spin" /> : null}
                                            {light.name}
                                        </h4>
                                        <p className="text-sm text-zinc-400">
                                            {light.isDynamic && !uploadedModelImage 
                                                ? "Upload a model image to enable." 
                                                : light.description}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </fieldset>
                     {!!scene.timeOfDay && (
                        <div className="absolute inset-0 bg-zinc-925/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                            <p className="text-sm text-zinc-300 font-medium">Overridden by Time of Day selection.</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">{t('style_reference')}</h3>
                <p className="text-xs text-zinc-400 mb-3">{t('style_reference_desc')}</p>
                {styleReferenceImage ? (
                     <div className="relative group w-full">
                        <img src={styleReferenceImage} alt="Style reference preview" className="w-full object-contain rounded-lg border border-white/10" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <button 
                                onClick={() => setStyleReferenceImage(null)}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Remove
                            </button>
                        </div>
                     </div>
                ) : (
                    <div {...getStyleRootProps()} className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors duration-200 ${isStyleDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                        <input {...getStyleInputProps()} />
                        <ImageIcon className="text-zinc-400 mb-2" size={32} />
                        <p className="text-zinc-300 text-center text-sm">
                            {isStyleDragActive ? t('drop_image_here') : t('add_style_reference')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">PNG or JPG</p>
                    </div>
                )}
                {styleReferenceImage && (
                    <div className="space-y-2 mt-4 p-3 rounded-lg bg-zinc-800/50 border border-white/10">
                        <div className="flex justify-between items-center">
                            <label htmlFor="style-strength" className="text-sm font-medium text-zinc-300">{t('style_strength')}</label>
                            <span className="text-sm font-semibold text-zinc-100">{apparelControls.styleStrength}%</span>
                        </div>
                        <input 
                            id="style-strength"
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={apparelControls.styleStrength}
                            onChange={e => updateApparelControl('styleStrength', parseInt(e.target.value, 10))}
                            className="w-full"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};