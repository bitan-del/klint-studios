
import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowRight,
    Upload,
    Image as ImageIcon,
    X,
    Sparkles,
    MessageSquare,
    Settings2,
    Check,
    ChevronRight,
    Camera,
    Box,
    User,
    Shirt,
    Palette,
    Scissors,
    Aperture,
    Sun,
    Layers,
    Save,
    Wand2,
    Share2,
    Download,
    Maximize2,
    Monitor,
    Smartphone,
    Loader2,
    Layout,
    Copy,
    Video,
    Zap
} from 'lucide-react';
import { videoService } from '../../services/videoService';
import { storageService } from '../../services/storageService';
import { ASPECT_RATIOS_LIBRARY } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubble } from './ui/ChatBubble';
import { OptionGrid, OptionItem } from './ui/OptionGrid';
import { ChasonChatInput } from './ChasonChatInput';
import { VideoGenerationModal } from '../shared/VideoGenerationModal';
import type { VideoGenerationConfig } from '../../types/video';

type ChasonStep =
    | 'goal'
    | 'person'
    | 'items'
    | 'scene'
    | 'styling'
    | 'camera'
    | 'lighting'
    | 'output'
    | 'generating'
    | 'result'
    | 'social_brand'
    | 'social_goal'
    | 'social_themes'
    | 'social_assets'
    | 'social_platforms'
    | 'social_style'
    | 'social_text'
    | 'social_output'
    | 'mockup_design'
    | 'mockup_product'
    | 'mockup_view'
    | 'mockup_background'
    | 'mockup_output';

interface ChasonWorkflowProps {
    onBack?: () => void;
}

