import React from 'react';
import { Camera, X, Users, Image as ImageIcon, Type, Lock } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { AspectRatioSelector } from '../shared/AspectRatioSelector';
import { OptionSelector } from '../shared/OptionSelector';
import { IMAGE_COUNT_OPTIONS } from '../../constants';
import { SettingSection } from '../settings/SettingSection';

interface ReimagineSettingsPanelProps {
    onClose: () => void;
}

export const ReimagineSettingsPanel: React.FC<ReimagineSettingsPanelProps> = ({ onClose }) => {
    const { 
        numberOfImages, 
        setNumberOfImages,
        reimagineControls,
        updateReimagineControl,
        t
    } = useStudio();
    const { user } = useAuth();
    
    const isFreePlan = user?.plan === 'free';
    const selectedImageCount = IMAGE_COUNT_OPTIONS.find(o => o.name === String(numberOfImages)) || IMAGE_COUNT_OPTIONS[0];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-100">{t('reimagine_settings')}</h2>
                <button onClick={onClose} className="p-1 -m-1 text-zinc-400 hover:text-white lg:hidden">
                    <X size={24} />
                </button>
            </div>
            
            <div className={`flex-grow min-h-0 overflow-y-auto p-4 space-y-2 relative ${isFreePlan ? 'opacity-50' : ''}`}>
                {isFreePlan && (
                    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-center p-4 z-50">
                        <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-6 max-w-xs">
                            <Lock size={40} className="text-emerald-400 mx-auto mb-3" />
                            <p className="text-zinc-100 font-bold text-lg mb-2">Photo Editor Locked</p>
                            <p className="text-zinc-400 text-sm">Upgrade to unlock AI-powered photo editing</p>
                        </div>
                    </div>
                )}
                <SettingSection id="reimagine-settings-prompts" title={t('swap_controls')} icon={<Users size={18} />} defaultOpen>
                    <div className="space-y-6 pt-4">
                        <div>
                            <label htmlFor="new-model-prompt" className="text-sm font-semibold text-zinc-300">{t('new_model_desc')}</label>
                            <p className="text-xs text-zinc-400 mt-1 mb-2">{t('new_model_desc_desc')}</p>
                            <textarea
                                id="new-model-prompt"
                                value={reimagineControls.newModelDescription}
                                onChange={(e) => updateReimagineControl('newModelDescription', e.target.value)}
                                placeholder={t('new_model_desc_placeholder')}
                                rows={4}
                                className="w-full p-2.5 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-bg-prompt" className="text-sm font-semibold text-zinc-300">{t('new_bg_desc')}</label>
                            <p className="text-xs text-zinc-400 mt-1 mb-2">{t('new_bg_desc_desc')}</p>
                            <textarea
                                id="new-bg-prompt"
                                value={reimagineControls.newBackgroundDescription}
                                onChange={(e) => updateReimagineControl('newBackgroundDescription', e.target.value)}
                                placeholder={t('new_bg_desc_placeholder')}
                                rows={4}
                                className="w-full p-2.5 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                            />
                        </div>
                    </div>
                </SettingSection>

                <SettingSection id="reimagine-settings-output" title={t('output')} icon={<Camera size={18} />}>
                    <div className="space-y-6 pt-4">
                        <AspectRatioSelector />
                        <OptionSelector
                            label={t('images')}
                            options={IMAGE_COUNT_OPTIONS}
                            selectedOption={selectedImageCount}
                            onSelect={(option) => setNumberOfImages(parseInt(option.name, 10))}
                            gridCols="grid-cols-3"
                        />
                    </div>
                </SettingSection>

                 <SettingSection title={t('advanced_prompting')} icon={<Type size={18}/>}>
                    <div className="pt-4">
                        <label htmlFor="negative-prompt" className="text-sm font-semibold text-zinc-300">{t('negative_prompt')}</label>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">{t('negative_prompt_desc')}</p>
                        <textarea
                            id="negative-prompt"
                            value={reimagineControls.negativePrompt}
                            onChange={(e) => updateReimagineControl('negativePrompt', e.target.value)}
                            placeholder={t('negative_prompt_placeholder')}
                            rows={3}
                            className="w-full p-2.5 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        />
                    </div>
                </SettingSection>
            </div>
        </div>
    );
};