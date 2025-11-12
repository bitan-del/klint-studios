import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Bot, X, Send, Sparkles, Image as ImageIcon, XCircle, Download } from 'lucide-react';
import { PromptOptimizer } from '../shared/PromptOptimizer';
import { ChatMessage } from '../../types';

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'justify-end'}`}>
            {isModel && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Bot size={18} className="text-emerald-300" />
                </div>
            )}
            <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 ${isModel ? 'bg-zinc-700 rounded-tl-none' : 'bg-emerald-600 text-white rounded-br-none'}`}>
                {message.images && message.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {message.images.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                                <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

export const Chatbot: React.FC = () => {
    const { isChatbotOpen, toggleChatbot, chatHistory, askChatbot, isBotReplying, t, addReferenceImages, resetChat } = useStudio();
    const [input, setInput] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isBotReplying]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log('📸 [CHATBOT] Image select triggered, files:', files?.length || 0);
        
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            console.log('📸 [CHATBOT] Processing', fileArray.length, 'files');
            
            const loadPromises = fileArray.map((file) => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            console.log('✅ [CHATBOT] Image loaded:', file.name);
                            resolve(reader.result as string);
                        } else {
                            console.error('❌ [CHATBOT] No result for:', file.name);
                            reject(new Error(`Failed to load ${file.name}`));
                        }
                    };
                    reader.onerror = () => {
                        console.error('❌ [CHATBOT] Read error for:', file.name);
                        reject(new Error(`Failed to read ${file.name}`));
                    };
                    reader.readAsDataURL(file);
                });
            });
            
            Promise.all(loadPromises)
                .then((loadedImages) => {
                    console.log('✅ [CHATBOT] All images loaded:', loadedImages.length);
                    setSelectedImages(prev => {
                        const updated = [...prev, ...loadedImages];
                        console.log('📸 [CHATBOT] Total selected images:', updated.length);
                        return updated;
                    });
                })
                .catch((error) => {
                    console.error('❌ [CHATBOT] Error loading images:', error);
                    // Still add successfully loaded images
                    Promise.allSettled(loadPromises)
                        .then((results) => {
                            const successful = results
                                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
                                .map(r => r.value);
                            console.log('✅ [CHATBOT] Successfully loaded:', successful.length, 'images');
                            if (successful.length > 0) {
                                setSelectedImages(prev => [...prev, ...successful]);
                            }
                        });
                });
        } else {
            console.warn('⚠️ [CHATBOT] No files selected');
        }
        // Reset input to allow selecting same files again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() || selectedImages.length > 0) {
            // Store reference images in sharedStore for Photoshoot component
            if (selectedImages.length > 0 && addReferenceImages) {
                addReferenceImages(selectedImages);
            }
            // Send message with images
            askChatbot(input, selectedImages);
            setInput('');
            setSelectedImages([]);
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
                    <div className="flex-grow p-4 space-y-5 overflow-y-auto chatbot-scrollbar">
                        {chatHistory.map((msg, index) => (
                            <ChatMessageComponent key={index} message={msg} />
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
                        {/* Selected Images Preview */}
                        {selectedImages.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/50 group">
                                        <img src={img} alt={`Selected ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
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
                                placeholder={t('ask_a_question')}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-3 pl-4 pr-32 text-sm text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                onClick={(e) => {
                                    console.log('📸 [CHATBOT] File input clicked');
                                }}
                                className="hidden"
                                id="chat-image-upload"
                            />
                            <label
                                htmlFor="chat-image-upload"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('📸 [CHATBOT] Image button clicked');
                                    fileInputRef.current?.click();
                                }}
                                className="absolute right-20 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-full transition-colors cursor-pointer z-10"
                                aria-label="Upload images"
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors disabled:bg-zinc-600"
                                disabled={(!input.trim() && selectedImages.length === 0) || isBotReplying}
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