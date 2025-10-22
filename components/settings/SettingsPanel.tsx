import React from 'react';
import { Camera, SlidersHorizontal, Palette, X, Brush, Wand2, Save, Lock } from 'lucide-react';
import { ControlPanel } from './ControlPanel';
import { SceneSelector } from './SceneSelector';
import { useStudio } from '../../context/StudioContext';
import { PostProductionPanel } from './PostProductionPanel';
import { AspectRatioSelector } from '../shared/AspectRatioSelector';
import { OptionSelector } from '../shared/OptionSelector';
import { IMAGE_COUNT_OPTIONS } from '../../constants';
import { SettingSection } from './SettingSection';
import { EcommercePackSelector } from './EcommercePackSelector';
import { useAuth } from '../../context/AuthContext';
import { ProductControlPanel } from '../product/ProductControlPanel';
import { ProductSceneSelector } from '../product/ProductSceneSelector';
import { SocialMediaPackSwitcher } from './SocialMediaPackSwitcher';
import { DesignSettingsPanel } from '../design/DesignSettingsPanel';
import { LooksPanel } from './LooksPanel';
import { FullAssetPackSwitcher } from './FullAssetPackSwitcher';
import { ProductEcommercePackSelector } from '../product/ProductEcommercePackSelector';
import { ReimagineSettingsPanel } from '../reimagine/ReimagineSettingsPanel';
import { VideoSettingsPanel } from '../video/VideoSettingsPanel';

