import React from 'react';
import { Camera, Palette, X, Image, Package, Brush, Lock } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { AspectRatioSelector } from '../shared/AspectRatioSelector';
import { OptionSelector } from '../shared/OptionSelector';
import { IMAGE_COUNT_OPTIONS } from '../../constants';
import { SettingSection } from '../settings/SettingSection';
import { DesignPlacementPanel } from './DesignPlacementPanel';
import { MockupStylePanel } from './MockupStylePanel';
import { MockupPhotographyPanel } from './MockupPhotographyPanel';
import { MockupPackSwitcher } from './MockupPackSwitcher';
import { ColorwayGeneratorPanel } from './ColorwayGeneratorPanel';
import { DesignSceneSelector } from './DesignSceneSelector';

interface DesignSettingsPanelProps {
    onClose: () => void;
}

export const DesignSettingsPanel: React.FC<DesignSettingsPanelProps> = ({ onClose }) => {
    const { 
        numberOfImages, 
        setNumberOfImages,
        designPlacementControls,
        backDesignImage,
        t,
    } = useStudio();
    const { user } = useAuth();
    
    const isFreePlan = user?.plan === 'free';
    const selectedImageCount = IMAGE_COUNT_OPTIONS.find(o => o.name === String(numberOfImages)) || IMAGE_COUNT_OPTIONS[0];
    const isPackMode = designPlacementControls.isMockupPackActive;
    const packImageCount = backDesignImage ? 4 : 3;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-100">{t('design_settings')}</h2>
                <button onClick={onClose} className="p-1 -m-1 text-zinc-400 hover:text-white lg:hidden">
                    <X size={24} />
                </button>
            </div>
            
            <div className={`flex-grow min-h-0 overflow-y-auto p-4 space-y-2 relative ${isFreePlan ? 'opacity-50' : ''}`}>
                {isFreePlan && (
                    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-50">
                        <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-6 max-w-xs">
                            <Lock size={40} className="text-emerald-400 mx-auto mb-3" />
                            <p className="text-zinc-100 font-bold text-lg mb-2">Design Mode Locked</p>
                            <p className="text-zinc-400 text-sm">Upgrade to unlock mockup creation & design placement</p>
                        </div>
                    </div>
                )}
                <SettingSection id="settings-panel-output" title={t('output')} icon={<Camera size={18} />} defaultOpen>
                    <div className="space-y-6 pt-4">
                        <AspectRatioSelector />
                        <div className="relative">
                            <fieldset disabled={isPackMode}>
                                 <OptionSelector
                                    label={t('images')}
                                    options={IMAGE_COUNT_OPTIONS}
                                    selectedOption={selectedImageCount}
                                    onSelect={(option) => setNumberOfImages(parseInt(option.name, 10))}
                                    gridCols="grid-cols-3"
                                />
                            </fieldset>
                            {isPackMode && (
                                <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4">
                                    <p className="text-sm text-zinc-300 font-medium">Pack generates {packImageCount} images.</p>
                                </div>
                            )}
                        </div>
                        <MockupPackSwitcher />
                    </div>
                </SettingSection>

                <SettingSection id="settings-panel-batch" title={t('batch_tools')} icon={<Palette size={18} />}>
                    <div className="pt-4"><ColorwayGeneratorPanel /></div>
                </SettingSection>

                <SettingSection id="settings-panel-material" title={t('material_engine')} icon={<Package size={18} />} defaultOpen>
                    <div className="pt-4"><MockupStylePanel /></div>
                </SettingSection>
                
                 <div className="relative">
                    <fieldset disabled={isPackMode}>
                        <SettingSection id="settings-panel-photoshoot" title={t('virtual_photoshoot')} icon={<Image size={18} />}>
                           <div className="pt-4"><MockupPhotographyPanel /></div>
                        </SettingSection>
                    </fieldset>
                    {isPackMode && (
                        <div className="absolute inset-0 top-0 bg-zinc-900/70 backdrop-blur-[2px] rounded-lg flex items-center justify-center text-center p-4 z-10">
                            <p className="text-sm text-zinc-300 font-medium">Angles & lighting are set by the pack.</p>
                        </div>
                    )}
                </div>

                <SettingSection id="settings-panel-placement" title={t('design_placement')} icon={<Brush size={18} />}>
                    <div className="pt-4"><DesignPlacementPanel /></div>
                </SettingSection>
                
                <SettingSection id="settings-panel-scene" title={t('scene_style')} icon={<Palette size={18} />}>
                    <div className="pt-4">
                        <DesignSceneSelector />
                    </div>
                </SettingSection>
            </div>
        </div>
    );
};