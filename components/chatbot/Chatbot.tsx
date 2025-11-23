import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { Bot, X, Send, Sparkles, Image as ImageIcon, XCircle, Download, Video, Lock } from 'lucide-react';
import { PromptOptimizer } from '../shared/PromptOptimizer';
import { ChatMessage } from '../../types';

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const isChason = message.role === 'chason' || message.role === 'assistant' || message.role === 'model'; // Handle all bot roles

    const { setStudioMode } = useStudio();

    const renderMessage = (text: string) => {
        // Regex for [Link Text](action:mode)
        const parts = text.split(/(\[[^\]]+\]\(action:[a-z]+\))/g);
        return parts.map((part, index) => {
            const match = part.match(/\[([^\]]+)\]\(action:([a-z]+)\)/);
            if (match) {
                const [_, label, mode] = match;
                return (
                    <button
                        key={index}
                        onClick={() => {
                            console.log(`Navigating to ${mode}`);
                            setStudioMode(mode as any);
                        }}
                        className="text-emerald-300 underline hover:text-emerald-200 font-bold cursor-pointer inline-block mx-1"
                    >
                        {label}
                    </button>
                );
            }
            return part;
        });
    };

    return (
        <div className={`flex items-start gap-3 ${isChason ? '' : 'justify-end'}`}>
            {isChason && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="text-white text-xs font-bold">C</span>
                </div>
            )}
            <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 ${isChason ? 'bg-emerald-800 border border-emerald-700 text-emerald-50 rounded-tl-none shadow-sm' : 'bg-emerald-500 text-white rounded-br-none shadow-md'}`}>
                {message.images && message.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {message.images.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                                {img.startsWith('data:video') || img.endsWith('.mp4') ? (
                                    <video src={img} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {message.generatedImage && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-emerald-500/50 relative group">
                        <img src={message.generatedImage} alt="Generated" className="w-full h-auto max-h-64 object-contain" />
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = message.generatedImage!;
                                link.download = `klint-generated-${Date.now()}.png`;
                                link.click();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Download image"
                        >
                            <Download size={16} className="text-white" />
                        </button>
                    </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-100">{renderMessage(message.text)}</p>
            </div>
        </div>
    );
};

export const Chatbot: React.FC = () => {
    const { isChatbotOpen, toggleChatbot, chatHistory, askChatbot, isBotReplying, t, addReferenceImages, resetChat, studioMode, setChatbotOpen } = useStudio();
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isBotReplying]);

    // Auto-open logic for Chason mode
    useEffect(() => {
        if (studioMode === 'chason') {
            setChatbotOpen(true);
        }
    }, [studioMode, setChatbotOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log('📸 [CHASON] File select triggered, files:', files?.length || 0);

        if (files && files.length > 0) {
            const fileArray = Array.from(files as File[]);

            const loadPromises = fileArray.map((file) => {
                return new Promise<{ url: string, type: 'image' | 'video' }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            const type = file.type.startsWith('video/') ? 'video' : 'image';
                            resolve({ url: reader.result as string, type });
                        } else {
                            reject(new Error(`Failed to load ${file.name}`));
                        }
                    };
                    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(loadPromises)
                .then((loadedFiles) => {
                    setSelectedFiles(prev => [...prev, ...loadedFiles]);
                })
                .catch((error) => {
                    console.error('❌ [CHASON] Error loading files:', error);
                });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() || selectedFiles.length > 0) {
            // Extract URLs for API
            const fileUrls = selectedFiles.map(f => f.url);

            // Store reference images in sharedStore if needed (legacy support)
            if (fileUrls.length > 0 && addReferenceImages) {
                addReferenceImages(fileUrls);
            }

            // Send message with files
            askChatbot(input, fileUrls);
            setInput('');
            setSelectedFiles([]);
        }
    };

    return (
        <>
            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => {
                        if (!user || user.plan === 'free') {
                            // Trigger upgrade/login flow via FeatureLockOverlay logic (which listens to user state)
                            // Since FeatureLockOverlay is global, we might need a way to trigger it explicitly if it's not already showing.
                            // But for now, let's just toggle. If they are restricted, the overlay should catch them on other actions,
                            // or we can show a tooltip here.
                            // Better yet, let's just toggle. If we want to restrict, we should do it inside the chat or prevent opening.
                            // User asked: "chason sould be available to user who login only and not to free users"
                            // So if restricted, maybe don't even open, just show alert or trigger overlay?
                            // Let's assume FeatureLockOverlay handles global locks.
                            // But here we want to lock specifically this feature.
                            // Let's use a local check.
                        }
                        toggleChatbot();
                    }}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fab-pop-in
                    ${isChatbotOpen ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'}
                    ${(!user || user.plan === 'free') ? 'opacity-80 grayscale' : ''}`}
                    aria-label={isChatbotOpen ? 'Close Chason' : 'Open Chason'}
                >
                    {!isChatbotOpen && <div className="absolute inset-0 rounded-full animate-pulse-slow bg-white/20" />}
                    {isChatbotOpen ? <X size={32} /> :
                        (!user || user.plan === 'free') ? <Lock size={24} /> : <Sparkles size={32} />
                    }
                </button>
            </div>

            {/* Chat Window */}
            {isChatbotOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[600px] flex flex-col bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 animate-chat-slide-up overflow-hidden">
                    {(!user || user.plan === 'free') ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                                <Lock size={32} className="text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Chason is Locked</h3>
                            <p className="text-zinc-400 text-sm">
                                {!user ? "Please login to access Chason AI Assistant." : "Upgrade to a paid plan to unlock Chason AI Assistant."}
                            </p>
                            {/* We rely on the global FeatureLockOverlay or user navigation to handle login/upgrade */}
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <span className="text-white text-xs font-bold">C</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white leading-none">Chason</h3>
                                        <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Design AGI</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {chatHistory.length > 1 && (
                                        <button
                                            onClick={resetChat}
                                            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                                            title="Reset chat"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    )}
                                    <button onClick={toggleChatbot} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-grow p-4 space-y-5 overflow-y-auto chatbot-scrollbar bg-zinc-950/30">
                                {chatHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                                        <Sparkles size={48} className="text-emerald-500 mb-4 opacity-50" />
                                        <p className="text-zinc-400 text-sm">
                                            Hi! I'm Chason. I can help you create storylines, break down videos, or refine your prompts. What are we making today?
                                        </p>
                                    </div>
                                )}
                                {chatHistory.map((msg, index) => (
                                    <ChatMessageComponent key={index} message={msg} />
                                ))}
                                {isBotReplying && (
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <span className="text-white text-xs font-bold">C</span>
                                        </div>
                                        <div className="max-w-xs md:max-w-sm rounded-2xl px-4 py-3 bg-emerald-950 border border-emerald-900 rounded-tl-none flex items-center gap-2 shadow-sm">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="flex-shrink-0 p-4 border-t border-white/10 bg-zinc-900/50">
                                {/* Selected Files Preview */}
                                {selectedFiles.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/50 group bg-zinc-800">
                                                {file.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Video size={16} className="text-zinc-400" />
                                                    </div>
                                                ) : (
                                                    <img src={file.url} alt={`Selected ${idx + 1}`} className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <XCircle size={16} className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask Chason..."
                                        className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-full py-3 pl-4 pr-32 text-sm text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/mp4,video/quicktime"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="chat-file-upload"
                                    />
                                    <label
                                        htmlFor="chat-file-upload"
                                        className="absolute right-20 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-full transition-colors cursor-pointer z-10"
                                        aria-label="Upload files"
                                    >
                                        <ImageIcon size={18} />
                                    </label>
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        <PromptOptimizer
                                            prompt={input}
                                            setPrompt={setInput}
                                            context="General chatbot conversation"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
                                        disabled={(!input.trim() && selectedFiles.length === 0) || isBotReplying}
                                        aria-label="Send message"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};