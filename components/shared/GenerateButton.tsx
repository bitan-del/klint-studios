
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { PLAN_DETAILS } from '../../services/permissionsService';
import { ECOMMERCE_PACKS } from '../../constants';

export const GenerateButton: React.FC = () => {
  const { 
    generateAsset, 
    isGenerating, 
    uploadedModelImage, 
    selectedModels, 
    apparel, 
    ecommercePack,
    isSocialMediaPack,
    promptedModelDescription,
    studioMode,
    productImage,
    mockupImage,
    designImage,
    reimagineSourcePhoto,
    newModelPhoto,
    reimagineControls,
    t
  } = useStudio();
  const { user, incrementGenerationsUsed } = useAuth();

  const isLimitReached = user ? user.generationsUsed >= PLAN_DETAILS[user.plan].generations : false;
  
  const canGenerateApparel = (!!uploadedModelImage || selectedModels.length > 0 || !!promptedModelDescription.trim()) && apparel.length > 0;
  const canGenerateProduct = !!productImage;
  const canGenerateDesign = !!mockupImage && !!designImage;
  const canGenerateReimagine = !!reimagineSourcePhoto && (!!reimagineControls.newModelDescription.trim() || !!reimagineControls.newBackgroundDescription.trim() || !!newModelPhoto);


  const getCanGenerate = () => {
    switch(studioMode) {
      case 'apparel': return canGenerateApparel;
      case 'product': return canGenerateProduct;
      case 'design': return canGenerateDesign;
      case 'reimagine': return canGenerateReimagine;
      default: return false;
    }
  };

  const canGenerate = getCanGenerate() && !isGenerating && !isLimitReached;

  const getButtonText = () => {
    if (isLimitReached) return t('limit_reached');
    if (isGenerating) return t('generating');
    if (studioMode === 'apparel') {
        if (isSocialMediaPack) return t('generate_social_pack');
        if (ecommercePack !== 'none') return `${t('generate')} ${ECOMMERCE_PACKS[ecommercePack].name}`;
        if (selectedModels.length > 1) return `${t('generate')} (${selectedModels.length})`;
    }
    if (studioMode === 'reimagine') return t('reimagine');
    return t('generate');
  };

  const handleGenerate = () => {
    generateAsset(user, incrementGenerationsUsed);
  };

  const Icon = Sparkles;

  return (
    <button 
      onClick={handleGenerate}
      disabled={!canGenerate}
      title={isLimitReached && user ? `You have used all ${PLAN_DETAILS[user.plan].generations} generations for this month.` : ''}
      className="relative bg-brand-primary disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:px-5 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 shadow-button-glow hover:shadow-button-glow-hover hover:bg-brand-primary-hover hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:shadow-none border border-emerald-400/50 hover:border-emerald-300"
    >
      <Icon size={16}/>
      <span className="hidden sm:inline">{getButtonText()}</span>
      <span className="sm:hidden">{isGenerating ? '...' : `Go`}</span>
    </button>
  );
};