export const ChasonWorkflow: React.FC<ChasonWorkflowProps> = ({ onBack }) => {
    const {
        setStudioMode,
        generateAsset,
        isGenerating,
        generatedImages,
        activeImageIndex,
        setActiveImageIndex,
        updateScene,
        selectAspectRatio,
        aspectRatio,
        setNumberOfImages,
        numberOfImages
    } = useStudio();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState<ChasonStep>('goal');
    const [history, setHistory] = useState<ChasonStep[]>([]);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);

    // State for all selections
    const [selections, setSelections] = useState({
        goal: null as 'photoshoot' | 'product' | null,
        person: null as string | null, // 'upload' | 'prompt'
        uploadedPersonImage: null as string | null,
        personDescription: '' as string,
        items: [] as string[], // Uploaded item images
        scene: {
            background: null as string | null,
            props: '',
            effects: ''
        },
        styling: {
            hair: '',
            makeup: '',
            itemStyling: ''
        },
        camera: {
            shotType: '',
            angle: '',
            focalLength: '',
            aperture: '',
            expression: ''
        },
        lighting: {
            direction: '',
            quality: '',
            preset: ''
        },
        output: {
            pack: 'none' as string,
            quality: 'standard' as 'standard' | 'high' | 'ultra'
        },
        customPrompt: '',
        social: {
            brand: '',
            goal: '',
            themes: '',
            assets: [] as string[], // Uploaded asset images
            platforms: [] as string[],
            style: '',
            styleReference: null as string | null, // Uploaded style reference
            textPreferences: '',
            textReference: null as string | null // Uploaded text reference
        },
        mockup: {
            design: null as string | null, // Uploaded design/logo
            reference: null as string | null, // Uploaded reference mockup
            name: '' as string, // Product/Brand Name
            productCategory: '' as string, // apparel, tech, print, etc.
            productType: '' as string, // specific product
            viewAngle: '' as string, // front, angled, lifestyle
            background: '' as string // studio, lifestyle, transparent
        }
    });

    // Use ref to access latest selections in async callbacks/closures
    const selectionsRef = useRef(selections);
    useEffect(() => {
        selectionsRef.current = selections;
    }, [selections]);

    // Handle Mockup Generation
    useEffect(() => {
        if (currentStep === 'generating' && selections.goal === 'mockup') {
            const generateMockup = async () => {
                try {
                    // Use the custom prompt we built in the previous step
                    const prompt = selections.customPrompt || `Create a realistic product mockup of a ${selections.mockup.productType || 'product'}.`;

                    // Use the uploaded design as a reference image
                    const referenceImages: string[] = [];
                    if (selections.mockup.design) referenceImages.push(selections.mockup.design);
                    if (selections.mockup.reference) referenceImages.push(selections.mockup.reference);

                    await generateAsset(user, async (count) => {
                        setCurrentStep('result');
                    }, prompt, referenceImages);
                } catch (error) {
                    console.error("Mockup generation failed:", error);
                    setChasonMessage("I encountered an issue generating your mockup. Please try again.");
                    setCurrentStep('mockup_output');
                }
            };

            generateMockup();
        }
    }, [currentStep, selections.goal, selections.customPrompt, selections.mockup.design, selections.mockup.productType, generateAsset]);

    const nextStep = (step: ChasonStep) => {
        setHistory(prev => [...prev, currentStep]);
        setCurrentStep(step);

        // Set appropriate message for the next step
        const stepMessages: Record<ChasonStep, string> = {
            'goal': "Welcome to the studio. I'm Chason, your Design AGI. What would you like to create today?",
            'person': "Great choice. Now, who is the subject of this photoshoot?",
            'items': selectionsRef.current.goal === 'product'
                ? "Please upload the product you want to stage."
                : "Please upload the apparel and accessories you want your model to wear.",
            'scene': "Perfect! Now let's set the scene. What kind of environment do you envision?",
            'styling': "Excellent! Let's add some styling details to make this perfect.",
            'camera': "Great! Now let's set up the perfect shot. How should we frame this?",
            'lighting': "Almost there! Let's perfect the lighting for this shot.",
            'output': "Wonderful! Let's finalize the output settings.",
            'generating': "I'm generating your vision now...",
            'result': getChasonResponse('readyToGenerate'),
            'social_brand': "Let's start with your brand. Who are you targeting?",
            'social_goal': "What is your primary goal for this content?",
            'social_themes': "What are the main themes or topics?",
            'social_assets': "Do you have any brand assets to include?",
            'social_platforms': "Which platforms are we designing for?",
            'social_style': "What visual style or mood are you looking for?",
            'social_text': "Any specific text, hashtags, or CTAs?",
            'social_output': "Almost done! Let's finalize the output settings.",
            'mockup_design': "Let's create product mockups! Upload your design or logo.",
            'mockup_product': "Perfect! Now, which product would you like to showcase your design on?",
            'mockup_view': "Great choice! How should we display this product?",
            'mockup_background': "Excellent! What kind of background would you like?",
            'mockup_output': "Almost done! Let's finalize the mockup settings."
        };

        setChasonMessage(stepMessages[step]);
    };

    const goBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setCurrentStep(prev);
        } else if (onBack) {
            onBack();
        }
    };

    const updateSelection = (category: keyof typeof selections, key: string | null, value: any) => {
        setSelections(prev => {
            if (key) {
                return {
                    ...prev,
                    [category]: {
                        ...(prev[category] as object),
                        [key]: value
                    }
                };
            }
            return {
                ...prev,
                [category]: value
            };
        });
    };

    const handleAction = (action: string) => {
        if (action === 'classic') {
            setStudioMode('apparel');
        } else if (action === 'simple') {
            if (onBack) onBack();
        } else if (action === 'video') {
            setStudioMode('video');
        }
    };

    // --- Conversational Responses ---
    const chasonResponses = {
        goalSelected: [
            "Excellent choice! Let's create something amazing together.",
            "Perfect! I can already envision the possibilities.",
            "Great! This is going to be spectacular.",
            "Wonderful! I'm excited to bring your vision to life."
        ],
        personSelected: [
            "Got it! Now let's dress them up beautifully.",
            "Perfect! Let's make them shine.",
            "Excellent! Time to style this look.",
            "Great choice! Let's create magic."
        ],
        personUploaded: [
            "Beautiful! I can work with this perfectly.",
            "Fantastic subject! Let's make them shine.",
            "Love it! This is going to look incredible.",
            "Perfect! They're going to look amazing."
        ],
        personDescribed: [
            "I can picture them already! Let's continue.",
            "Great description! I know exactly what you're looking for.",
            "Perfect! I've got a clear vision now.",
            "Excellent! This is going to be stunning."
        ],
        itemsAdded: [
            "Nice selection! These will look stunning.",
            "Perfect items! I'm excited to see how this comes together.",
            "Great choices! Let's style these beautifully.",
            "Wonderful picks! This outfit is going to be fire."
        ],
        sceneSet: [
            "The scene is set! This atmosphere will be perfect.",
            "Wonderful environment! I can picture it already.",
            "Brilliant setting! This will create the right mood.",
            "Perfect backdrop! This is going to look amazing."
        ],
        stylingDone: [
            "Love the styling choices! Almost there.",
            "Perfect touches! This is coming together nicely.",
            "Great styling! The details make all the difference.",
            "Excellent refinements! Looking good."
        ],
        cameraSet: [
            "Perfect angle! This composition will be stunning.",
            "Great camera work! This shot is going to be incredible.",
            "Excellent framing! I can see it now.",
            "Brilliant setup! This perspective is perfect."
        ],
        lightingDone: [
            "The lighting is perfect! Almost ready to generate.",
            "Beautiful lighting choice! This will look amazing.",
            "Great lighting! This will really make it pop.",
            "Perfect illumination! We're almost there."
        ],
        readyToGenerate: [
            "Everything looks perfect! Ready when you are.",
            "All set! Let's create something incredible.",
            "Perfect setup! Time to bring this to life.",
            "Excellent! Let's make some magic happen."
        ]
    };

    const getChasonResponse = (category: keyof typeof chasonResponses) => {
        const responses = chasonResponses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    // Track current Chason message
    const [chasonMessage, setChasonMessage] = useState("Welcome to the studio. I'm Chason, your Design AGI. What would you like to create today?");

    // Chat history for free-form messages
    const [chatHistory, setChatHistory] = useState<Array<{
        role: 'user' | 'chason';
        message: string;
        images?: string[];
    }>>([]);

    // Handle chat messages
    const handleChatMessage = (message: string, images?: string[]) => {
        // Add user message to history
        if (message.trim()) {
            setChatHistory(prev => [...prev, { role: 'user', message, images }]);
        }

        // Simple pattern matching for common requests
        const lowerMessage = message.toLowerCase();

        // Add items
        if (images && images.length > 0) {
            updateSelection('items', null, [...selections.items, ...images]);
            setChasonMessage(getChasonResponse('itemsAdded'));
            setChatHistory(prev => [...prev, {
                role: 'chason',
                message: getChasonResponse('itemsAdded')
            }]);
            return;
        }

        // Change scene/background
        if (lowerMessage.includes('background') || lowerMessage.includes('scene')) {
            updateSelection('scene', 'background', message);
            setChasonMessage(getChasonResponse('sceneSet'));
            setChatHistory(prev => [...prev, {
                role: 'chason',
                message: "Got it! I've updated the scene."
            }]);
            return;
        }

        // Lighting changes
        if (lowerMessage.includes('light')) {
            updateSelection('lighting', 'preset', message);
            setChasonMessage(getChasonResponse('lightingDone'));
            setChatHistory(prev => [...prev, {
                role: 'chason',
                message: "Perfect! Lighting updated."
            }]);
            return;
        }

        // General acknowledgment
        const responses = [
            "Got it! I've noted that down.",
            "Perfect! I'll incorporate that.",
            "Excellent! Adding that to the mix.",
            "Great idea! I'll make sure to include that."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setChasonMessage(response);
        setChatHistory(prev => [...prev, { role: 'chason', message: response }]);
    };

    // Handle workflow selection from Goal step
    const handleWorkflowSelect = (workflow: 'apparel' | 'product' | 'social' | 'mockup') => {
        if (workflow === 'social') {
            updateSelection('goal', null, 'social');
            setChasonMessage(getChasonResponse('goalSelected'));
            setTimeout(() => nextStep('social_brand'), 800);
        } else if (workflow === 'product') {
            updateSelection('goal', null, 'product');
            setChasonMessage("Excellent. Let's stage your product. Please upload the item.");
            setTimeout(() => nextStep('items'), 800);
        } else if (workflow === 'mockup') {
            updateSelection('goal', null, 'mockup');
            setChasonMessage("Perfect! Let's create product mockups.");
            setTimeout(() => nextStep('mockup_design'), 800);
        } else {
            updateSelection('goal', null, 'photoshoot');
            setChasonMessage(getChasonResponse('goalSelected'));
            setTimeout(() => nextStep('person'), 800);
        }
    };

    // --- Step Renderers ---

    const renderGoalStep = () => (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 items-center justify-center">
            <ChatBubble message={chasonMessage} />

            <div className="mt-8">
                <OptionGrid
                    options={[
                        {
                            id: 'virtual-photoshoot',
                            icon: <Camera size={24} />,
                            label: 'Virtual Photoshoot',
                            description: 'Get your custom model photoshoot done',
                            action: () => handleWorkflowSelect('apparel')
                        },
                        {
                            id: 'stage-object',
                            icon: <Box size={24} />,
                            label: 'Stage an Object',
                            description: 'Get your custom product photoshoot done',
                            action: () => handleWorkflowSelect('product')
                        },
                        {
                            id: 'social-media',
                            icon: <Share2 size={24} />,
                            label: 'Social Media Graphics',
                            description: 'Create engaging posts & stories',
                            action: () => handleWorkflowSelect('social')
                        },
                        {
                            id: 'product-mockup',
                            icon: <Layout size={24} />,
                            label: 'Product Mockups',
                            description: 'Place your designs on real products',
                            action: () => handleWorkflowSelect('mockup')
                        },
                    ]}
                    onSelect={(id) => {
                        if (id === 'virtual-photoshoot') handleWorkflowSelect('apparel');
                        else if (id === 'stage-object') handleWorkflowSelect('product');
                        else if (id === 'social-media') handleWorkflowSelect('social');
                        else if (id === 'product-mockup') handleWorkflowSelect('mockup');
                    }}
                />
            </div>
        </div>
    );

    const renderPersonStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />

            <div className="mt-8 space-y-6">
                <OptionGrid
                    columns={2}
                    options={[
                        { id: 'upload', label: 'Upload Model', icon: <Upload size={20} /> },
                        { id: 'prompt', label: 'Describe Model', icon: <MessageSquare size={20} /> }
                    ]}
                    selectedId={selections.person || undefined}
                    onSelect={(id) => {
                        updateSelection('person', null, id);
                        setChasonMessage(getChasonResponse('personSelected'));
                    }}
                />

                {selections.person === 'upload' && (
                    <div className="animate-fade-in">
                        <label className="w-full h-48 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                            {selections.uploadedPersonImage ? (
                                <img src={selections.uploadedPersonImage} alt="Model" className="h-full object-contain" />
                            ) : (
                                <>
                                    <Upload size={32} className="text-zinc-500 group-hover:text-emerald-500 mb-2" />
                                    <span className="text-zinc-400">Click to upload model image</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            updateSelection('uploadedPersonImage', null, ev.target?.result as string);
                                            setChasonMessage(getChasonResponse('personUploaded'));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                    </div>
                )}

                {selections.person === 'prompt' && (
                    <div className="animate-fade-in space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Describe the model</h3>
                        <textarea
                            placeholder="e.g., A young woman with long brown hair, wearing casual clothing, standing confidently..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.personDescription || ''}
                            onChange={(e) => updateSelection('personDescription', null, e.target.value)}
                            onBlur={() => selections.personDescription && setChasonMessage(getChasonResponse('personDescribed'))}
                        />
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={() => nextStep('items')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderItemsStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />

            <div className="mt-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selections.items.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 group">
                            <img src={img} alt={`Item ${idx} `} className="w-full h-full object-cover" />
                            <button
                                onClick={() => {
                                    const newItems = selections.items.filter((_, i) => i !== idx);
                                    updateSelection('items', null, newItems);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all">
                        <Upload size={24} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500 mt-2">Add Item</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files) as File[];
                                    files.forEach(file => {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                updateSelection('items', null, [...selections.items, ev.target.result as string]);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    });
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => nextStep('scene')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSceneStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message="Let's set the scene. Where should this take place?" />

            <div className="mt-8 space-y-8">
                {/* Background */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <ImageIcon size={16} /> Background
                    </h3>
                    <OptionGrid
                        columns={3}
                        options={[
                            { id: 'studio', label: 'Studio', icon: <Box size={18} /> },
                            { id: 'urban', label: 'Urban', icon: <Box size={18} /> },
                            { id: 'nature', label: 'Nature', icon: <Sun size={18} /> },
                            { id: 'interior', label: 'Interior', icon: <Box size={18} /> },
                            { id: 'custom', label: 'Custom', icon: <Wand2 size={18} /> }
                        ]}
                        selectedId={['studio', 'urban', 'nature', 'interior'].includes(selections.scene.background || '') ? selections.scene.background : (selections.scene.background ? 'custom' : undefined)}
                        onSelect={(id) => updateSelection('scene', 'background', id)}
                    />
                    {(selections.scene.background === 'custom' || (selections.scene.background && !['studio', 'urban', 'nature', 'interior'].includes(selections.scene.background))) && (
                        <div className="animate-fade-in mt-4">
                            <textarea
                                placeholder="Describe your custom scene..."
                                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                                value={selections.scene.background === 'custom' ? '' : selections.scene.background}
                                onChange={(e) => updateSelection('scene', 'background', e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Props & Effects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Scene Props</h3>
                        <input
                            type="text"
                            placeholder="e.g., holding a coffee cup, sitting on a chair"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                            value={selections.scene.props}
                            onChange={(e) => updateSelection('scene', 'props', e.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Environmental Effects</h3>
                        <input
                            type="text"
                            placeholder="e.g., fog, rain, golden hour sun"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                            value={selections.scene.effects}
                            onChange={(e) => updateSelection('scene', 'effects', e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll set the scene for you.");
                            nextStep('styling');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('styling')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStylingStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={selections.goal === 'product' ? "How should the product be styled?" : "How should the model and items be styled?"} />

            <div className="mt-8 space-y-6">
                {selections.goal !== 'product' && (
                    <>
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Scissors size={16} /> Hair Style
                            </h3>
                            <input
                                type="text"
                                placeholder="e.g., sleek ponytail, messy bun, loose waves"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                                value={selections.styling.hair}
                                onChange={(e) => updateSelection('styling', 'hair', e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Palette size={16} /> Makeup Style
                            </h3>
                            <input
                                type="text"
                                placeholder="e.g., natural, bold red lip, smokey eye"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                                value={selections.styling.makeup}
                                onChange={(e) => updateSelection('styling', 'makeup', e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        {selections.goal === 'product' ? <Box size={16} /> : <Shirt size={16} />}
                        {selections.goal === 'product' ? 'Product Styling' : 'Item Styling'}
                    </h3>
                    <input
                        type="text"
                        placeholder={selections.goal === 'product'
                            ? "e.g., floating, flat lay, on a podium, dynamic angle"
                            : "e.g., tucked in, sleeves rolled up, unbuttoned"}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                        value={selections.styling.itemStyling}
                        onChange={(e) => updateSelection('styling', 'itemStyling', e.target.value)}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll handle the styling details.");
                            nextStep('camera');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('camera')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCameraStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message="You're the photographer. Set your camera specs." />

            <div className="mt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Shot Type</h3>
                        <OptionGrid
                            columns={2}
                            options={selections.goal === 'product' ? [
                                { id: 'macro', label: 'Macro Detail' },
                                { id: 'close_up', label: 'Close Up' },
                                { id: 'wide', label: 'Wide Shot' },
                                { id: 'overhead', label: 'Overhead / Flat Lay' }
                            ] : [
                                { id: 'full_body', label: 'Full Body' },
                                { id: 'waist_up', label: 'Waist Up' },
                                { id: 'close_up', label: 'Close Up' },
                                { id: 'macro', label: 'Macro' }
                            ]}
                            selectedId={selections.camera.shotType}
                            onSelect={(id) => updateSelection('camera', 'shotType', id)}
                        />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Camera Angle</h3>
                        <OptionGrid
                            columns={2}
                            options={[
                                { id: 'eye_level', label: 'Eye Level' },
                                { id: 'low_angle', label: 'Low Angle' },
                                { id: 'high_angle', label: 'High Angle' },
                                { id: 'dutch', label: 'Dutch Angle' }
                            ]}
                            selectedId={selections.camera.angle}
                            onSelect={(id) => updateSelection('camera', 'angle', id)}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Aperture size={16} /> Tech Specs
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"
                            value={selections.camera.focalLength}
                            onChange={(e) => updateSelection('camera', 'focalLength', e.target.value)}
                        >
                            <option value="">Focal Length</option>
                            <option value="24mm">24mm (Wide)</option>
                            <option value="35mm">35mm (Street)</option>
                            <option value="50mm">50mm (Standard)</option>
                            <option value="85mm">85mm (Portrait)</option>
                        </select>
                        <select
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"
                            value={selections.camera.aperture}
                            onChange={(e) => updateSelection('camera', 'aperture', e.target.value)}
                        >
                            <option value="">Aperture</option>
                            <option value="f/1.8">f/1.8 (Shallow)</option>
                            <option value="f/5.6">f/5.6 (Standard)</option>
                            <option value="f/11">f/11 (Deep)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll choose the best camera settings.");
                            nextStep('lighting');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('lighting')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLightingStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message="Lighting sets the mood. How should we light this?" />

            <div className="mt-8 space-y-8">
                <OptionGrid
                    columns={3}
                    options={[
                        { id: 'soft', label: 'Soft / Diffused', icon: <Sun size={18} /> },
                        { id: 'hard', label: 'Hard / Direct', icon: <Sun size={18} /> },
                        { id: 'cinematic', label: 'Cinematic', icon: <Sparkles size={18} /> },
                        { id: 'natural', label: 'Natural', icon: <Sun size={18} /> },
                        { id: 'studio', label: 'Studio', icon: <Box size={18} /> },
                        { id: 'neon', label: 'Neon', icon: <Sparkles size={18} /> }
                    ]}
                    selectedId={selections.lighting.preset}
                    onSelect={(id) => updateSelection('lighting', 'preset', id)}
                />

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400">Light Direction</h3>
                    <OptionGrid
                        columns={4}
                        options={[
                            { id: 'front', label: 'Front' },
                            { id: 'side', label: 'Side' },
                            { id: 'back', label: 'Backlight' },
                            { id: 'top', label: 'Top Down' }
                        ]}
                        selectedId={selections.lighting.direction}
                        onSelect={(id) => updateSelection('lighting', 'direction', id)}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll set up the perfect lighting.");
                            nextStep('output');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('output')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderOutputStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />

            <div className="mt-8 space-y-8 animate-fade-in">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Layout size={16} /> Format & Aspect Ratio
                    </h3>
                    <OptionGrid
                        columns={3}
                        options={[
                            { id: 'portrait', label: 'Portrait (4:5)', description: 'Instagram/Facebook Posts', icon: <Smartphone size={20} /> },
                            { id: 'stories', label: 'Stories (9:16)', description: 'TikTok/Reels/Stories', icon: <Smartphone size={20} /> },
                            { id: 'square', label: 'Square (1:1)', description: 'Instagram/LinkedIn', icon: <Box size={20} /> },
                            { id: 'landscape', label: 'Landscape (16:9)', description: 'YouTube/Web', icon: <Monitor size={20} /> },
                            { id: 'wide', label: 'Ultra Wide (21:9)', description: 'Cinematic/Header', icon: <Monitor size={20} /> }
                        ]}
                        selectedId={selections.output.pack}
                        onSelect={(id) => updateSelection('output', 'pack', id)}
                    />
                </div>

                {/* Number of Images & Quality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Copy size={16} /> Number of Images
                        </h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {[1, 2, 4].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        // Logic to update number of images (mocked for now as it's not in state)
                                    }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${num === 1 // Defaulting to 1 for UI state
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Sparkles size={16} /> Image Quality
                        </h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {['Standard', 'High', 'Ultra'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => updateSelection('output', 'quality', q.toLowerCase())}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selections.output.quality === q.toLowerCase()
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <MessageSquare size={16} /> Additional Instructions (Optional)
                    </h3>
                    <textarea
                        placeholder="Add any specific details, lighting adjustments, or social media requirements..."
                        className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                        value={selections.customPrompt}
                        onChange={(e) => updateSelection('customPrompt', null, e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-zinc-900">
                    <button
                        onClick={async () => {
                            setCurrentStep('generating');
                            // Construct prompt from all selections
                            // Construct prompt from all selections
                            let constructedPrompt = selections.customPrompt;

                            if (!constructedPrompt) {
                                if (selections.goal === 'product') {
                                    constructedPrompt = `
                                        Product photography of the uploaded object.
                                        Styling: ${selections.styling.itemStyling}.
                                        Scene: ${selections.scene.background}, ${selections.scene.props}, ${selections.scene.effects}.
                                        Camera: ${selections.camera.shotType}, ${selections.camera.angle}, ${selections.camera.focalLength}, ${selections.camera.aperture}.
                                        Lighting: ${selections.lighting.preset}, ${selections.lighting.direction}.
                                        Format: ${selections.output.pack}.
                                    `;
                                } else {
                                    constructedPrompt = `
                                        ${selections.goal} of ${selections.person || 'a model'} wearing ${selections.items.length} items.
                                        Scene: ${selections.scene.background}, ${selections.scene.props}, ${selections.scene.effects}.
                                        Styling: ${selections.styling.hair}, ${selections.styling.makeup}, ${selections.styling.itemStyling}.
                                        Camera: ${selections.camera.shotType}, ${selections.camera.angle}, ${selections.camera.focalLength}, ${selections.camera.aperture}.
                                        Lighting: ${selections.lighting.preset}, ${selections.lighting.direction}.
                                        Format: ${selections.output.pack}.
                                    `;
                                }
                            }

                            // Collect all images
                            const imagesToGenerate = [
                                selections.uploadedPersonImage,
                                ...selections.items
                            ].filter(Boolean) as string[];

                            await generateAsset(user, async (count) => {
                                setCurrentStep('result');
                            }, constructedPrompt, imagesToGenerate);
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        Generate Images
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGeneratingStep = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={32} className="text-emerald-400 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Creating your vision...</h2>
                <p className="text-zinc-400">Chason is orchestrating your photoshoot</p>
            </div>
        </div>
    );

    const renderSocialBrandStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8 space-y-6">
                <OptionGrid
                    columns={1}
                    options={[
                        { id: 'fashion', label: 'Fashion/lifestyle brand targeting Gen Z', icon: <User size={20} /> },
                        { id: 'tech', label: 'Tech startup targeting B2B professionals', icon: <Monitor size={20} /> },
                        { id: 'food', label: 'Food & beverage company targeting families', icon: <Box size={20} /> },
                        { id: 'custom', label: 'Type your own', icon: <MessageSquare size={20} /> }
                    ]}
                    selectedId={['fashion', 'tech', 'food'].includes(selections.social.brand) ? selections.social.brand : (selections.social.brand ? 'custom' : undefined)}
                    onSelect={(id) => {
                        updateSelection('social', 'brand', id);
                        if (id !== 'custom') {
                            setChasonMessage("Great! Moving on to your goals.");
                            setTimeout(() => nextStep('social_goal'), 800);
                        }
                    }}
                />
                {(selections.social.brand === 'custom' || (selections.social.brand && !['fashion', 'tech', 'food'].includes(selections.social.brand))) && (
                    <div className="animate-fade-in">
                        <textarea
                            placeholder="Describe your brand and target audience..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.social.brand === 'custom' ? '' : selections.social.brand}
                            onChange={(e) => updateSelection('social', 'brand', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll infer the brand details.");
                            nextStep('social_goal');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_goal')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div >
    );

    const renderSocialGoalStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8">
                <OptionGrid
                    columns={1}
                    options={[
                        { id: 'engagement', label: 'Drive engagement (likes, comments, shares)', icon: <Share2 size={20} /> },
                        { id: 'promotion', label: 'Promote a new product or event', icon: <Sparkles size={20} /> },
                        { id: 'awareness', label: 'Build brand awareness', icon: <Sun size={20} /> },
                        { id: 'custom', label: 'Type your own', icon: <MessageSquare size={20} /> }
                    ]}
                    selectedId={selections.social.goal || undefined}
                    onSelect={(id) => {
                        updateSelection('social', 'goal', id);
                        if (id !== 'custom') {
                            setChasonMessage("Understood. What are the themes?");
                            setTimeout(() => nextStep('social_themes'), 800);
                        }
                    }}
                />
                {(selections.social.goal === 'custom' || (selections.social.goal && !['engagement', 'promotion', 'awareness'].includes(selections.social.goal))) && (
                    <div className="animate-fade-in mt-4">
                        <textarea
                            placeholder="Describe your primary goal..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.social.goal === 'custom' ? '' : selections.social.goal}
                            onChange={(e) => updateSelection('social', 'goal', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll determine the best goal.");
                            nextStep('social_themes');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_themes')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div >
    );

    const renderSocialThemesStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8">
                <OptionGrid
                    columns={1}
                    options={[
                        { id: 'tips', label: 'Tips and tricks', icon: <Wand2 size={20} /> },
                        { id: 'bts', label: 'Behind the scenes', icon: <Camera size={20} /> },
                        { id: 'testimonials', label: 'Customer stories/testimonials', icon: <MessageSquare size={20} /> },
                        { id: 'custom', label: 'Type your own (or upload calendar)', icon: <Upload size={20} /> }
                    ]}
                    selectedId={['tips', 'bts', 'testimonials'].includes(selections.social.themes) ? selections.social.themes : (selections.social.themes ? 'custom' : undefined)}
                    onSelect={(id) => {
                        updateSelection('social', 'themes', id);
                        if (id !== 'custom') {
                            setChasonMessage("Excellent. Do you have assets?");
                            setTimeout(() => nextStep('social_assets'), 800);
                        }
                    }}
                />
                {(selections.social.themes === 'custom' || (selections.social.themes && !['tips', 'bts', 'testimonials'].includes(selections.social.themes))) && (
                    <div className="animate-fade-in mt-4">
                        <textarea
                            placeholder="Describe your themes or topics..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.social.themes === 'custom' ? '' : selections.social.themes}
                            onChange={(e) => updateSelection('social', 'themes', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll suggest some themes.");
                            nextStep('social_assets');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_assets')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div >
    );

    const renderSocialAssetsStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selections.social.assets.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 group">
                            <img src={img} alt={`Asset ${idx} `} className="w-full h-full object-cover" />
                            <button
                                onClick={() => {
                                    const newAssets = selections.social.assets.filter((_, i) => i !== idx);
                                    updateSelection('social', 'assets', newAssets);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all">
                        <Upload size={24} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500 mt-2">Upload Assets</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files) as File[];
                                    files.forEach(file => {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                updateSelection('social', 'assets', [...selections.social.assets, ev.target.result as string]);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    });
                                }
                            }}
                        />
                    </label>
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => nextStep('social_platforms')}
                        className="px-6 py-2 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        Skip / No Assets
                    </button>
                    <button
                        onClick={() => nextStep('social_platforms')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSocialPlatformsStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8">
                <OptionGrid
                    columns={2}
                    options={[
                        { id: 'instagram', label: 'Instagram (posts & stories)', icon: <Smartphone size={20} /> },
                        { id: 'linkedin', label: 'LinkedIn (posts & banners)', icon: <Monitor size={20} /> },
                        { id: 'facebook_x', label: 'Facebook & X/Twitter', icon: <Share2 size={20} /> },
                        { id: 'custom', label: 'Type your own', icon: <Settings2 size={20} /> }
                    ]}
                    selectedId={selections.social.platforms[0] || undefined}
                    onSelect={(id) => {
                        updateSelection('social', 'platforms', [id]);
                        if (id !== 'custom') {
                            setChasonMessage("Perfect. What's the visual style?");
                            setTimeout(() => nextStep('social_style'), 800);
                        }
                    }}
                />
                {selections.social.platforms[0] === 'custom' && (
                    <div className="animate-fade-in mt-4">
                        <textarea
                            placeholder="Specify platforms and formats..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.social.platforms[0] === 'custom' ? '' : selections.social.platforms[0]}
                            onChange={(e) => updateSelection('social', 'platforms', [e.target.value])}
                        />
                    </div>
                )}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll pick the best platforms.");
                            nextStep('social_style');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_style')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div >
    );

    const renderSocialStyleStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8 space-y-6">
                <OptionGrid
                    columns={2}
                    options={[
                        { id: 'minimal', label: 'Minimal & clean', icon: <Box size={20} /> },
                        { id: 'bold', label: 'Bold & colorful', icon: <Sun size={20} /> },
                        { id: 'artistic', label: 'Illustrated/artistic', icon: <Palette size={20} /> },
                        { id: 'custom', label: 'Type your own', icon: <Upload size={20} /> }
                    ]}
                    selectedId={['minimal', 'bold', 'artistic'].includes(selections.social.style) ? selections.social.style : (selections.social.style ? 'custom' : undefined)}
                    onSelect={(id) => {
                        updateSelection('social', 'style', id);
                        if (id !== 'custom') {
                            setChasonMessage("Beautiful. Finally, any text?");
                        }
                    }}
                />

                {(selections.social.style === 'custom' || (selections.social.style && !['minimal', 'bold', 'artistic'].includes(selections.social.style))) && (
                    <div className="animate-fade-in">
                        <textarea
                            placeholder="Describe the style..."
                            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none mb-4"
                            value={selections.social.style === 'custom' ? '' : selections.social.style}
                            onChange={(e) => updateSelection('social', 'style', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                {/* Persistent Style Reference Upload */}
                <div className="animate-fade-in">
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Style Reference (Optional)</h3>
                    <label className="w-full h-32 rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                        {selections.social.styleReference ? (
                            <div className="relative h-full w-full flex items-center justify-center">
                                <img src={selections.social.styleReference} alt="Style Ref" className="h-full object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-sm">Change Image</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Upload size={24} className="text-zinc-500 mb-2 group-hover:text-emerald-500" />
                                <span className="text-zinc-400 group-hover:text-zinc-300">Upload Competitor/Style Reference</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        updateSelection('social', 'styleReference', ev.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll choose a style that fits.");
                            nextStep('social_text');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_text')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSocialTextStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />
            <div className="mt-8 space-y-6">
                <OptionGrid
                    columns={1}
                    options={[
                        { id: 'quotes', label: 'Inspirational quotes and trending hashtags (PNG)', icon: <MessageSquare size={20} /> },
                        { id: 'product', label: 'Product highlights and “Shop Now” CTA (PSD)', icon: <Box size={20} /> },
                        { id: 'reviews', label: 'Customer reviews with “Learn More” (MP4)', icon: <MessageSquare size={20} /> },
                        { id: 'custom', label: 'Type your own / Upload text file', icon: <Upload size={20} /> }
                    ]}
                    selectedId={selections.social.textPreferences || undefined}
                    onSelect={(id) => {
                        updateSelection('social', 'textPreferences', id);
                    }}
                />
                {selections.social.textPreferences === 'custom' && (
                    <div className="animate-fade-in space-y-4">
                        <textarea
                            placeholder="Specify text, hashtags, CTAs..."
                            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            onBlur={(e) => updateSelection('social', 'textPreferences', e.target.value)}
                        />
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll generate the text for you.");
                            nextStep('social_output');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => nextStep('social_output')}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );
    const renderSocialOutputStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} />

            <div className="mt-8 space-y-8 animate-fade-in">
                {/* Format / Aspect Ratio */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Layout size={16} /> Format & Aspect Ratio
                    </h3>
                    <OptionGrid
                        columns={3}
                        options={[
                            { id: 'portrait', label: 'Portrait (4:5)', description: 'Instagram/Facebook Posts', icon: <Smartphone size={20} /> },
                            { id: 'stories', label: 'Stories (9:16)', description: 'TikTok/Reels/Stories', icon: <Smartphone size={20} /> },
                            { id: 'square', label: 'Square (1:1)', description: 'Instagram/LinkedIn', icon: <Box size={20} /> },
                            { id: 'landscape', label: 'Landscape (16:9)', description: 'YouTube/Web', icon: <Monitor size={20} /> },
                        ]}
                        selectedId={selections.output.pack}
                        onSelect={(id) => updateSelection('output', 'pack', id)}
                    />
                </div>

                {/* Number of Images & Quality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Copy size={16} /> Number of Images
                        </h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {[1, 2, 4].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setNumberOfImages(num)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${numberOfImages === num
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Sparkles size={16} /> Image Quality
                        </h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {['Standard', 'High', 'Ultra'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => updateSelection('output', 'quality', q.toLowerCase())}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selections.output.quality === q.toLowerCase()
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-zinc-900">
                    <button
                        onClick={async () => {
                            setCurrentStep('generating');
                            // Construct prompt for social media
                            const constructedPrompt = `
                                Create social media graphics for ${selections.social.brand}.
                                Goal: ${selections.social.goal}.
                                Themes: ${selections.social.themes}.
                                Platforms: ${selections.social.platforms.join(', ')}.
                                Style: ${selections.social.style}.
                                Text/Content: ${selections.social.textPreferences}.
                                Format: ${selections.output.pack}.
                                Quality: ${selections.output.quality}.
                            `;

                            // Collect all images
                            const imagesToGenerate = [
                                ...selections.social.assets,
                                selections.social.styleReference,
                                selections.social.textReference
                            ].filter(Boolean) as string[];

                            await generateAsset(user, async (count) => {
                                setCurrentStep('result');
                            }, constructedPrompt, imagesToGenerate);
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        Generate Graphics
                    </button>
                </div>
            </div>
        </div>
    );

    const renderResultStep = () => (
        <div className="flex flex-col h-full animate-fade-in p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your Results</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setSelections({
                                goal: null,
                                person: null,
                                uploadedPersonImage: null,
                                personDescription: '',
                                items: [],
                                scene: { background: null, props: '', effects: '' },
                                styling: { hair: '', makeup: '', itemStyling: '' },
                                camera: { shotType: '', angle: '', focalLength: '', aperture: '', expression: '' },
                                lighting: { direction: '', quality: '', preset: '' },
                                output: { pack: 'none', quality: 'standard' as 'standard' | 'high' | 'ultra' },
                                customPrompt: ''
                            });
                            setHistory([]);
                            setCurrentStep('goal');
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Start New
                    </button>
                    <button
                        onClick={() => setCurrentStep('output')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-sm font-medium transition-colors"
                    >
                        Regenerate
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
                {generatedImages?.map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden group bg-zinc-900">
                        {img ? (
                            <img src={img} alt={`Result ${idx} `} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <ImageIcon size={32} />
                            </div>
                        )}
                        {img && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setSelectedImageForVideo(img);
                                        setShowVideoModal(true);
                                    }}
                                    className="p-2 bg-emerald-900/60 hover:bg-emerald-900/80 backdrop-blur-md border border-emerald-500/30 text-emerald-100 hover:text-white rounded-full shadow-lg shadow-emerald-900/20 transition-all"
                                    title="Generate Video"
                                >
                                    <Video className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // Mockup Workflow Step Renderers
    const renderMockupDesignStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} onAction={handleAction} />
            <div className="mt-8 space-y-6">
                {/* Brand/Product Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Product or Brand Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Nike, Apple, MyBrand"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-colors"
                        value={selections.mockup.name}
                        onChange={(e) => updateSelection('mockup', 'name', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Design Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Upload Design / Logo</label>
                        <label className="w-full h-48 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden">
                            {selections.mockup.design ? (
                                <img src={selections.mockup.design} alt="Design" className="w-full h-full object-contain p-4" />
                            ) : (
                                <>
                                    <Upload size={24} className="text-zinc-500 group-hover:text-emerald-500 mb-2" />
                                    <span className="text-zinc-400 text-sm">Upload Design</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => updateSelection('mockup', 'design', ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </label>
                    </div>

                    {/* Reference Mockup Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Reference Style (Optional)</label>
                        <label className="w-full h-48 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden">
                            {selections.mockup.reference ? (
                                <img src={selections.mockup.reference} alt="Reference" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon size={24} className="text-zinc-500 group-hover:text-emerald-500 mb-2" />
                                    <span className="text-zinc-400 text-sm">Upload Reference</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => updateSelection('mockup', 'reference', ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("No problem! We can proceed without a specific design.");
                            nextStep('mockup_product');
                        }}
                        className="px-6 py-2 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 rounded-lg transition-all mr-4 border border-zinc-700"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => {
                            setChasonMessage("Great! Now let's choose the product type.");
                            nextStep('mockup_product');
                        }}
                        disabled={!selections.mockup.design}
                        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMockupProductStep = () => {
        const productCategories = [
            {
                id: 'apparel', label: 'Apparel', icon: <Shirt size={20} />, products: [
                    { id: 't-shirt', label: 'T-Shirt' }, { id: 'hoodie', label: 'Hoodie' }, { id: 'hat', label: 'Hat' }, { id: 'tote-bag', label: 'Tote Bag' }
                ]
            },
            {
                id: 'tech', label: 'Tech', icon: <Smartphone size={20} />, products: [
                    { id: 'phone-case', label: 'Phone Case' }, { id: 'laptop-skin', label: 'Laptop Skin' }, { id: 'mouse-pad', label: 'Mouse Pad' }, { id: 'airpods-case', label: 'AirPods Case' }
                ]
            },
            {
                id: 'print', label: 'Print', icon: <Copy size={20} />, products: [
                    { id: 'business-card', label: 'Business Card' }, { id: 'poster', label: 'Poster' }, { id: 'flyer', label: 'Flyer' }, { id: 'sticker', label: 'Sticker' }
                ]
            },
            {
                id: 'accessories', label: 'Accessories', icon: <Box size={20} />, products: [
                    { id: 'mug', label: 'Mug' }, { id: 'water-bottle', label: 'Water Bottle' }, { id: 'notebook', label: 'Notebook' }, { id: 'tote', label: 'Tote Bag' }
                ]
            }
        ];
        const selectedCategory = productCategories.find(c => c.id === selections.mockup.productCategory);
        return (
            <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
                <ChatBubble message={chasonMessage} onAction={handleAction} />
                <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400">Product Category</h3>
                        <OptionGrid columns={4} options={productCategories.map(cat => ({ id: cat.id, label: cat.label, icon: cat.icon }))} selectedId={selections.mockup.productCategory} onSelect={(id) => { updateSelection('mockup', 'productCategory', id); updateSelection('mockup', 'productType', ''); }} />
                    </div>
                    {selectedCategory && (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="text-sm font-medium text-zinc-400">Select Product</h3>
                            <OptionGrid columns={2} options={selectedCategory.products} selectedId={selections.mockup.productType} onSelect={(id) => updateSelection('mockup', 'productType', id)} />
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setChasonMessage("I'll choose a suitable product for you.");
                                nextStep('mockup_view');
                            }}
                            className="px-6 py-2 text-zinc-400 font-medium hover:text-white transition-colors mr-4"
                        >
                            Skip
                        </button>
                        <button onClick={() => nextStep('mockup_view')} disabled={!selections.mockup.productType} className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Next Step
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMockupViewStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} onAction={handleAction} />
            <div className="mt-8 space-y-6">
                <OptionGrid columns={2} options={[
                    { id: 'front', label: 'Front View', description: 'Straight-on product view' },
                    { id: 'angled', label: 'Angled View', description: '3/4 perspective view' },
                    { id: 'lifestyle', label: 'Lifestyle Shot', description: 'Product in use/context' },
                    { id: 'flat-lay', label: 'Flat Lay', description: 'Overhead flat layout' }
                ]} selectedId={selections.mockup.viewAngle} onSelect={(id) => updateSelection('mockup', 'viewAngle', id)} />
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll select the best angle for the shot.");
                            nextStep('mockup_background');
                        }}
                        className="px-6 py-2 text-zinc-400 font-medium hover:text-white transition-colors mr-4"
                    >
                        Skip
                    </button>
                    <button onClick={() => nextStep('mockup_background')} disabled={!selections.mockup.viewAngle} className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMockupBackgroundStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} onAction={handleAction} />
            <div className="mt-8 space-y-6">
                <OptionGrid columns={3} options={[
                    { id: 'studio-white', label: 'Studio White', description: 'Clean white background' },
                    { id: 'studio-black', label: 'Studio Black', description: 'Dramatic black background' },
                    { id: 'lifestyle', label: 'Lifestyle', description: 'Natural environment' },
                    { id: 'transparent', label: 'Transparent', description: 'No background' },
                    { id: 'gradient', label: 'Gradient', description: 'Colorful gradient' },
                    { id: 'custom', label: 'Custom', description: 'Describe your own' }
                ]} selectedId={['studio-white', 'studio-black', 'lifestyle', 'transparent', 'gradient'].includes(selections.mockup.background || '') ? selections.mockup.background : (selections.mockup.background ? 'custom' : undefined)}
                    onSelect={(id) => updateSelection('mockup', 'background', id)} />

                {(selections.mockup.background === 'custom' || (selections.mockup.background && !['studio-white', 'studio-black', 'lifestyle', 'transparent', 'gradient'].includes(selections.mockup.background))) && (
                    <div className="animate-fade-in mt-4">
                        <textarea
                            placeholder="Describe your custom background..."
                            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                            value={selections.mockup.background === 'custom' ? '' : selections.mockup.background}
                            onChange={(e) => updateSelection('mockup', 'background', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setChasonMessage("I'll choose a background that fits perfectly.");
                            nextStep('mockup_output');
                        }}
                        className="px-6 py-2 text-zinc-400 font-medium hover:text-white transition-colors mr-4"
                    >
                        Skip
                    </button>
                    <button onClick={() => nextStep('mockup_output')} disabled={!selections.mockup.background} className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMockupOutputStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
            <ChatBubble message={chasonMessage} onAction={handleAction} />
            <div className="mt-8 space-y-8 animate-fade-in">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Layout size={16} /> Aspect Ratio</h3>
                    <OptionGrid columns={3} options={[
                        { id: 'square', label: 'Square (1:1)', icon: <Box size={20} /> },
                        { id: 'portrait', label: 'Portrait (4:5)', icon: <Smartphone size={20} /> },
                        { id: 'landscape', label: 'Landscape (16:9)', icon: <Monitor size={20} /> }
                    ]} selectedId={selections.output.pack} onSelect={(id) => updateSelection('output', 'pack', id)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Copy size={16} /> Number of Variations</h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {[1, 2, 4].map((num) => (
                                <button key={num} onClick={() => setNumberOfImages(num)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${numberOfImages === num ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>{num}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Sparkles size={16} /> Quality</h3>
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {['Standard', 'High', 'Ultra'].map((q) => (
                                <button key={q} onClick={() => updateSelection('output', 'quality', q.toLowerCase())} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selections.output.quality === q.toLowerCase() ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>{q}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => {
                        let prompt = `Create a realistic product mockup of a ${selections.mockup.productType || 'product'}`;
                        if (selections.mockup.name) prompt += ` for brand "${selections.mockup.name}"`;
                        prompt += ` with the uploaded design placed on it.`;

                        if (selections.mockup.viewAngle) prompt += ` View: ${selections.mockup.viewAngle}.`;
                        if (selections.mockup.background) prompt += ` Background: ${selections.mockup.background}.`;

                        if (selections.mockup.reference) {
                            prompt += ` STYLE REFERENCE INSTRUCTION: Use the second image as a STRICT style reference. Mimic its texture, lighting, material, and composition exactly. The output must look like it belongs in the same photoshoot as the reference image.`;
                        }

                        prompt += ` Ensure the design is properly scaled and positioned on the product with realistic lighting, shadows, and perspective.`;

                        updateSelection('customPrompt', null, prompt);
                        nextStep('generating');
                    }} className="px-8 py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-2">
                        <Sparkles size={20} /> Generate Mockup
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full bg-zinc-950 text-white overflow-y-auto">
            {/* Header / Back Button */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-4 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
                {(history.length > 0 || onBack) && (
                    <button
                        onClick={goBack}
                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                )}
                <div className="flex flex-col">
                    <h1 className="font-bold text-lg">Chason</h1>
                    <span className="text-xs text-zinc-500">Design AGI • {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}</span>
                </div>
            </div>

            {/* Main workflow area */}
            <div className="flex-1 overflow-y-auto pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        {currentStep === 'goal' && renderGoalStep()}
                        {currentStep === 'person' && renderPersonStep()}
                        {currentStep === 'items' && renderItemsStep()}
                        {currentStep === 'scene' && renderSceneStep()}
                        {currentStep === 'styling' && renderStylingStep()}
                        {currentStep === 'camera' && renderCameraStep()}
                        {currentStep === 'lighting' && renderLightingStep()}
                        {currentStep === 'output' && renderOutputStep()}
                        {currentStep === 'generating' && renderGeneratingStep()}
                        {currentStep === 'result' && renderResultStep()}

                        {/* Social Media Workflow Steps */}
                        {currentStep === 'social_brand' && renderSocialBrandStep()}
                        {currentStep === 'social_goal' && renderSocialGoalStep()}
                        {currentStep === 'social_themes' && renderSocialThemesStep()}
                        {currentStep === 'social_assets' && renderSocialAssetsStep()}
                        {currentStep === 'social_platforms' && renderSocialPlatformsStep()}
                        {currentStep === 'social_style' && renderSocialStyleStep()}
                        {currentStep === 'social_text' && renderSocialTextStep()}
                        {currentStep === 'social_output' && renderSocialOutputStep()}

                        {/* Product Mockup Workflow Steps */}
                        {currentStep === 'mockup_design' && renderMockupDesignStep()}
                        {currentStep === 'mockup_product' && renderMockupProductStep()}
                        {currentStep === 'mockup_view' && renderMockupViewStep()}
                        {currentStep === 'mockup_background' && renderMockupBackgroundStep()}
                        {currentStep === 'mockup_output' && renderMockupOutputStep()}

                    </motion.div>
                </AnimatePresence>
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
                            // Show success (VideoGenerationModal handles the alert)
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
        </div>
    );
};

// Helper Icons
const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
