import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ChatBubbleProps {
    message: string;
    isUser?: boolean;
    delay?: number;
    onAction?: (action: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser = false, delay = 0, onAction }) => {
    // Helper to parse links like [Label](action:mode)
    const renderMessage = (text: string) => {
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, index) => {
            const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const [_, label, url] = match;
                if (url.startsWith('action:')) {
                    const action = url.replace('action:', '');
                    return (
                        <button
                            key={index}
                            onClick={() => onAction?.(action)}
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium transition-colors mx-1"
                        >
                            {label}
                        </button>
                    );
                }
                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 underline transition-colors mx-1"
                    >
                        {label}
                    </a>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div className={`flex max-w-[80%] md:max-w-[60%] items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <Sparkles size={14} className="text-white" />
                    </div>
                )}

                <div
                    className={`p-4 rounded-2xl text-base leading-relaxed shadow-sm ${isUser
                        ? 'bg-zinc-800 text-white rounded-br-none border border-zinc-700'
                        : 'bg-white/5 text-zinc-100 rounded-bl-none border border-white/10 backdrop-blur-sm'
                        }`}
                >
                    {renderMessage(message)}
                </div>
            </div>
        </motion.div>
    );
};
