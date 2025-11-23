import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Image as ImageIcon, Tag, MessageCircle } from 'lucide-react';

interface ImageWithLabel {
    src: string;
    label?: string;
}

interface ChatMessage {
    role: 'user' | 'chason';
    content: string;
    images?: ImageWithLabel[];
    timestamp: Date;
}

interface ChasonChatInputProps {
    onSendMessage: (message: string, images?: ImageWithLabel[]) => void;
    isProcessing?: boolean;
    placeholder?: string;
    chatHistory?: ChatMessage[];
}

export const ChasonChatInput: React.FC<ChasonChatInputProps> = ({
    onSendMessage,
    isProcessing = false,
    placeholder = "Tell Chason what you want to add or change...",
    chatHistory = []
}) => {
    const [input, setInput] = useState('');
    const [attachedImages, setAttachedImages] = useState<ImageWithLabel[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isOpen]);

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const f = file as File;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    setAttachedImages(prev => [...prev, { src: result, label: '' }]);
                };
                reader.readAsDataURL(f);
            });
        }
    };

    const removeImage = (index: number) => {
        setAttachedImages(prev => prev.filter((_, idx) => idx !== index));
    };

    const updateImageLabel = (index: number, label: string) => {
        setAttachedImages(prev => prev.map((img, idx) =>
            idx === index ? { ...img, label } : img
        ));
    };

    const handleSend = () => {
        if (input.trim() || attachedImages.length > 0) {
            onSendMessage(input, attachedImages);
            setInput('');
            setAttachedImages([]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Chat Bubble */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">C</span>
                            </div>
                            <span className="font-semibold text-white">Chason</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-zinc-400" />
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {/* Initial Greeting */}
                        {chatHistory.length === 0 && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">C</span>
                                </div>
                                <div className="bg-zinc-800/50 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[280px]">
                                    <p className="text-sm text-zinc-300">
                                        👋 Hi! I'm Chason, your Design AGI. I'm here to help you create amazing visuals. What would you like to design today?
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {chatHistory.map((message, idx) => (
                            <div key={idx} className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {message.role === 'chason' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm font-bold">C</span>
                                    </div>
                                )}
                                <div className={`rounded-2xl px-4 py-2.5 max-w-[280px] ${message.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                                    : 'bg-zinc-800/50 text-zinc-300 rounded-tl-sm'
                                    }`}>
                                    {message.images && message.images.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            {message.images.map((img, imgIdx) => (
                                                <div key={imgIdx} className="relative">
                                                    <img
                                                        src={img.src}
                                                        alt={`Uploaded ${imgIdx + 1}`}
                                                        className="rounded-lg w-full h-20 object-cover"
                                                    />
                                                    {img.label && (
                                                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                            {img.label}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {message.content && (
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-zinc-800">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />

                        {/* Image previews with labels */}
                        {attachedImages.length > 0 && (
                            <div className="mb-3 space-y-2">
                                <div className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Tag size={12} />
                                    Label your images
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {attachedImages.map((img, idx) => (
                                        <div key={idx} className="relative bg-zinc-800/50 rounded-lg p-2 border border-zinc-700">
                                            <div className="relative w-full h-20 rounded-lg overflow-hidden mb-1 group">
                                                <img src={img.src} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {['Dress', 'Jewelry', 'Earrings', 'Shoes'].map((tag) => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => updateImageLabel(idx, tag)}
                                                            className={`px-1.5 py-0.5 text-xs rounded transition-colors ${img.label === tag
                                                                ? 'bg-emerald-500 text-white'
                                                                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                                                }`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={img.label || ''}
                                                    onChange={(e) => updateImageLabel(idx, e.target.value)}
                                                    placeholder="Custom label..."
                                                    className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input controls */}
                        <div className="flex gap-2 items-end">
                            <button
                                onClick={handleImageUpload}
                                disabled={isProcessing}
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="Upload images"
                            >
                                <ImageIcon size={16} />
                            </button>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={placeholder}
                                disabled={isProcessing}
                                className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={1}
                                style={{ minHeight: '36px', maxHeight: '80px' }}
                            />

                            <button
                                onClick={handleSend}
                                disabled={isProcessing || (!input.trim() && attachedImages.length === 0)}
                                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="Send message"
                            >
                                <Send size={16} />
                            </button>
                        </div>

                        {isProcessing && (
                            <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Chason is thinking...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
                title="Chat with Chason"
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <MessageCircle size={24} className="text-white" />
                )}
            </button>
        </>
    );
};
