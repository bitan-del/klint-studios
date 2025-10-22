import React from 'react';
import { TextCursorInput, Sparkles, Wand2, Loader2, Lock } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { PromptOptimizer } from '../shared/PromptOptimizer';

export const ModelPrompter: React.FC = () => {
    const { promptedModelDescription, setPromptedModelDescription, generateAIModel, isGeneratingModel } = useStudio();
    const { hasPermission } = useAuth();
    const canGenerate = hasPermission('imagenGeneration');

    const handleGenerate = () => {
        if (canGenerate && promptedModelDescription.trim()) {
            generateAIModel(promptedModelDescription);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex-grow flex flex-col space-y-3 min-h-0">
                <label htmlFor="model-prompt" className="flex-shrink-0 flex items-center gap-2 text-base font-semibold text-zinc-100">
                    <TextCursorInput size={20} className="text-emerald-400" />
                    Describe a Person
                </label>
                <div className="relative flex-grow">
                    <textarea
                        id="model-prompt"
                        value={promptedModelDescription}
                        onChange={(e) => setPromptedModelDescription(e.target.value)}
                        placeholder="e.g., A professional female fashion model in her early 20s, with long, straight blonde hair, sharp cheekbones, and a confident gaze. European ethnicity."
                        className="w-full h-full p-3 pr-12 rounded-lg bg-zinc-925 text-zinc-300 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors duration-200 text-sm shadow-inner-soft resize-none"
                        aria-label="Describe the person you want to create"
                    />
                    <PromptOptimizer
                        prompt={promptedModelDescription}
                        setPrompt={setPromptedModelDescription}
                        context="Describing an AI model for a photoshoot"
                        className="absolute bottom-2 right-2"
                    />
                </div>
                <div className="flex-shrink-0 flex items-start gap-2 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                    <Sparkles size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-400">
                        <strong>Pro Tip:</strong> Be descriptive! Include details like age, gender, ethnicity, hair style & color, facial features, and build for best results.
                    </p>
                </div>
            </div>
             <div 
                className="flex-shrink-0 pt-3 border-t border-zinc-800 mt-3"
                title={!canGenerate ? 'Available on Studio and Brand plans' : ''}
            >
                 <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGeneratingModel || !promptedModelDescription.trim()}
                    className="w-full bg-brand-primary disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-lg text-base transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    {isGeneratingModel ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                    {isGeneratingModel ? 'Generating Person...' : 'Generate & Save Person'}
                    {!canGenerate && <Lock size={12} className="ml-2 text-emerald-400" />}
                </button>
                 <p className="text-xs text-zinc-500 mt-2 text-center">
                    This will generate a high-quality person and save it to "My Agency".
                </p>
            </div>
        </div>
    );
};