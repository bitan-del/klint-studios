import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { PromptOptimizer } from '../shared/PromptOptimizer';

const ChatMessage: React.FC<{ message: { role: 'user' | 'model', text: string } }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'justify-end'}`}>
            {isModel && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Bot size={18} className="text-emerald-300" />
                </div>
            )}
            <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 ${isModel ? 'bg-zinc-700 rounded-tl-none' : 'bg-emerald-600 text-white rounded-br-none'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

export const Chatbot: React.FC = () => {
    const { isChatbotOpen, toggleChatbot, chatHistory, askChatbot, isBotReplying, t } = useStudio();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isBotReplying]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            askChatbot(input);
            setInput('');
        }
    };

    return (
        <>
            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={toggleChatbot}
                    className="relative w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/50 hover:shadow-xl hover:shadow-emerald-900/60 transition-all duration-300 transform hover:-translate-y-1 animate-fab-pop-in"
                    aria-label={isChatbotOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                >
                    <div className="absolute inset-0 rounded-full animate-pulse-slow bg-emerald-500/50" />
                    {isChatbotOpen ? <X size={32} /> : <Bot size={32} />}
                </button>
            </div>

            {/* Chat Window */}
            {isChatbotOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[600px] flex flex-col bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 animate-chat-slide-up">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Sparkles size={18} className="text-white"/>
                            </div>
                            <h3 className="font-bold text-white">{t('ai_assistant')}</h3>
                        </div>
                        <button onClick={toggleChatbot} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow p-4 space-y-5 overflow-y-auto chatbot-scrollbar">
                        {chatHistory.map((msg, index) => (
                            <ChatMessage key={index} message={msg} />
                        ))}
                        {isBotReplying && (
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                    <Bot size={18} className="text-emerald-300" />
                                </div>
                                <div className="max-w-xs md:max-w-sm rounded-2xl px-4 py-3 bg-zinc-700 rounded-tl-none flex items-center gap-2">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex-shrink-0 p-4 border-t border-white/10">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t('ask_a_question')}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-3 pl-4 pr-24 text-sm text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                <PromptOptimizer
                                    prompt={input}
                                    setPrompt={setInput}
                                    context="General chatbot conversation"
                                />
                            </div>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors disabled:bg-zinc-600"
                                disabled={!input.trim() || isBotReplying}
                                aria-label="Send message"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};