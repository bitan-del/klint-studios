import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, ImageUp, TextCursorInput, Wand2, Loader2, Sparkles } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { PromptOptimizer } from '../shared/PromptOptimizer';

export const VideoInputPanel: React.FC = () => {
    const {
        videoPrompt,
        setVideoPrompt,
        videoSourceImage,
        setVideoSourceImage,
        isSuggestingPrompts,
        promptSuggestions,
        suggestVideoPrompts
    } = useStudio();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    setVideoSourceImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [setVideoSourceImage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false,
        onDragEnter: () => { },
        onDragOver: () => { },
        onDragLeave: () => { }
    });

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-5">
            {/* Prompt section */}
            <div className="flex-shrink-0 relative group">
                <label htmlFor="video-prompt" className="flex items-center gap-2 text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wider">
                    <TextCursorInput size={16} className="text-violet-400" />
                    Video Prompt
                </label>
                <div className="relative">
                    <textarea
                        id="video-prompt"
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="Describe your video vision... e.g., A neon hologram of a cat driving a sports car at top speed through a futuristic city"
                        rows={6}
                        className="w-full p-4 pr-12 rounded-xl bg-zinc-900/50 text-zinc-200 border border-white/10 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300 text-sm shadow-inner resize-none placeholder-zinc-600"
                        aria-label="Describe the video you want to create"
                    />
                    <div className="absolute bottom-3 right-3">
                        <PromptOptimizer
                            prompt={videoPrompt}
                            setPrompt={setVideoPrompt}
                            context="Generating a short video clip"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable container for image and suggestions */}
            <div className="flex-grow min-h-0 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                {/* Image Uploader section */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wider">
                        <ImageUp size={16} className="text-violet-400" />
                        Source Image <span className="text-zinc-500 font-normal normal-case">(Optional)</span>
                    </label>
                    {videoSourceImage ? (
                        <div className="relative group rounded-xl overflow-hidden border border-violet-500/30 shadow-lg shadow-violet-900/20 bg-zinc-900 aspect-video">
                            <img src={videoSourceImage} alt="Video source preview" className="absolute inset-0 w-full h-full object-contain bg-black/40 backdrop-blur-sm" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <button
                                    onClick={() => setVideoSourceImage(null)}
                                    className="bg-red-500/90 hover:bg-red-500 text-white p-3 rounded-full transition-all duration-200 transform scale-90 group-hover:scale-100 shadow-xl"
                                    aria-label="Remove source image"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            className={`h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 group
                                ${isDragActive
                                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]'
                                    : 'border-zinc-700/50 hover:border-violet-500/50 hover:bg-zinc-800/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className={`p-3 rounded-full mb-3 transition-transform duration-300 ${isDragActive ? 'scale-110 bg-violet-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                                <ImageUp size={24} className={isDragActive ? 'text-violet-400' : 'text-zinc-400 group-hover:text-violet-400'} />
                            </div>
                            <p className="text-zinc-300 text-center text-sm font-medium group-hover:text-white transition-colors">
                                {isDragActive ? "Drop image here" : "Click or drag image"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 text-center group-hover:text-zinc-400">Supports JPG, PNG</p>
                        </div>
                    )}
                </div>

                {/* Suggestions section */}
                {videoSourceImage && !videoPrompt.trim() && (
                    <div className="flex-shrink-0 border-t border-white/10 pt-5 animate-slide-up">
                        <button
                            onClick={suggestVideoPrompts}
                            disabled={isSuggestingPrompts}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 
                                bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 
                                text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 hover:-translate-y-0.5
                                disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
                        >
                            {isSuggestingPrompts ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isSuggestingPrompts ? 'Analyzing Image...' : 'Generate Magic Prompts'}
                        </button>

                        {promptSuggestions.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Suggested Prompts:</p>
                                {promptSuggestions.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setVideoPrompt(prompt)}
                                        className="w-full text-left p-3 text-sm rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-violet-500/30 transition-all duration-200 text-zinc-300 hover:text-white group"
                                    >
                                        <span className="line-clamp-2 group-hover:line-clamp-none transition-all">{prompt}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};