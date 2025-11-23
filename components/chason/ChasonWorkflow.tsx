
import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
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
    Loader2
} from 'lucide-react';
import { ASPECT_RATIOS_LIBRARY } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubble } from './ui/ChatBubble';
import { OptionGrid, OptionItem } from './ui/OptionGrid';
import { ChasonChatInput } from './ChasonChatInput';

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
    | 'result';

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

    const [currentStep, setCurrentStep] = useState<ChasonStep>('goal');
    const [history, setHistory] = useState<ChasonStep[]>([]);

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
        customPrompt: ''
    });

    const nextStep = (step: ChasonStep) => {
        setHistory(prev => [...prev, currentStep]);
        setCurrentStep(step);

        // Set appropriate message for the next step
        const stepMessages: Record<ChasonStep, string> = {
            'goal': "Welcome to the studio. I'm Chason, your Design AGI. What would you like to create today?",
            'person': "Great choice. Now, who is the subject of this photoshoot?",
            'items': `Please upload the ${selections.goal === 'photoshoot' ? 'apparel and all the accessories' : 'items'} you want your model to wear.`,
            'scene': "Perfect! Now let's set the scene. What kind of environment do you envision?",
            'styling': "Excellent! Let's add some styling details to make this perfect.",
            'camera': "Great! Now let's set up the perfect shot. How should we frame this?",
            'lighting': "Almost there! Let's perfect the lighting for this shot.",
            'output': "Wonderful! Let's finalize the output settings.",
            'generating': "I'm generating your vision now...",
            'result': getChasonResponse('readyToGenerate')
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
    const handleWorkflowSelect = (workflow: 'apparel' | 'product') => {
        updateSelection('goal', null, workflow === 'apparel' ? 'photoshoot' : 'product');
        setChasonMessage(getChasonResponse('goalSelected'));
        setTimeout(() => nextStep('person'), 800);
    };

    // --- Step Renderers ---

    const renderGoalStep = () => (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
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
                    ]}
                    onSelect={(id) => {
                        updateSelection('goal', null, id);
                        setChasonMessage(getChasonResponse('goalSelected'));
                        setTimeout(() => nextStep('person'), 800);
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
                        selectedId={selections.scene.background || undefined}
                        onSelect={(id) => updateSelection('scene', 'background', id)}
                    />
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
            <ChatBubble message="How should the model and items be styled?" />

            <div className="mt-8 space-y-6">
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

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Shirt size={16} /> Item Styling
                    </h3>
                    <input
                        type="text"
                        placeholder="e.g., tucked in, sleeves rolled up, unbuttoned"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors"
                        value={selections.styling.itemStyling}
                        onChange={(e) => updateSelection('styling', 'itemStyling', e.target.value)}
                    />
                </div>

                <div className="flex justify-end">
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
                            options={[
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
            <ChatBubble message="Almost done. Finalize your output settings." />

            <div className="mt-8 space-y-8">
                {/* Aspect Ratio */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-emerald-400" />
                        Aspect Ratio
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {ASPECT_RATIOS_LIBRARY.map((ar) => (
                            <button
                                key={ar.id}
                                onClick={() => selectAspectRatio(ar)}
                                className={`p - 3 rounded - xl border flex flex - col items - center justify - center gap - 2 transition - all ${aspectRatio.id === ar.id
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                    } `}
                            >
                                <div className="scale-75">{ar.icon}</div>
                                <span className="text-xs font-medium">{ar.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Number of Images */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Layers size={18} className="text-emerald-400" />
                        Number of Images
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 4, 8].map((num) => (
                            <button
                                key={num}
                                onClick={() => setNumberOfImages(num)}
                                className={`p - 3 rounded - xl border flex items - center justify - center transition - all ${numberOfImages === num
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                    } `}
                            >
                                <span className="text-lg font-bold">{num}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Image Quality */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald-400" />
                        Image Quality
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => updateSelection('output', 'quality', 'standard')}
                            className={`p - 4 rounded - xl border flex flex - col items - center justify - center gap - 2 transition - all ${selections.output.quality === 'standard'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                } `}
                        >
                            <span className="text-sm font-semibold">Standard</span>
                            <span className="text-xs text-zinc-500">Fast generation</span>
                        </button>
                        <button
                            onClick={() => updateSelection('output', 'quality', 'high')}
                            className={`p - 4 rounded - xl border flex flex - col items - center justify - center gap - 2 transition - all ${selections.output.quality === 'high'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                } `}
                        >
                            <span className="text-sm font-semibold">High</span>
                            <span className="text-xs text-zinc-500">Better quality</span>
                        </button>
                        <button
                            onClick={() => updateSelection('output', 'quality', 'ultra')}
                            className={`p - 4 rounded - xl border flex flex - col items - center justify - center gap - 2 transition - all ${selections.output.quality === 'ultra'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                } `}
                        >
                            <span className="text-sm font-semibold">Ultra</span>
                            <span className="text-xs text-zinc-500">Maximum detail</span>
                        </button>
                    </div>
                </div>

                {/* Custom Prompt Override */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Wand2 size={16} /> Custom Prompt Override (Optional)
                    </h3>
                    <textarea
                        placeholder="Override all settings with a custom prompt..."
                        className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                        value={selections.customPrompt}
                        onChange={(e) => updateSelection('customPrompt', null, e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => {
                            // Logic to save look
                            alert('Look saved!');
                        }}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} /> Save Look
                    </button>
                    <button
                        onClick={async () => {
                            setCurrentStep('generating');
                            // Construct prompt from all selections
                            const constructedPrompt = selections.customPrompt || `
                                ${selections.goal} of ${selections.person || 'a model'} wearing ${selections.items.length} items.
    Scene: ${selections.scene.background}, ${selections.scene.props}, ${selections.scene.effects}.
Styling: ${selections.styling.hair}, ${selections.styling.makeup}, ${selections.styling.itemStyling}.
Camera: ${selections.camera.shotType}, ${selections.camera.angle}, ${selections.camera.focalLength}, ${selections.camera.aperture}.
Lighting: ${selections.lighting.preset}, ${selections.lighting.direction}.
`;

                            // Collect all images
                            const imagesToGenerate = [
                                selections.uploadedPersonImage,
                                ...selections.items
                            ].filter(Boolean) as string[];

                            await generateAsset(null, async (count) => {
                                setCurrentStep('result');
                            }, constructedPrompt, imagesToGenerate);
                        }}
                        className="px-8 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
                    >
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
                    </div>
                ))}
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
                        {currentStep === 'generating' && (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-8"></div>
                                <h2 className="text-2xl font-bold mb-2 animate-pulse">Generating your vision...</h2>
                                <p className="text-zinc-400 max-w-md">
                                    Chason is synthesizing all your choices into a photorealistic image. This usually takes about 15-30 seconds.
                                </p>
                            </div>
                        )}
                        {currentStep === 'result' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-grow p-4 flex items-center justify-center bg-zinc-900/30">
                                    {isGenerating ? (
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4"></div>
                                            <p className="text-zinc-400">Finalizing details...</p>
                                        </div>
                                    ) : generatedImages && generatedImages.length > 0 ? (
                                        <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10 group">
                                            <img
                                                src={generatedImages[activeImageIndex || 0]}
                                                alt="Generated Result"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-white font-medium mb-1">Generated with Chason</p>
                                                        <p className="text-xs text-zinc-400">{new Date().toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors">
                                                            <DownloadIcon />
                                                        </button>
                                                        <button className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors font-medium px-4">
                                                            Upscale
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-red-400">
                                            <p>Something went wrong. Please try again.</p>
                                            <button
                                                onClick={() => setCurrentStep('output')}
                                                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md">
                                    <div className="max-w-3xl mx-auto flex items-center gap-4">
                                        <ChatBubble message={chasonMessage} />
                                        <div className="flex-grow">
                                            <ChasonChatInput
                                                onSendMessage={(msg) => handleChatMessage(msg)}
                                                placeholder="Refine result (e.g., 'Make the lighting warmer')"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>


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
