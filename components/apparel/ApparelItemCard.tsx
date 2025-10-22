import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Loader2, ChevronDown, Plus, Camera } from 'lucide-react';
import type { ApparelItem, ApparelCategory } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { PromptOptimizer } from '../shared/PromptOptimizer';


const ITEM_CATEGORIES: ApparelCategory[] = ['Uncategorized', 'Upper Body', 'Lower Body', 'Full Body', 'Outerwear', 'Accessory', 'Footwear', 'Handheld'];

const ViewUploader: React.FC<{
    viewType: 'Back' | 'Detail';
    base64: string | null | undefined;
    onUpload: (file: File) => void;
    onRemove: () => void;
}> = ({ viewType, base64, onUpload, onRemove }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false
    });

    if (base64) {
        return (
            <div className="relative group w-14 h-14 flex-shrink-0">
                <img src={base64} alt={`${viewType} view`} className="w-full h-full object-cover rounded-md border border-white/10" />
                 <div className="absolute top-0 right-0 p-0.5 bg-black/50 backdrop-blur-sm rounded-bl-md rounded-tr-md">
                    <p className="text-white text-[10px] font-bold">{viewType}</p>
                 </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <button onClick={onRemove} className="text-white hover:text-red-400 transition-colors p-1" aria-label={`Remove ${viewType} view`}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div {...getRootProps()} className={`w-14 h-14 flex-shrink-0 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-zinc-500 cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 hover:border-zinc-600'}`}>
            <input {...getInputProps()} />
            <Camera size={16} />
            <span className="text-[9px] leading-tight mt-0.5 text-center">Add {viewType}</span>
        </div>
    );
};


export const ApparelItemCard: React.FC<{ 
    item: ApparelItem; 
    onRemove: (id: string) => void;
    onDescriptionChange: (id: string, description: string) => void; 
    onCategoryChange: (id: string, category: ApparelCategory) => void;
}> = ({ item, onRemove, onDescriptionChange, onCategoryChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { updateApparelItemView, t } = useStudio();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleViewUpload = (viewType: 'back' | 'detail', file: File) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            if (event.target?.result) {
                updateApparelItemView(item.id, viewType, event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleViewRemove = (viewType: 'back' | 'detail') => {
        updateApparelItemView(item.id, viewType, null);
    };

    const categoryColorClasses: Record<ApparelCategory, string> = {
        'Upper Body': 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
        'Lower Body': 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30',
        'Full Body': 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
        'Outerwear': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30',
        'Accessory': 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30',
        'Footwear': 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
        'Handheld': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30',
        'Uncategorized': 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30 hover:bg-zinc-600/30',
    }

    return (
        <div className="p-3 bg-zinc-850 rounded-lg flex flex-col gap-3 border border-white/5 hover:border-white/10 hover:bg-zinc-800 transition-all duration-200 shadow-inner-soft">
            <div className="flex items-start gap-4">
                <img src={item.base64} alt="Item preview" className="w-16 h-16 object-cover rounded-md border border-white/10" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1.5">
                            <h3 className="font-semibold text-zinc-300 text-sm">{t('item_details')}</h3>
                            {item.isProcessing ? (
                                <span className="flex items-center text-xs text-zinc-400">
                                    <Loader2 size={12} className="animate-spin mr-1.5" />
                                    AI analyzing...
                                </span>
                            ) : (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(prev => !prev)}
                                        className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors flex items-center gap-1.5 ${categoryColorClasses[item.category] || categoryColorClasses['Uncategorized']}`}
                                        aria-label="Change item category"
                                        aria-haspopup="true"
                                        aria-expanded={isDropdownOpen}
                                    >
                                        <span>{item.category}</span>
                                        <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-20 top-full mt-1.5 w-40 bg-zinc-900 rounded-md shadow-2xl border border-white/10 p-1 animate-fade-in duration-150">
                                            {ITEM_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        onCategoryChange(item.id, cat);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${item.category === cat ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => onRemove(item.id)} 
                            className="p-1 -m-1 text-zinc-500 hover:text-red-400 transition-colors"
                            aria-label="Remove item"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <textarea
                            value={item.description}
                            onChange={(e) => onDescriptionChange(item.id, e.target.value)}
                            placeholder={t('item_description_placeholder')}
                            rows={2}
                            className="w-full p-2 pr-12 rounded-md bg-zinc-925 text-zinc-300 border border-zinc-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors shadow-inner-soft resize-none"
                            aria-label="Item description"
                        />
                        <PromptOptimizer
                            prompt={item.description}
                            setPrompt={(v) => onDescriptionChange(item.id, v)}
                            context="Describing an apparel item for an AI virtual try-on"
                            className="absolute bottom-2 right-2"
                        />
                    </div>
                </div>
            </div>
            <div>
                <p className="text-xs text-zinc-400 mb-2">Add other views for better accuracy on complex shots:</p>
                <div className="flex items-center gap-2">
                    <ViewUploader 
                        viewType="Back"
                        base64={item.backViewBase64}
                        onUpload={(file) => handleViewUpload('back', file)}
                        onRemove={() => handleViewRemove('back')}
                    />
                    <ViewUploader 
                        viewType="Detail"
                        base64={item.detailViewBase64}
                        onUpload={(file) => handleViewUpload('detail', file)}
                        onRemove={() => handleViewRemove('detail')}
                    />
                </div>
            </div>
        </div>
    );
};