interface SettingsPanelProps {
    onClose: () => void;
    isMobileView?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, isMobileView }) => {
    const { 
        studioMode,
        generatedImages, 
        numberOfImages, 
        setNumberOfImages, 
        ecommercePack,
        productEcommercePack,
        isSocialMediaPack,
        isCompletePack,
        designPlacementControls,
        selectedModels,
        uploadedModelImage,
        t,
    } = useStudio();
    const { hasPermission, user } = useAuth();
    
    // Lock all creative controls for free users
    const isFreePlan = user?.plan === 'free';

    const hasGeneratedImages = generatedImages && generatedImages.length > 0;
    const selectedImageCount = IMAGE_COUNT_OPTIONS.find(o => o.name === String(numberOfImages)) || IMAGE_COUNT_OPTIONS[0];

    const canUsePostProduction = hasPermission('postProductionSuite');
    const isApparelPackActive = ecommercePack !== 'none' || isSocialMediaPack || isCompletePack;
    
    const isModelSelectedInProductMode = studioMode === 'product' && (selectedModels.length > 0 || !!uploadedModelImage);
    const isProductPackActive = studioMode === 'product' && (isModelSelectedInProductMode ? isApparelPackActive : productEcommercePack !== 'none');

    const isMockupPackActive = studioMode === 'design' && designPlacementControls.isMockupPackActive;


    const renderCreativeControls = () => {
        if (studioMode === 'apparel') {
            return (
                 <div className="relative pt-4">
                     <fieldset disabled={isApparelPackActive || isFreePlan}>
                        <ControlPanel />
                     </fieldset>
                     {isFreePlan && (
                        <div className="absolute inset-0 top-4 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-10">
                            <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-4">
                                <Lock size={32} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-zinc-300 font-semibold mb-1">Premium Feature</p>
                                <p className="text-xs text-zinc-400">Upgrade to unlock model & item styling</p>
                            </div>
                        </div>
                    )}
                     {isApparelPackActive && !isFreePlan && (
                        <div className="absolute inset-0 top-4 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                            <p className="text-sm text-zinc-300 font-medium">Poses and angles are controlled by the selected pack.</p>
                        </div>
                    )}
                </div>
            )
        }
        if (studioMode === 'product') {
            return (
                <div className="relative pt-4">
                    <fieldset disabled={isProductPackActive || isFreePlan}>
                        <ProductControlPanel />
                    </fieldset>
                    {isFreePlan && (
                        <div className="absolute inset-0 top-4 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-10">
                            <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-4">
                                <Lock size={32} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-zinc-300 font-semibold mb-1">Premium Feature</p>
                                <p className="text-xs text-zinc-400">Upgrade to unlock product styling controls</p>
                            </div>
                        </div>
                    )}
                    {isProductPackActive && !isFreePlan && (
                        <div className="absolute inset-0 top-4 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                            <p className="text-sm text-zinc-300 font-medium">Angles and lenses are controlled by the selected pack.</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderSceneSelector = () => {
        if (studioMode === 'apparel') {
            return (
                <div className="relative">
                    <div className={isFreePlan ? 'opacity-50 pointer-events-none' : ''}>
                        <SceneSelector />
                    </div>
                    {isFreePlan && (
                        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-10">
                            <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-4">
                                <Lock size={32} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-zinc-300 font-semibold mb-1">Premium Feature</p>
                                <p className="text-xs text-zinc-400">Upgrade to unlock scene styles</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        if (studioMode === 'product' || studioMode === 'design') {
            return (
                <div className="relative">
                    <div className={isFreePlan ? 'opacity-50 pointer-events-none' : ''}>
                        <ProductSceneSelector />
                    </div>
                    {isFreePlan && (
                        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-10">
                            <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-4">
                                <Lock size={32} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-zinc-300 font-semibold mb-1">Premium Feature</p>
                                <p className="text-xs text-zinc-400">Upgrade to unlock scene styles</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    }

    if (studioMode === 'design') {
        return <DesignSettingsPanel onClose={onClose} />;
    }

    if (studioMode === 'reimagine') {
        return <ReimagineSettingsPanel onClose={onClose} />;
    }
    
    if (studioMode === 'video') {
        return <VideoSettingsPanel onClose={onClose} isMobileView={isMobileView} />;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {isMobileView && (
                        <button onClick={onClose} className="p-1 -m-1 text-zinc-400 hover:text-white" aria-label="Close settings panel">
                            <X size={24} />
                        </button>
                    )}
                    <h2 className="text-lg font-bold text-zinc-100">{t('settings')}</h2>
                </div>
            </div>
            
            <div className="flex-grow min-h-0 overflow-y-auto p-4 space-y-2">
                <SettingSection 
                    id="settings-panel-output" 
                    title={t('output')}
                    icon={<Camera size={18} />} 
                    defaultOpen
                    infoTooltip={t('output_tooltip')}
                >
                    <div className="space-y-6 pt-4">
                        <div className="relative">
                             <fieldset disabled={isSocialMediaPack || isCompletePack}>
                                <AspectRatioSelector />
                             </fieldset>
                             {(isSocialMediaPack || isCompletePack) && (
                                <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                                    <p className="text-sm text-zinc-300 font-medium">Overridden by the selected Asset Pack.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative">
                            <fieldset disabled={isApparelPackActive || isProductPackActive || isMockupPackActive}>
                                <OptionSelector
                                    label={t('images')}
                                    options={IMAGE_COUNT_OPTIONS}
                                    selectedOption={selectedImageCount}
                                    onSelect={(option) => setNumberOfImages(parseInt(option.name, 10))}
                                    gridCols="grid-cols-5"
                                />
                            </fieldset>
                            {(isApparelPackActive || isProductPackActive || isMockupPackActive) && (
                                <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                                    <p className="text-sm text-zinc-300 font-medium">Determined by selected pack.</p>
                                </div>
                            )}
                        </div>
                       
                        {studioMode === 'apparel' && (
                            <div className="space-y-4">
                                <EcommercePackSelector />
                                <SocialMediaPackSwitcher />
                                <FullAssetPackSwitcher />
                            </div>
                        )}
                        {studioMode === 'product' && (
                            <div className="space-y-4">
                                {isModelSelectedInProductMode ? (
                                    <div className="space-y-4">
                                        <EcommercePackSelector />
                                        <SocialMediaPackSwitcher />
                                        <FullAssetPackSwitcher />
                                    </div>
                                ) : <ProductEcommercePackSelector />}
                            </div>
                        )}
                    </div>
                </SettingSection>

                {studioMode === 'apparel' && (
                    <SettingSection 
                        id="settings-panel-looks" 
                        title={t('looks')}
                        icon={<Save size={18} />}
                        infoTooltip={t('looks_tooltip')}
                    >
                        <div className="pt-4">
                            <LooksPanel />
                        </div>
                    </SettingSection>
                )}
                
                <SettingSection 
                    id="settings-panel-creative" 
                    title={t('creative_controls')}
                    icon={<SlidersHorizontal size={18} />} 
                    defaultOpen={studioMode === 'product'}
                    infoTooltip={t('creative_controls_tooltip')}
                >
                    {renderCreativeControls()}
                </SettingSection>
                
                <SettingSection 
                    id="settings-panel-scene" 
                    title={t('scene_style')}
                    icon={<Palette size={18} />}
                    infoTooltip={t('scene_style_tooltip')}
                >
                    <div className="pt-4">
                        {renderSceneSelector()}
                    </div>
                </SettingSection>

                {hasGeneratedImages && canUsePostProduction && (
                    <SettingSection 
                        title={t('post_production')}
                        icon={<Wand2 size={18} />}
                        infoTooltip={t('post_production_tooltip')}
                    >
                        <div className="pt-4">
                            <PostProductionPanel />
                        </div>
                    </SettingSection>
                )}
            </div>
        </div>
    );
};