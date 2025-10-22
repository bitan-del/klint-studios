
import React, { useState, useEffect } from 'react';
import { User, X, Package, Layers, ImageIcon, Sparkles, ImageUp } from 'lucide-react';
import { ModelSelectionPanel } from '../model/ModelSelectionPanel';
import { ApparelUploader } from '../apparel/ApparelUploader';
import { TabButton } from './TabButton';
import { useStudio } from '../../context/StudioContext';
import { ProductUploader } from '../product/ProductUploader';
import { PropsPanel } from '../product/PropsPanel';
import { MockupUploader } from '../design/MockupUploader';
import { DesignUploader } from '../design/DesignUploader';
import { ReimagineUploader } from '../reimagine/ReimagineUploader';
import { StudioModeSwitcher } from './StudioModeSwitcher';
import { InfoTooltip } from './InfoTooltip';

type Tab = 'model' | 'apparel' | 'product' | 'props' | 'mockup' | 'design' | 'reimagine';

interface InputPanelProps {
    onClose: () => void;
    isMobileView?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onClose, isMobileView }) => {
    const { studioMode, t } = useStudio();
    const [activeTab, setActiveTab] = useState<Tab>('model');

    useEffect(() => {
        if (studioMode === 'apparel') {
            setActiveTab('model');
        } else if (studioMode === 'product') {
            setActiveTab('product');
        } else if (studioMode === 'design') {
            setActiveTab('mockup');
        } else if (studioMode === 'reimagine') {
            setActiveTab('reimagine');
        }
    }, [studioMode]);


    const renderTabs = () => {
        switch (studioMode) {
            case 'apparel':
                return (
                    <>
                        <TabButton tabId="model" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<User size={14} />} label={t('model')}>
                            <InfoTooltip text="Upload, prompt, or select the person for your photoshoot." />
                        </TabButton>
                        <TabButton tabId="apparel" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<Layers size={14} />} label={t('clothing')}>
                             <InfoTooltip text="Upload the items you want the subject to wear or hold." />
                        </TabButton>
                    </>
                );
            case 'product':
                return (
                    <>
                        <TabButton tabId="product" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<Package size={14} />} label={t('product')}>
                            <InfoTooltip text="Upload your main product or object for the scene." />
                        </TabButton>
                        <TabButton tabId="props" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<Layers size={14} />} label={t('scene_props_tab')}>
                            <InfoTooltip text="Stage your scene by adding companion assets, props, and using the interactive canvas." />
                        </TabButton>
                        <TabButton tabId="model" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<User size={14} />} label={t('model')}>
                            <InfoTooltip text="Optionally add a person to interact with your object." />
                        </TabButton>
                    </>
                );
            case 'design':
                return (
                    <>
                        <TabButton tabId="mockup" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<ImageIcon size={14} />} label={t('mockup')}>
                             <InfoTooltip text="Upload the blank item you want to place a design on (e.g., a t-shirt)." />
                        </TabButton>
                        <TabButton tabId="design" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<Sparkles size={14} />} label={t('design')}>
                            <InfoTooltip text="Upload or generate the graphic or logo to apply to the mockup." />
                        </TabButton>
                    </>
                );
            case 'reimagine':
                return (
                     <TabButton tabId="reimagine" activeTab={activeTab} onClick={(tab) => setActiveTab(tab)} icon={<ImageUp size={14} />} label={t('source_photo')}>
                        <InfoTooltip text="Upload the starting image you want to edit or 're-imagine'." />
                     </TabButton>
                );
            default:
                return null;
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'model': return <ModelSelectionPanel />;
            case 'apparel': return <ApparelUploader />;
            case 'product': return <ProductUploader />;
            case 'props': return <PropsPanel />;
            case 'mockup': return <MockupUploader />;
            case 'design': return <DesignUploader />;
            case 'reimagine': return <ReimagineUploader />;
            default: return null;
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    {isMobileView && (
                        <button onClick={onClose} className="p-1 -m-1 text-zinc-400 hover:text-white" aria-label="Close panel">
                            <X size={24} />
                        </button>
                    )}
                    <h2 className="text-lg font-bold text-zinc-100">
                        {t('inputs')}
                    </h2>
                 </div>
            </div>
            <div className="flex-grow p-4 min-h-0 flex flex-col">
                {isMobileView && (
                    <div className="mb-4">
                        <StudioModeSwitcher />
                    </div>
                )}
                <div id="input-panel-tabs" className="flex-shrink-0 bg-zinc-900 p-1 rounded-full flex items-center gap-1 mb-3 border border-zinc-800 shadow-inner-soft">
                    {renderTabs()}
                </div>
                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};