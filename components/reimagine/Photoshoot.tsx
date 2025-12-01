/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, ChangeEvent, useRef, useEffect, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geminiService } from '../../services/geminiService';
import PolaroidCard from '../design/PolaroidCard';
import JSZip from 'jszip';
import { cn } from '../../lib/utils';
import { resizeImageToAspectRatio } from '../../utils/imageResizer';
import { useStudio } from '../../context/StudioContext';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { QualitySelector } from '../shared/QualitySelector';
import type { ImageQuality, QualityUsage } from '../../types/quality';
import { VideoGenerationModal } from '../shared/VideoGenerationModal';
import type { VideoGenerationConfig } from '../../types/video';
import { videoService } from '../../services/videoService';

const PHOTO_STYLE_CATEGORIES = {
    'Portraits & Close-ups': [
        { id: 'smiling_portrait', prompt: 'A portrait of the person from the original photo, but they are smiling warmly at the camera. Maintain the exact same background, lighting, and overall style as the original image.' },
        { id: 'laughing_portrait', prompt: 'A portrait of the person from the original photo, captured mid-laugh, looking genuinely happy. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'serious_close_up', prompt: 'A dramatic close-up shot focusing on the person\'s face, with a serious and confident expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'thoughtful_look', prompt: 'A three-quarter portrait of the person from the original photo, but they are looking thoughtfully away from the camera, into the distance. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'side_profile', prompt: 'A portrait of the person from the original photo taken from a side profile angle. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'head_tilt', prompt: 'A portrait of the person from the original photo, with their head tilted slightly, showing a curious and engaging expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'playful_wink', prompt: 'A close-up portrait of the person from the original photo giving a playful wink to the camera. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'soft_smile', prompt: 'A portrait of the person from the original photo with a soft, gentle, closed-mouth smile. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Full & Medium Shots': [
        { id: 'confident_full_body', prompt: 'A full-body shot of the person from the original photo, showing their complete outfit. They should be standing in a relaxed but confident pose. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'walking_pose', prompt: 'A full-body shot of the person from the original photo, captured as if they are walking confidently. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hands_in_pockets', prompt: 'A medium shot of the person from the original photo, standing casually with their hands in their pockets. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'arms_crossed', prompt: 'A medium shot of the person from the original photo, with their arms crossed confidently, looking directly at the camera. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hand_on_hip', prompt: 'A three-quarter shot of the person from the original photo with one hand placed confidently on their hip. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'leaning_pose', prompt: 'A full-body shot of the person from the original photo, leaning casually against an unseen object, looking relaxed. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'jumping_in_the_air', prompt: 'An energetic full-body shot of the person from the original photo captured mid-jump, expressing joy or excitement. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'twirling_shot', prompt: 'A dynamic full-body shot of the person from the original photo captured mid-twirl, with their clothing and hair showing motion. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Creative Angles & Perspectives': [
        { id: 'low_angle_shot', prompt: 'A full-body shot of the person from the original photo taken from a low angle, looking up at them. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'high_angle_shot', prompt: 'A photo of the person from the original photo taken from a high angle, looking down at them. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'from_below_face', prompt: 'A creative close-up shot of the person\'s face from the original photo, taken from directly below, looking up. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'over_the_shoulder_glance', prompt: 'A close-up portrait of the person from the original photo, glancing over their shoulder towards the camera with a subtle expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'looking_over_shoulder', prompt: 'A photo of the person from the original photo, looking back over their shoulder at the camera with a slight smile. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Fashion & Editorial': [
        { id: 'editorial_lean', prompt: 'A high-fashion, full-body editorial shot where the person is leaning against a wall with a sophisticated and detached expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'power_stance', prompt: 'An assertive, full-body power stance, with legs apart and a direct, strong gaze towards the camera, common in fashion advertisements. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hand_on_collar', prompt: 'A close-up, editorial-style shot where the person\'s hand is thoughtfully touching their collar or lapel. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'silhouette_pose', prompt: 'A dramatic silhouette of the person against a bright background, emphasizing the shape of their body and clothing. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'motion_blur', prompt: 'A creative shot with intentional motion blur, capturing the person moving fluidly, suggesting energy and dynamism, often seen in sportswear ads. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'architectural_pose', prompt: 'A full-body shot where the person\'s pose interacts with strong architectural lines in the background, creating a visually striking composition. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'lounging_elegantly', prompt: 'An elegant full-body shot of the person lounging on a stylish piece of furniture. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'dramatic_gaze', prompt: 'A close-up portrait with a dramatic, intense gaze, with high-contrast lighting. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Themed, Sitting & Lying Poses': [
        { id: 'sitting_pose', prompt: 'A full-body shot of the person from the original photo sitting casually, in a relaxed pose. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'crouching_pose', prompt: 'A trendy full-body shot of the person from the original photo in a crouching or squatting pose. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'lying_on_grass', prompt: 'A relaxed shot of the person from the original photo lying down on their back or side, as if on a grass or a blanket. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hand_on_chin', prompt: 'A portrait of the person from the original photo with their hand resting thoughtfully on their chin, looking pensive or creative. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'holding_balloons', prompt: 'A playful photo of the person from the original photo, reimagined to be holding a large bunch of balloons, looking joyful. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'holding_flowers', prompt: 'A beautiful portrait of the person from the original photo, reimagined to be holding a bouquet of flowers. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Dynamic & Candid': [
        { id: 'candid_moment', prompt: 'A candid-style photo of the person from the original photo, as if they were captured in a natural, unposed moment, perhaps adjusting their clothing or hair. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hair_in_motion', prompt: 'A dynamic photo of the person from the original photo where their hair is in motion, as if caught in a gentle breeze or during a turn. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'adjusting_jacket', prompt: 'A candid-style photo of the person from the original photo in the middle of adjusting their jacket, collar, or sleeve. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'hand_towards_camera', prompt: 'A dynamic photo where the person from the original photo is reaching one hand out towards the camera in a friendly, inviting gesture. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'dancing_pose', prompt: 'A dynamic full-body shot of the person from the original photo in a fluid dancing pose, expressing movement and joy. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { id: 'shielding_eyes_from_sun', prompt: 'A photo of the person from the original photo using their hand to shield their eyes from a bright light source (like the sun), creating a natural, candid look. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ]
};

const CAMERA_ANGLES = [
    { id: 'Eye-Level', label: 'Eye-Level' },
    { id: 'Low Angle', label: 'Low Angle' },
    { id: 'High Angle', label: 'High Angle' },
    { id: 'Dutch Angle', label: 'Dutch Angle' },
    { id: 'Worm\'s Eye View', label: 'Worm\'s Eye View' },
    { id: 'Bird\'s Eye View', label: 'Bird\'s Eye View' }
];

const COLOR_GRADES = [
    { id: 'None', label: 'None' },
    { id: 'Cinematic Teal & Orange', label: 'Cinematic Teal & Orange' },
    { id: 'Vintage Film', label: 'Vintage Film' },
    { id: 'High-Contrast B&W', label: 'High-Contrast B&W' },
    { id: 'Vibrant & Punchy', label: 'Vibrant & Punchy' },
    { id: 'Muted & Moody', label: 'Muted & Moody' },
    { id: 'Warm & Golden', label: 'Warm & Golden' },
    { id: 'Cool & Crisp', label: 'Cool & Crisp' }
];

const ALL_PHOTO_STYLES = Object.values(PHOTO_STYLE_CATEGORIES).flat();

type ImageStatus = 'pending' | 'done' | 'error';

interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

interface Concept {
    background: string;
    poses: string[];
    cameraAngle: string;
    colorGrade: string;
}

const primaryButtonClasses = "font-semibold text-sm text-center text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 py-2.5 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg";
const secondaryButtonClasses = "font-semibold text-sm text-center text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-white/10 py-2.5 px-6 rounded-lg transition-all duration-300 hover:scale-105";
const chipButtonClasses = "text-sm text-center text-zinc-300 bg-zinc-800 border-2 border-transparent py-2 px-4 rounded-lg transition-all duration-200 hover:bg-zinc-700 font-medium cursor-pointer";
const selectedChipButtonClasses = "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-semibold cursor-pointer";

const MAX_MODEL_IMAGES = 10;

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);

    return matches;
};

const ImageUploader = ({ label, imageUrl, onImageUpload, onImageRemove, inputId }: {
    label: string,
    imageUrl: string | null,
    onImageUpload: (file: File) => void,
    onImageRemove: () => void,
    inputId: string
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
        handleDragEvents(e);
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        handleDragEvents(e);
        setIsDragOver(false);
    };

    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">{label}</h3>
            {imageUrl ? (
                <div className="relative group aspect-square w-full rounded-md overflow-hidden">
                    <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
                    <button
                        onClick={onImageRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${label}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "cursor-pointer aspect-square w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-md transition-colors",
                        isDragOver ? "bg-zinc-800 border-emerald-500" : "hover:bg-black/40 hover:border-zinc-600"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragEvents}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-zinc-500 text-sm">{isDragOver ? 'Drop image here' : 'Click to upload'}</span>
                    <input id={inputId} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

interface AccordionSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, description, children, isOpen, onToggle }) => {
    return (
        <div className="border-b border-zinc-800">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle();
                }}
                className="w-full flex justify-between items-center py-4 text-left"
                type="button"
            >
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                    <p className="text-zinc-400 text-sm mt-1">{description}</p>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </button>
            {isOpen && (
                <div
                    className="pb-6"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default function Photoshoot({ onBack }: { onBack: () => void }) {
    console.log('🎬 [PHOTOSHOOT] Component mounted/rendered');
    const { t, chatReferenceImages } = useStudio();
    const { user, incrementGenerationsUsed } = useAuth();

    console.log('👤 [PHOTOSHOOT] User from useAuth:', {
        hasUser: !!user,
        userId: user?.id,
        userPlan: user?.plan
    });

    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [outfitImage, setOutfitImage] = useState<string | null>(null);
    const [objectImage, setObjectImage] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('Eye-Level');
    const [selectedColorGrade, setSelectedColorGrade] = useState<string>('None');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [appState, setAppState] = useState<'config' | 'generating' | 'results-shown'>('config');
    const [openAccordion, setOpenAccordion] = useState<string | null>('step2');
    const [refinePrompt, setRefinePrompt] = useState('');
    const [concept, setConcept] = useState<Concept | null>(null);
    const [isGeneratingConcept, setIsGeneratingConcept] = useState<boolean>(false);
    const [isDraggingOverPolaroid, setIsDraggingOverPolaroid] = useState(false);
    const [step1Tab, setStep1Tab] = useState<'upload' | 'generate'>('upload');
    const [modelGenPrompt, setModelGenPrompt] = useState('');
    const [isGeneratingModel, setIsGeneratingModel] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<ImageQuality>('regular');
    const [qualityUsage, setQualityUsage] = useState<QualityUsage>({ hd_count: 0, qhd_count: 0, month_year: '' });

    useEffect(() => {
        if (user) {
            storageService.getQualityUsage(user.id).then(setQualityUsage);
        }
    }, [user]);

    const [localLibrary, setLocalLibrary] = useState<string[]>(() => {
        try {
            const savedLibrary = localStorage.getItem('aiPhotoshootModelLibrary');
            if (savedLibrary) {
                const parsed = JSON.parse(savedLibrary);
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, MAX_MODEL_IMAGES);
                }
            }
            return [];
        } catch (error) {
            console.error("Failed to load model library from localStorage", error);
            localStorage.removeItem('aiPhotoshootModelLibrary');
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('aiPhotoshootModelLibrary', JSON.stringify(localLibrary));
        } catch (error) {
            console.error("Failed to save model library to localStorage", error);
        }
    }, [localLibrary]);

    // Helper function to convert base64 to File
    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleImageUpload = (fileOrDataUrl: File | string, setImage: (dataUrl: string) => void) => {
        if (typeof fileOrDataUrl === 'string') {
            setImage(fileOrDataUrl);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(fileOrDataUrl);
    };

    const handleSelectFromLibrary = (imageUrl: string) => {
        if (uploadedImage === imageUrl) return;
        setUploadedImage(imageUrl);
        setGeneratedImages({});
        setSelectedStyles([]);
        setOutfitImage(null);
        setObjectImage(null);
        setBackgroundImage(null);
        setConcept(null);
        setOpenAccordion('step2');
    };

    const handleMainImageUpload = (fileOrDataUrl: File | string) => {
        handleImageUpload(fileOrDataUrl, (dataUrl) => {
            setUploadedImage(dataUrl);
            setGeneratedImages({});
            setSelectedStyles([]);
            setOutfitImage(null);
            setObjectImage(null);
            setBackgroundImage(null);
            setConcept(null);
            setLocalLibrary(prev => {
                const filtered = prev.filter(img => img !== dataUrl);
                const newLibrary = [dataUrl, ...filtered];
                return newLibrary.slice(0, MAX_MODEL_IMAGES);
            });
        });
    };

    const handleGenerateModel = async () => {
        if (!modelGenPrompt) return;
        setIsGeneratingModel(true);
        try {
            const imageUrl = await geminiService.generateWithImagen(modelGenPrompt, '3:4');
            setUploadedImage(imageUrl);
            setGeneratedImages({});
            setSelectedStyles([]);
            setOutfitImage(null);
            setObjectImage(null);
            setBackgroundImage(null);
            setConcept(null);
            setLocalLibrary(prev => {
                const filtered = prev.filter(img => img !== imageUrl);
                const newLibrary = [imageUrl, ...filtered];
                return newLibrary.slice(0, MAX_MODEL_IMAGES);
            });
        } catch (error) {
            console.error("Failed to generate model:", error);
            alert(`Failed to generate model: ${(error as Error).message}`);
        } finally {
            setIsGeneratingModel(false);
        }
    };

    const handleDeleteFromLibrary = (imageUrlToDelete: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setLocalLibrary(prev => prev.filter(img => img !== imageUrlToDelete));
        if (uploadedImage === imageUrlToDelete) {
            setUploadedImage(null);
        }
    };

    const handleMainImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleMainImageUpload(e.target.files[0]);
        }
    };

    const toggleStyleSelection = (styleId: string) => {
        setSelectedStyles(prev =>
            prev.includes(styleId)
                ? prev.filter(id => id !== styleId)
                : [...prev, styleId]
        );
    };

    const handleSelectAll = () => {
        setSelectedStyles(ALL_PHOTO_STYLES.map(s => s.id));
    };

    const handleClearSelection = () => {
        setSelectedStyles([]);
    };

    const handleGenerateConcept = async () => {
        const conceptImages = [outfitImage, objectImage].filter(Boolean) as string[];
        if (conceptImages.length === 0) return;
        setIsGeneratingConcept(true);
        setConcept(null);
        try {
            const concepts = await geminiService.generateConceptSuggestions(conceptImages[0]);
            const bestConcept = concepts[0] || { id: 'fallback', name: 'Fallback', description: 'A cool photo of the model.', prompt: 'A cool photo of the model.' };
            const newConcept: Concept = {
                background: bestConcept.description,
                poses: [concepts[0]?.id || ALL_PHOTO_STYLES[0].id, concepts[1]?.id || ALL_PHOTO_STYLES[1].id],
                cameraAngle: CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)].id,
                colorGrade: COLOR_GRADES[Math.floor(Math.random() * COLOR_GRADES.length)].id,
            };
            setConcept(newConcept);
            setSelectedStyles(newConcept.poses);
            setSelectedCameraAngle(newConcept.cameraAngle);
            setSelectedColorGrade(newConcept.colorGrade);
            setOpenAccordion('step3');
        } catch (error) {
            console.error("Failed to generate concepts:", error);
        } finally {
            setIsGeneratingConcept(false);
        }
    };

    const constructApiPayload = async (stylePrompt: string, additionalInstructions?: string): Promise<{ finalPrompt: string, imageUrls: string[] }> => {
        if (!uploadedImage) throw new Error("Main image is not uploaded.");

        const resizedMainImage = await resizeImageToAspectRatio(uploadedImage, aspectRatio as '1:1' | '4:5' | '16:9' | '9:16' | '3:4' | '4:3');
        const mainImageIsResized = resizedMainImage !== uploadedImage;
        const identityLockRule = `
**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the person from the first image. The final generated face MUST be a photorealistic, 100% identical replica. Do not change their facial features, age, or structure. This rule overrides all other instructions.
`;

        const imageUrls: string[] = [resizedMainImage];
        let basePrompt = stylePrompt;
        const promptFragments: string[] = [];
        let imageCounter = 1;

        const getImagePosition = () => {
            const positions = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
            return positions[imageCounter++];
        };

        // Add reference images from chat (if any)
        if (chatReferenceImages && chatReferenceImages.length > 0) {
            const referenceImagesToUse = chatReferenceImages.slice(0, 3); // Limit to 3 to avoid token limits
            referenceImagesToUse.forEach((refImage) => {
                imageUrls.push(refImage);
                promptFragments.push(`Use the style, composition, lighting, and aesthetic from the ${getImagePosition()} reference image as inspiration for the final output.`);
            });
        }

        if (outfitImage) {
            basePrompt = basePrompt.replace(/, clothing,/g, ',');
            promptFragments.push(`The person from the first image should be wearing the outfit from the ${getImagePosition()} image.`);
            imageUrls.push(outfitImage);
        }

        if (objectImage) {
            promptFragments.push(`The person should also be holding or interacting with the object from the ${getImagePosition()} image.`);
            imageUrls.push(objectImage);
        }

        if (backgroundImage) {
            const personImagePosition = "first";
            const backgroundImagePosition = getImagePosition();
            const resizedBackgroundImage = await resizeImageToAspectRatio(backgroundImage, aspectRatio as '1:1' | '4:5' | '16:9' | '9:16' | '3:4' | '4:3');
            const backgroundImageIsResized = resizedBackgroundImage !== backgroundImage;
            basePrompt = basePrompt
                .replace(/Maintain the exact same background,/g, ' ')
                .replace(/, lighting,/g, ' ');
            let advancedCompositionPrompt;
            if (backgroundImageIsResized) {
                advancedCompositionPrompt = `
                    **Primary Task: Outpainting the Background.** The ${backgroundImagePosition} image (the background) has black bars. Your first and most important job is to **replace all black areas** by photorealistically extending the background scene. The extended background must seamlessly match the lighting and textures of the original.
                    **Secondary Task: Composition.** Once the background is fully extended into a complete scene, perform a photorealistic composition using the person from the ${personImagePosition} image.
                    To achieve realism, you MUST follow these critical steps:
                    1.  **Relight the Person:** Completely change the lighting on the person to match the direction, color, and quality of the light sources in the newly extended background.
                    2.  **Ensure Correct Scale:** The person's size must be realistically proportional to the perspective and elements in the extended background.
                    3.  **Seamless Blending:** The final image's color grading, contrast, and focus must be harmonized between the person and the background to create a single, cohesive photograph.
                `;
            } else {
                advancedCompositionPrompt = `
                    Perform a photorealistic composition. The person is in the ${personImagePosition} image, and the new environment is the ${backgroundImagePosition} image.
                    To achieve realism, you MUST follow these critical steps:
                    1.  **Relight the Person:** Completely change the lighting on the person to match the direction, color, and quality of the light sources in the new background.
                    2.  **Ensure Correct Scale:** The person's size must be realistically proportional to the perspective and elements in the background.
                    3.  **Seamless Blending:** The final image's color grading, contrast, and focus must be harmonized between the person and the background to create a single, cohesive photograph.
                `;
            }
            promptFragments.push(advancedCompositionPrompt);
            imageUrls.push(resizedBackgroundImage);
        } else if (mainImageIsResized) {
            const sanitizedStylePrompt = basePrompt
                .replace(/Maintain the exact same background, clothing, lighting, and overall style as the original image./g, 'The person must wear the same clothing and have the same identity. The overall photographic style must be preserved.')
                .replace(/Maintain the exact same background, lighting, and overall style as the original image./g, 'The person must have the same identity. The overall photographic style must be preserved.');
            basePrompt = `
                **Primary Task: Outpainting.** The provided image has black bars. Your main job is to **replace all black areas** by photorealistically extending the background of the original photo.
                The final result MUST be a full-bleed image with NO black borders, perfectly filling the ${aspectRatio} canvas.
                The extended background must seamlessly match the lighting and textures of the original.
                **Secondary Task: Pose Change.** While outpainting, also apply this modification: "${sanitizedStylePrompt}"
            `;
        }

        let aspectRatioDescription = '';
        switch (aspectRatio) {
            case '9:16': aspectRatioDescription = 'a tall, vertical portrait (9:16)'; break;
            case '16:9': aspectRatioDescription = 'a wide, horizontal landscape (16:9)'; break;
            case '4:3': aspectRatioDescription = 'a standard landscape (4:3)'; break;
            case '3:4': aspectRatioDescription = 'a standard portrait (3:4)'; break;
            default: aspectRatioDescription = 'a square (1:1)'; break;
        }
        promptFragments.push(`The final output MUST be ${aspectRatioDescription} aspect ratio.`);
        promptFragments.push(`The camera angle should be: ${selectedCameraAngle}.`);
        if (selectedColorGrade !== 'None') {
            promptFragments.push(`The final image should have a ${selectedColorGrade} color grade.`);
        }
        let finalPrompt = identityLockRule + promptFragments.join(' ') + ' ' + basePrompt;

        if (additionalInstructions && additionalInstructions.trim() !== '') {
            finalPrompt += `\n\n**REFINEMENT INSTRUCTIONS (apply ONLY these minor changes while strictly following the IDENTITY PRESERVATION directive):**\n${additionalInstructions}`;
        }

        return { finalPrompt, imageUrls };
    };

    const handleGenerateClick = async () => {
        console.log('🚀 [PHOTOSHOOT] handleGenerateClick called!', {
            hasUploadedImage: !!uploadedImage,
            selectedStylesCount: selectedStyles.length,
            hasUser: !!user,
            userId: user?.id
        });

        if (!uploadedImage || selectedStyles.length === 0) {
            console.warn('❌ [PHOTOSHOOT] Missing requirements:', { uploadedImage: !!uploadedImage, selectedStyles: selectedStyles.length });
            return;
        }

        if (!user) {
            console.error('❌ [PHOTOSHOOT] No user found! Cannot save images.');
            alert('⚠️ You must be logged in to save images. Please refresh the page and log in.');
            return;
        }

        setIsLoading(true);
        setAppState('generating');

        const stylesToGenerate = ALL_PHOTO_STYLES.filter(style => selectedStyles.includes(style.id));
        const initialImages: Record<string, GeneratedImage> = {};
        stylesToGenerate.forEach(style => {
            initialImages[style.id] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);
        const concurrencyLimit = 2;
        const stylesQueue = [...stylesToGenerate];

        const processStyle = async (style: { id: string, prompt: string }) => {
            try {
                console.log(`🔄 [PHOTOSHOOT] Processing style: ${style.id}`);
                const { finalPrompt, imageUrls } = await constructApiPayload(style.prompt);
                const resultUrl = await geminiService.generateStyledImage(finalPrompt, imageUrls, selectedQuality, 'realistic', aspectRatio);

                // Track usage for HD/QHD
                if (user && (selectedQuality === 'hd' || selectedQuality === 'qhd')) {
                    await storageService.incrementQualityUsage(user.id, selectedQuality);
                    // Reload usage
                    const newUsage = await storageService.getQualityUsage(user.id);
                    setQualityUsage(newUsage);
                }

                console.log(`✅ [PHOTOSHOOT] Generated image for ${style.id}:`, {
                    urlType: typeof resultUrl,
                    urlLength: resultUrl?.length || 0,
                    startsWithData: resultUrl?.startsWith('data:') || false
                });
                setGeneratedImages(prev => ({
                    ...prev,
                    [style.id]: { status: 'done', url: resultUrl },
                }));
                return { styleId: style.id, url: resultUrl, prompt: finalPrompt };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [style.id]: { status: 'error', error: errorMessage },
                }));
                console.error(`❌ Failed to generate image for ${style.id}:`, err);
                return null;
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            const results: Array<{ styleId: string; url: string; prompt: string } | null> = [];
            while (stylesQueue.length > 0) {
                const style = stylesQueue.shift();
                if (style) {
                    const result = await processStyle(style);
                    if (result) {
                        results.push(result);
                    }
                }
            }
            return results;
        });

        const allResults = await Promise.all(workers);
        const generatedResults = allResults.flat().filter((r): r is { styleId: string; url: string; prompt: string } => r !== null);

        console.log('🎯 [PHOTOSHOOT] ========================================');
        console.log('🎯 [PHOTOSHOOT] Generation complete!', {
            totalResults: generatedResults.length,
            results: generatedResults.map(r => r.styleId),
            hasUser: !!user,
            userId: user?.id
        });
        console.log('🎯 [PHOTOSHOOT] ========================================');

        // ALWAYS log what we're about to check
        console.log('🔍 [PHOTOSHOOT] Checking save conditions:', {
            userExists: !!user,
            userId: user?.id,
            resultsCount: generatedResults.length,
            resultsNotEmpty: generatedResults.length > 0,
            willSave: !!(user && generatedResults.length > 0)
        });

        // Save all generated images to Cloudinary (same pattern as simple mode)
        // DO THIS BEFORE updating state to ensure it runs
        if (user && generatedResults.length > 0) {
            console.log('✅ [PHOTOSHOOT] Conditions met! Starting save process...');
            console.log('💾 [PHOTOSHOOT] ========================================');
            console.log('💾 [PHOTOSHOOT] Starting save process...', {
                hasUser: !!user,
                userId: user?.id,
                generatedResultsCount: generatedResults.length
            });
            console.log('💾 [PHOTOSHOOT] ========================================');

            let savedCount = 0;
            let failedCount = 0;

            try {
                // Save all generated images
                for (const result of generatedResults) {
                    try {
                        console.log(`💾 [PHOTOSHOOT] ========================================`);
                        console.log(`💾 [PHOTOSHOOT] Saving image for ${result.styleId}...`);
                        console.log(`💾 [PHOTOSHOOT] URL info:`, {
                            urlType: typeof result.url,
                            urlLength: result.url?.length || 0,
                            urlStart: result.url?.substring(0, 50) || 'NO URL',
                            hasDataPrefix: result.url?.startsWith('data:') || false
                        });

                        // Convert base64 data URL to File
                        let imageFile: File;
                        try {
                            imageFile = base64ToFile(result.url, `photo-editor_${result.styleId}_${Date.now()}.png`);
                            console.log(`💾 [PHOTOSHOOT] File created successfully:`, {
                                name: imageFile.name,
                                size: imageFile.size,
                                type: imageFile.type
                            });
                        } catch (fileError) {
                            console.error(`❌ [PHOTOSHOOT] Failed to create file:`, fileError);
                            throw new Error(`Failed to create file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
                        }

                        console.log(`💾 [PHOTOSHOOT] Calling storageService.uploadImage...`, {
                            userId: user.id,
                            workflowId: 'photo-editor',
                            hasPrompt: !!result.prompt
                        });

                        const savedImage = await storageService.uploadImage(imageFile, user.id, 'photo-editor', result.prompt);

                        console.log(`✅ [PHOTOSHOOT] Image saved successfully!`, {
                            imageId: savedImage.id,
                            cloudinaryUrl: savedImage.cloudinary_url,
                            workflowId: savedImage.workflow_id,
                            userId: savedImage.user_id
                        });
                        console.log(`💾 [PHOTOSHOOT] ========================================`);
                        savedCount++;
                    } catch (imageError) {
                        console.error(`❌ [PHOTOSHOOT] ========================================`);
                        console.error(`❌ [PHOTOSHOOT] Failed to save image for ${result.styleId}:`, imageError);
                        console.error(`❌ [PHOTOSHOOT] Error details:`, {
                            message: imageError instanceof Error ? imageError.message : String(imageError),
                            stack: imageError instanceof Error ? imageError.stack : undefined,
                            name: imageError instanceof Error ? imageError.name : undefined
                        });
                        console.error(`❌ [PHOTOSHOOT] ========================================`);
                        failedCount++;
                        // Continue with next image
                    }
                }

                console.log(`✅ [PHOTOSHOOT] Save complete: ${savedCount} saved, ${failedCount} failed`);

                // Show alert if any were saved
                if (savedCount > 0) {
                    alert(`✅ ${savedCount} image(s) saved to My Creations!`);
                } else if (failedCount > 0) {
                    alert(`⚠️ Failed to save ${failedCount} image(s). Check console for details.`);
                }
            } catch (error) {
                console.error('❌ [PHOTOSHOOT] Failed to save images to Cloudinary:', error);
                console.error('❌ [PHOTOSHOOT] Error details:', {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                alert(`❌ Failed to save images: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Increment user's generation count (same as simple mode)
            try {
                const result = await incrementGenerationsUsed(generatedResults.length);
                if (result.dailyLimitHit) {
                    console.warn('⚠️ Daily limit reached');
                }
            } catch (error) {
                console.warn('⚠️ Failed to increment generation count:', error);
            }
        } else {
            console.error('❌ [PHOTOSHOOT] Cannot save images:', {
                hasUser: !!user,
                userId: user?.id,
                generatedResultsCount: generatedResults.length
            });
            if (!user) {
                alert('⚠️ Cannot save images: User not logged in. Please refresh the page.');
            } else if (generatedResults.length === 0) {
                alert('⚠️ Cannot save images: No images were generated successfully.');
            }
        }

        // Update UI state AFTER saving
        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegeneratePhoto = async (photoId: string) => {
        if (!uploadedImage || generatedImages[photoId]?.status === 'pending') {
            return;
        }
        const style = ALL_PHOTO_STYLES.find(s => s.id === photoId);
        if (!style) {
            console.error(`Style "${photoId}" not found.`);
            return;
        }
        setGeneratedImages(prev => ({
            ...prev,
            [photoId]: { status: 'pending' },
        }));
        try {
            const { finalPrompt, imageUrls } = await constructApiPayload(style.prompt, refinePrompt);
            const resultUrl = await geminiService.generateStyledImage(finalPrompt, imageUrls, selectedQuality, 'realistic', aspectRatio);

            // Track usage for HD/QHD
            if (user && (selectedQuality === 'hd' || selectedQuality === 'qhd')) {
                await storageService.incrementQualityUsage(user.id, selectedQuality);
                // Reload usage
                const newUsage = await storageService.getQualityUsage(user.id);
                setQualityUsage(newUsage);
            }

            setGeneratedImages(prev => ({
                ...prev,
                [photoId]: { status: 'done', url: resultUrl },
            }));

            // Save to Cloudinary storage (same pattern as simple mode)
            if (user && resultUrl) {
                try {
                    const imageFile = base64ToFile(resultUrl, `photo-editor_${photoId}_${Date.now()}.png`);
                    await storageService.uploadImage(imageFile, user.id, 'photo-editor', finalPrompt);
                    console.log(`✅ Regenerated image saved to Cloudinary: ${photoId}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to save regenerated image to Cloudinary: ${photoId}`, error);
                    // Continue even if Cloudinary save fails
                }

                // Increment generation count
                try {
                    await incrementGenerationsUsed(1);
                } catch (error) {
                    console.warn('⚠️ Failed to increment generation count:', error);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [photoId]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${photoId}:`, err);
        }
    };

    const handleReset = () => {
        setUploadedImage(null);
        setOutfitImage(null);
        setObjectImage(null);
        setBackgroundImage(null);
        setGeneratedImages({});
        setSelectedStyles([]);
        setAppState('config');
        setOpenAccordion('step2');
        setRefinePrompt('');
        setConcept(null);
        setModelGenPrompt('');
        setStep1Tab('upload');
    };

    const handleDownloadIndividualImage = (photoId: string, url?: string) => {
        const imageUrl = url || generatedImages[photoId]?.url;
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            const safeFileName = photoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            link.download = `ai-photoshoot-${safeFileName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloading(true);
        try {
            const imagesToZip = Object.entries(generatedImages)
                .filter((entry): entry is [string, GeneratedImage & { url: string }] => {
                    const [, image] = entry as [string, GeneratedImage];
                    return image.status === 'done' && !!image.url;
                });

            if (imagesToZip.length === 0) {
                alert('No images generated yet');
                setIsDownloading(false);
                return;
            }

            if (imagesToZip.length < selectedStyles.length) {
                alert('Please wait for all images to finish generating');
                setIsDownloading(false);
                return;
            }

            const zip = new JSZip();

            for (const [id, image] of imagesToZip) {
                const safeFileName = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const dataUrl = image.url;
                const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
                if (match) {
                    const mimeType = match[1];
                    const base64Data = match[2];
                    const extension = mimeType.split('/')[1] || 'jpg';
                    zip.file(`${safeFileName}.${extension}`, base64Data, { base64: true });
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'ai-photoshoot-collection.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Failed to create or download ZIP:", error);
            alert('Failed to create ZIP file');
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePolaroidDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverPolaroid(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleMainImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handlePolaroidDragEvents = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const getPolaroidCaption = () => {
        if (isDraggingOverPolaroid) return 'Drop to upload';
        if (uploadedImage) return 'Click to change';
        return 'Click to upload';
    }

    return (
        <main className="bg-zinc-950 text-zinc-200 w-full h-full flex flex-col items-center p-4 pb-24 overflow-y-auto relative font-sans">
            <div className="z-10 flex flex-col items-center w-full max-w-7xl mx-auto">
                <header className="w-full max-w-7xl mx-auto py-4 flex justify-between items-center gap-4 mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Back to Tools
                    </button>
                </header>

                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 tracking-tight">Variation Lab</h1>
                    <p className="text-lg text-zinc-400 mt-4 tracking-wide">Generate multiple poses and variations of your photos</p>
                </div>

                {appState === 'config' && (
                    <motion.div
                        className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full max-w-6xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center gap-4">
                            <h2 className="text-xl font-bold text-zinc-100">Step 1: Upload Your Photo</h2>
                            <label htmlFor="file-upload"
                                className="cursor-pointer group w-full max-w-sm"
                                onDrop={handlePolaroidDrop}
                                onDragOver={handlePolaroidDragEvents}
                                onDragEnter={() => setIsDraggingOverPolaroid(true)}
                                onDragLeave={() => setIsDraggingOverPolaroid(false)}
                            >
                                {uploadedImage ? (
                                    <div className="transform hover:scale-105 transition-transform duration-300">
                                        <PolaroidCard
                                            imageUrl={uploadedImage}
                                            conceptName={getPolaroidCaption()}
                                            status="done"
                                            onRetry={() => { }}
                                            onDownload={() => { }}
                                            isHighlighted={isDraggingOverPolaroid}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                                        <div className={cn(
                                            "relative aspect-[4/5] w-full bg-black border border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 transition-colors",
                                            isDraggingOverPolaroid ? "border-emerald-500" : "group-hover:border-zinc-700"
                                        )}>
                                            <Camera size={64} strokeWidth={1} className="text-zinc-600" />
                                        </div>
                                        <p className="text-center text-sm font-semibold text-zinc-400 mt-3">{getPolaroidCaption()}</p>
                                    </div>
                                )}
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleMainImageFileChange} />

                            <div className="w-full max-w-sm flex flex-col gap-4">
                                <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-lg">
                                    <button onClick={() => setStep1Tab('upload')} className={cn('w-full px-4 py-2 text-sm rounded-md transition-colors font-semibold', step1Tab === 'upload' ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800/80')}>
                                        Upload
                                    </button>
                                    <button onClick={() => setStep1Tab('generate')} className={cn('w-full px-4 py-2 text-sm rounded-md transition-colors font-semibold', step1Tab === 'generate' ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800/80')}>
                                        Generate
                                    </button>
                                </div>

                                {step1Tab === 'upload' && (
                                    <p className="text-center text-zinc-400 text-sm p-4 bg-zinc-900/50 rounded-lg">
                                        Upload a photo of a person to generate multiple poses and variations
                                    </p>
                                )}

                                {step1Tab === 'generate' && (
                                    <div className="w-full flex flex-col gap-2">
                                        <textarea
                                            value={modelGenPrompt}
                                            onChange={(e) => setModelGenPrompt(e.target.value)}
                                            placeholder="Describe the person you want to generate..."
                                            rows={3}
                                            className="w-full bg-zinc-850 border border-zinc-700 rounded-md p-2 text-zinc-200 focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                        <button
                                            onClick={handleGenerateModel}
                                            disabled={isGeneratingModel || !modelGenPrompt}
                                            className="w-full flex items-center justify-center text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isGeneratingModel ? 'Generating...' : 'Generate Model'}
                                        </button>
                                    </div>
                                )}

                                <div className="w-full">
                                    <h3 className="text-base font-bold text-zinc-300 mb-2">Library</h3>
                                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 min-h-[100px]">
                                        {localLibrary.length === 0 ? (
                                            <div className="flex items-center justify-center h-full py-8">
                                                <p className="text-zinc-500 text-sm text-center">No images in library</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                {localLibrary.map((imgUrl, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleSelectFromLibrary(imgUrl)}
                                                        className={cn(
                                                            "relative group aspect-square rounded-md overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-offset-zinc-950 transition-all",
                                                            uploadedImage === imgUrl ? "ring-emerald-500" : "ring-transparent hover:ring-zinc-600"
                                                        )}
                                                    >
                                                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Library image ${index + 1}`} />
                                                        <button
                                                            onClick={(e) => handleDeleteFromLibrary(imgUrl, e)}
                                                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"
                                                            aria-label="Delete from library"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-2/3 bg-zinc-900/70 border border-white/10 rounded-xl p-6">
                            <AccordionSection
                                title="Step 2: Add Accessories (Optional)"
                                description="Upload outfit, object, or background images to enhance your photoshoot"
                                isOpen={openAccordion === 'step2'}
                                onToggle={() => setOpenAccordion(openAccordion === 'step2' ? null : 'step2')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <ImageUploader label="Outfit" imageUrl={outfitImage} onImageUpload={(file) => handleImageUpload(file, setOutfitImage)} onImageRemove={() => { setOutfitImage(null); setConcept(null); }} inputId="outfit-upload" />
                                    <ImageUploader label="Object" imageUrl={objectImage} onImageUpload={(file) => handleImageUpload(file, setObjectImage)} onImageRemove={() => { setObjectImage(null); setConcept(null); }} inputId="object-upload" />
                                    <ImageUploader label="Background" imageUrl={backgroundImage} onImageUpload={(file) => handleImageUpload(file, setBackgroundImage)} onImageRemove={() => setBackgroundImage(null)} inputId="background-upload" />
                                </div>
                                {(outfitImage || objectImage) && (
                                    <div className="mt-6 border-t border-zinc-700 pt-4">
                                        <h4 className="text-base font-bold text-zinc-300 mb-2">AI Concept Assistant</h4>
                                        <button onClick={handleGenerateConcept} disabled={isGeneratingConcept} className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg w-full transition-colors">
                                            {isGeneratingConcept ? 'Generating concepts...' : 'Suggest Concepts'}
                                        </button>
                                        {concept && (
                                            <div className="mt-4 text-sm text-zinc-300 bg-zinc-800/50 p-4 rounded-lg space-y-2">
                                                <p className="text-base text-emerald-400 font-bold">Concept Applied!</p>
                                                <p className="border-t border-zinc-700 pt-2 mt-2"><strong className="text-zinc-100">Background:</strong> {concept.background}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AccordionSection>

                            <AccordionSection
                                title="Step 3: Camera & Color"
                                description="Select camera angle and color grading"
                                isOpen={openAccordion === 'step3'}
                                onToggle={() => setOpenAccordion(openAccordion === 'step3' ? null : 'step3')}
                            >
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Camera Angle</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {CAMERA_ANGLES.map(angle => {
                                                const isSelected = selectedCameraAngle === angle.id;
                                                return (
                                                    <button
                                                        key={angle.id}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Camera angle clicked:', angle.id, 'Current:', selectedCameraAngle);
                                                            setSelectedCameraAngle(angle.id);
                                                        }}
                                                        type="button"
                                                        className={cn(
                                                            chipButtonClasses,
                                                            isSelected && selectedChipButtonClasses
                                                        )}
                                                        style={{
                                                            pointerEvents: 'auto',
                                                            position: 'relative',
                                                            zIndex: 10,
                                                            ...(isSelected ? { backgroundColor: '#059669', borderColor: '#10b981', color: '#ffffff' } : {})
                                                        }}
                                                    >
                                                        {angle.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Color Grade</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {COLOR_GRADES.map(grade => {
                                                const isSelected = selectedColorGrade === grade.id;
                                                return (
                                                    <button
                                                        key={grade.id}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Color grade clicked:', grade.id, 'Current:', selectedColorGrade);
                                                            setSelectedColorGrade(grade.id);
                                                        }}
                                                        type="button"
                                                        className={cn(
                                                            chipButtonClasses,
                                                            isSelected && selectedChipButtonClasses
                                                        )}
                                                        style={{
                                                            pointerEvents: 'auto',
                                                            position: 'relative',
                                                            zIndex: 10,
                                                            ...(isSelected ? { backgroundColor: '#059669', borderColor: '#10b981', color: '#ffffff' } : {})
                                                        }}
                                                    >
                                                        {grade.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </AccordionSection>

                            <AccordionSection
                                title="Step 4: Output Settings"
                                description="Choose aspect ratio and image quality"
                                isOpen={openAccordion === 'step4'}
                                onToggle={() => setOpenAccordion(openAccordion === 'step4' ? null : 'step4')}
                            >
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Aspect Ratio</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {['1:1', '9:16', '16:9', '4:3', '3:4'].map(ratio => {
                                                const isSelected = aspectRatio === ratio;
                                                return (
                                                    <button
                                                        key={ratio}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Aspect ratio clicked:', ratio, 'Current:', aspectRatio);
                                                            setAspectRatio(ratio);
                                                        }}
                                                        type="button"
                                                        className={cn(
                                                            chipButtonClasses,
                                                            isSelected && selectedChipButtonClasses
                                                        )}
                                                        style={{
                                                            pointerEvents: 'auto',
                                                            position: 'relative',
                                                            zIndex: 10,
                                                            ...(isSelected ? { backgroundColor: '#059669', borderColor: '#10b981', color: '#ffffff' } : {})
                                                        }}
                                                    >
                                                        {ratio}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Image Quality</h4>
                                        <div className="max-w-md">
                                            <QualitySelector
                                                selected={selectedQuality}
                                                onChange={setSelectedQuality}
                                                usage={qualityUsage}
                                                limits={storageService.getQualityLimits(user?.plan || 'free')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </AccordionSection>

                            <AccordionSection
                                title="Step 5: Select Poses"
                                description="Choose one or more poses to generate"
                                isOpen={openAccordion === 'step5'}
                                onToggle={() => setOpenAccordion(openAccordion === 'step5' ? null : 'step5')}
                            >
                                <div className="flex justify-end gap-4 mb-4 border-b border-zinc-800 pb-4">
                                    <button onClick={handleSelectAll} className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">Select All</button>
                                    <button onClick={handleClearSelection} className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">Clear Selection</button>
                                </div>

                                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                                    {Object.entries(PHOTO_STYLE_CATEGORIES).map(([category, styles]) => (
                                        <div key={category}>
                                            <h3 className="text-base font-bold text-zinc-300 mb-3">{category}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {styles.map(style => {
                                                    const isSelected = selectedStyles.includes(style.id);
                                                    return (
                                                        <button
                                                            key={style.id}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('Pose clicked:', style.id, 'Selected:', selectedStyles);
                                                                toggleStyleSelection(style.id);
                                                            }}
                                                            type="button"
                                                            className={cn(
                                                                chipButtonClasses,
                                                                isSelected && selectedChipButtonClasses
                                                            )}
                                                            style={{
                                                                pointerEvents: 'auto',
                                                                position: 'relative',
                                                                zIndex: 10,
                                                                ...(isSelected ? { backgroundColor: '#059669', borderColor: '#10b981', color: '#ffffff' } : {})
                                                            }}
                                                        >
                                                            {style.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionSection>

                            <div className="mt-8 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                {uploadedImage ? (
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                ) : <div />}
                                {(() => {
                                    const isButtonDisabled = isLoading || !uploadedImage || selectedStyles.length === 0;
                                    console.log('🔘 [PHOTOSHOOT] Generate button rendering:', {
                                        isLoading,
                                        hasUploadedImage: !!uploadedImage,
                                        selectedStylesCount: selectedStyles.length,
                                        isButtonDisabled,
                                        buttonText: isLoading ? 'Generating...' : `Generate (${selectedStyles.length})`
                                    });
                                    return (
                                        <button
                                            onClick={(e) => {
                                                console.log('🔘 [PHOTOSHOOT] BUTTON CLICKED!', {
                                                    isLoading,
                                                    hasUploadedImage: !!uploadedImage,
                                                    selectedStylesCount: selectedStyles.length,
                                                    isDisabled: isButtonDisabled,
                                                    eventType: e.type,
                                                    target: e.target
                                                });
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!isLoading && uploadedImage && selectedStyles.length > 0) {
                                                    console.log('🔘 [PHOTOSHOOT] Calling handleGenerateClick...');
                                                    try {
                                                        handleGenerateClick();
                                                    } catch (error) {
                                                        console.error('❌ [PHOTOSHOOT] Error calling handleGenerateClick:', error);
                                                    }
                                                } else {
                                                    console.warn('🔘 [PHOTOSHOOT] Button click ignored - conditions not met:', {
                                                        isLoading,
                                                        hasUploadedImage: !!uploadedImage,
                                                        selectedStylesCount: selectedStyles.length
                                                    });
                                                }
                                            }}
                                            className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            disabled={isButtonDisabled}
                                            type="button"
                                        >
                                            {isLoading
                                                ? 'Generating...'
                                                : `Generate (${selectedStyles.length})`
                                            }
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                    <>
                        <div className="w-full max-w-7xl flex-1 overflow-y-auto mt-4 p-4 pb-8 relative">
                            <div className="flex flex-wrap justify-center items-start gap-8">
                                {ALL_PHOTO_STYLES
                                    .filter(style => generatedImages[style.id])
                                    .map((style, index) => (
                                        <motion.div
                                            key={style.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
                                        >
                                            <PolaroidCard
                                                conceptName={style.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                status={generatedImages[style.id]?.status || 'pending'}
                                                imageUrl={generatedImages[style.id]?.url}
                                                error={generatedImages[style.id]?.error}
                                                onRetry={() => handleRegeneratePhoto(style.id)}
                                                onDownload={() => handleDownloadIndividualImage(style.id)}
                                                onVideoGenerate={() => {
                                                    if (generatedImages[style.id]?.url) {
                                                        setSelectedImageForVideo(generatedImages[style.id].url);
                                                        setShowVideoModal(true);
                                                    }
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                        <div className="py-4 mt-4 flex flex-col items-center justify-center z-20 w-full max-w-2xl">
                            {appState === 'results-shown' && (
                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="w-full bg-zinc-900/70 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg">
                                        <label htmlFor="refine-prompt" className="block text-sm font-semibold text-zinc-100 mb-2">Refine Instructions</label>
                                        <textarea
                                            id="refine-prompt"
                                            value={refinePrompt}
                                            onChange={(e) => setRefinePrompt(e.target.value)}
                                            placeholder="Add any specific refinements for regenerating images..."
                                            rows={2}
                                            className="w-full bg-zinc-850 border border-zinc-700 rounded-md p-2 text-zinc-200 focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                        <p className="text-xs text-zinc-400 mt-2">Use this to refine regenerated images with specific instructions</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                                        <button
                                            onClick={handleDownloadAll}
                                            disabled={isDownloading}
                                            className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isDownloading ? 'Creating ZIP...' : 'Download All'}
                                        </button>
                                        <button onClick={handleReset} className={secondaryButtonClasses}>
                                            Start Over
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {showVideoModal && selectedImageForVideo && (
                <VideoGenerationModal
                    isOpen={showVideoModal}
                    onClose={() => {
                        setShowVideoModal(false);
                        setSelectedImageForVideo(null);
                    }}
                    sourceImage={selectedImageForVideo}
                    onGenerate={async (config: VideoGenerationConfig) => {
                        if (!user) return;
                        try {
                            console.log('Generating video with config:', config);
                            const videoUrl = await videoService.generateVideo(user.id, config, user.plan);
                            // Refresh usage
                            const newUsage = await storageService.getVideoUsage(user.id);
                            // You might want to update some local state here if needed

                            // Show success (VideoGenerationModal handles the alert, but we can do more here if needed)
                        } catch (error) {
                            console.error('Video generation failed:', error);
                            throw error; // Re-throw so modal can handle it
                        } finally {
                            setShowVideoModal(false);
                            setSelectedImageForVideo(null);
                        }
                    }}
                    userTier={user?.plan || 'free'}
                />
            )}
        </main>
    );
}