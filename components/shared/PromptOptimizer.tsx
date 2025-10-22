import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { withRetry } from '../../utils/colorUtils';

interface PromptOptimizerProps {
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  context: string;
  className?: string;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ prompt, setPrompt, context, className }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!prompt.trim() || isOptimizing) return;
    setIsOptimizing(true);
    try {
      const optimizedPrompt = await withRetry(() => geminiService.optimizePrompt(prompt, context));
      setPrompt(optimizedPrompt);
    } catch (error) {
      console.error('Failed to optimize prompt:', error);
      // Maybe show a small error toast/message in the future
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOptimize}
      disabled={isOptimizing || !prompt.trim()}
      className={`p-2 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-wait ${className}`}
      title="Optimize your input with AI"
    >
      {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
    </button>
  );
};
