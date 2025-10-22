import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, ImageUp, TextCursorInput, Wand2, Loader2 } from 'lucide-react';
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
        multiple: false
    });

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Prompt section, non-scrolling part */}
            <div className="flex-shrink-0 mb-4 relative">
                <label htmlFor="video-prompt" className="flex items-center gap-2 text-base font-semibold text-zinc-100 mb-2">
                    <TextCursorInput size={20} className="text-violet-400" />
                    Video Prompt (Optional)
                </label>
                <textarea
                    id="video-prompt"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g., A neon hologram of a cat driving a sports car at top speed through a futuristic city"
                    rows={6}
                    className="w-full p-3 pr-12 rounded-lg bg-zinc-925 text-zinc-300 border border-zinc-700 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors duration-200 text-sm shadow-inner-soft"
                    aria-label="Describe the video you want to create"
                />
                 <PromptOptimizer
                    prompt={videoPrompt}
                    setPrompt={setVideoPrompt}
                    context="Generating a short video clip"
                    className="absolute bottom-2 right-2"
                />
            </div>

            {/* Scrollable container for image and suggestions */}
            <div className="flex-grow min-h-0 overflow-y-auto space-y-4 pr-1">
                {/* Image Uploader section */}
                <div>
                    <label className="flex items-center gap-2 text-base font-semibold text-zinc-100 mb-2">
                        <ImageUp size={20} className="text-violet-400" />
                        Source Image (Optional)
                    </label>
                    {videoSourceImage ? (
                        <div className="relative group rounded-lg overflow-hidden border-2 border-violet-500/50 shadow-lg shadow-violet-900/30 bg-zinc-900 aspect-square">
                            <img src={videoSourceImage} alt="Video source preview" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <button
                                    onClick={() => setVideoSourceImage(null)}
                                    className="bg-red-600/80 hover:bg-red-500 text-white p-3 rounded-full transition-all duration-200 transform scale-75 group-hover:scale-100"
                                    aria-label="Remove source image"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div {...getRootProps()} className={`h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 ${isDragActive ? 'border-violet-500 bg-violet-500/10 shadow-glow-md' : 'border-zinc-700 hover:border-zinc-600'}`}>
                            <input {...getInputProps()} />
                            <p className="text-zinc-300 text-center text-sm font-semibold">
                                {isDragActive ? "Drop image here" : "Add source image"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 text-center">For image-to-video generation</p>
                        </div>
                    )}
                </div>

                {/* Suggestions section */}
                {videoSourceImage && !videoPrompt.trim() && (
                    <div className="flex-shrink-0 border-t border-zinc-700 pt-4">
                        <button
                            onClick={suggestVideoPrompts}
                            disabled={isSuggestingPrompts}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-colors duration-200 border bg-violet-600/80 hover:bg-violet-600 text-white border-transparent disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isSuggestingPrompts ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {isSuggestingPrompts ? 'Analyzing Image...' : 'Suggest Prompts from Image'}
                        </button>

                        {promptSuggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs text-zinc-400">Click a suggestion to use it:</p>
                                {promptSuggestions.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setVideoPrompt(prompt)}
                                        className="w-full text-left p-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300"
                                    >
                                        {prompt}
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