import React, { useState } from 'react';
import { 
    Image, 
    User, 
    Package, 
    Wand2, 
    Film,
    Sparkles,
    Camera,
    Palette,
    Zap,
    ArrowRight,
    Lock,
    Instagram
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ImageGallery } from './ImageGallery';

interface WorkflowCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    badge?: 'NEW' | 'POPULAR' | 'PRO';
    isLocked?: boolean;
    image?: string;
}

// Mapping workflow IDs to image filenames
const getWorkflowImage = (workflowId: string): string => {
    const imageMap: Record<string, string> = {
        'ai-photoshoot': '/workflow-images/AI PHOTOSHOOT.png',
        'product-photography': '/workflow-images/Product Photography.png',
        'virtual-tryon': '/workflow-images/Virtual Try On.png',
        'photo-editor': '/workflow-images/Photo Editor.png',
        'storyboard': '/workflow-images/Photo To prompt.png',
        'social-media-posts': '/workflow-images/Social Media post.png',
        'style-transfer': '/workflow-images/Style Transfer.png',
        'upscale': '/workflow-images/Image Upscale.png',
    };
    return imageMap[workflowId] || '';
};

interface DashboardHomeProps {
    onSelectWorkflow: (workflowId: string) => void;
    userPlan: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onSelectWorkflow, userPlan }) => {
    const handleNavigateToWorkflow = (workflowId: string) => {
        onSelectWorkflow(workflowId);
    };
    const { checkSubscriptionStatus } = useAuth();
    const isFreePlan = userPlan === 'free';
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    const handleWorkflowClick = (workflow: WorkflowCard) => {
        if (workflow.isLocked) {
            // Show payment modal for locked workflows
            checkSubscriptionStatus();
        } else {
            onSelectWorkflow(workflow.id);
        }
    };

    // Determine feature access based on new pricing structure:
    // BASIC (solo): AI Photoshoot, Product Photography, Photo to Prompt, Social Media Posts
    // PRO (studio): Everything in BASIC + Virtual Try-On, Photo Editor, Style Transfer, Image Upscale
    // ADVANCE (brand): Everything in PRO + Advance Mode
    // Free: Only AI Photoshoot
    const isBasicPlan = userPlan === 'solo';
    const isProPlan = userPlan === 'studio';
    const isAdvancePlan = userPlan === 'brand';

    const workflows: WorkflowCard[] = [
        {
            id: 'ai-photoshoot',
            title: 'AI Photoshoot',
            description: 'Professional fashion & lifestyle imagery',
            icon: <Camera className="w-5 h-5" />,
            gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
            badge: 'POPULAR',
            image: getWorkflowImage('ai-photoshoot'),
            // Available to all plans (including free)
        },
        {
            id: 'product-photography',
            title: 'Product Photography',
            description: 'Studio-grade product visuals',
            icon: <Package className="w-5 h-5" />,
            gradient: 'from-emerald-600 via-green-500 to-teal-500',
            isLocked: isFreePlan, // Available in BASIC+
            image: getWorkflowImage('product-photography'),
        },
        {
            id: 'virtual-tryon',
            title: 'Virtual Try-On',
            description: 'Realistic model visualization',
            icon: <User className="w-5 h-5" />,
            gradient: 'from-teal-500 via-cyan-500 to-emerald-500',
            badge: 'NEW',
            isLocked: !(isProPlan || isAdvancePlan), // Available in PRO+ (includes ADVANCE)
            image: getWorkflowImage('virtual-tryon'),
        },
        {
            id: 'photo-editor',
            title: 'Photo Editor',
            description: 'Advanced image manipulation',
            icon: <Wand2 className="w-5 h-5" />,
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            isLocked: !(isProPlan || isAdvancePlan), // Available in PRO+ (includes ADVANCE)
            image: getWorkflowImage('photo-editor'),
        },
        {
            id: 'storyboard',
            title: 'Photo to Prompt',
            description: 'Convert images to detailed prompts',
            icon: <Film className="w-5 h-5" />,
            gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
            badge: 'NEW',
            isLocked: isFreePlan, // Available in BASIC+
            image: getWorkflowImage('storyboard'),
        },
        {
            id: 'social-media-posts',
            title: 'Social Media Posts',
            description: 'Style-inspired batch content',
            icon: <Instagram className="w-5 h-5" />,
            gradient: 'from-teal-600 via-emerald-600 to-green-600',
            badge: 'PRO',
            isLocked: isFreePlan, // Available in BASIC+
            image: getWorkflowImage('social-media-posts'),
        },
        {
            id: 'style-transfer',
            title: 'Style Transfer',
            description: 'Cinematic color grading',
            icon: <Palette className="w-5 h-5" />,
            gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
            isLocked: !(isProPlan || isAdvancePlan), // Available in PRO+ (includes ADVANCE)
            image: getWorkflowImage('style-transfer'),
        },
        {
            id: 'upscale',
            title: 'Image Upscale',
            description: 'AI-powered resolution enhancement',
            icon: <Sparkles className="w-5 h-5" />,
            gradient: 'from-emerald-500 via-green-500 to-teal-600',
            isLocked: !(isProPlan || isAdvancePlan), // Available in PRO+ (includes ADVANCE)
            image: getWorkflowImage('upscale'),
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
            {/* Animated background with grid */}
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-teal-950/30 pointer-events-none" />
            
            {/* Grid pattern overlay */}
            <div 
                className="fixed inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            />
            
            {/* Floating orbs */}
            <div className="fixed top-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="fixed bottom-20 right-20 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-16">
                {/* Hero Header */}
                <div className="mb-16">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                            What would you like to
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            create today?
                        </span>
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl font-light">
                        Choose your creative workflow and start generating professional visuals with AI
                    </p>
                </div>

                {/* Workflow Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    {workflows.map((workflow) => (
                        <button
                            key={workflow.id}
                            onClick={() => handleWorkflowClick(workflow)}
                            onMouseEnter={() => setHoveredCard(workflow.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            className={`
                                group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500
                                hover:scale-[1.02] cursor-pointer
                                ${workflow.isLocked ? 'opacity-70' : ''}
                            `}
                        >
                            {/* Gradient border */}
                            <div className={`
                                absolute inset-0 rounded-2xl bg-gradient-to-r ${workflow.gradient} opacity-0 transition-opacity duration-500
                                ${hoveredCard === workflow.id && !workflow.isLocked ? 'opacity-100' : ''}
                            `} />
                            
                            {/* Card content */}
                            <div className="relative h-full bg-zinc-900/80 rounded-2xl p-6 backdrop-blur-xl border border-zinc-800 overflow-hidden">
                                {/* Badge */}
                                {workflow.badge && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider bg-zinc-800 rounded-full border border-zinc-700 text-zinc-300">
                                            {workflow.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Image */}
                                {workflow.image && (
                                    <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-zinc-800/50 relative">
                                        {/* Loading placeholder */}
                                        {!loadedImages.has(workflow.id) && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse" />
                                        )}
                                        <img 
                                            src={workflow.image} 
                                            alt={workflow.title}
                                            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                                                loadedImages.has(workflow.id) 
                                                    ? 'opacity-100 scale-100' 
                                                    : 'opacity-0 scale-105'
                                            }`}
                                            onLoad={() => {
                                                setLoadedImages(prev => new Set(prev).add(workflow.id));
                                            }}
                                            onError={(e) => {
                                                console.error(`❌ Failed to load workflow image: ${workflow.image}`, workflow.id);
                                                // Try alternative path or show placeholder
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null; // Prevent infinite loop
                                                
                                                // Try with different case or path variations
                                                const altPath = workflow.image?.replace('/workflow-images/', '/workflow-images/').toLowerCase();
                                                if (altPath && altPath !== workflow.image) {
                                                    target.src = altPath;
                                                } else {
                                                    // Mark as loaded to hide placeholder even if image failed
                                                    setLoadedImages(prev => new Set(prev).add(workflow.id));
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`
                                    w-12 h-12 rounded-xl mb-6 flex items-center justify-center transition-all duration-500
                                    ${hoveredCard === workflow.id && !workflow.isLocked 
                                        ? `bg-gradient-to-br ${workflow.gradient}` 
                                        : 'bg-zinc-800/50'
                                    }
                                `}>
                                    <div className={`transition-colors duration-500 ${hoveredCard === workflow.id && !workflow.isLocked ? 'text-white' : 'text-zinc-400'}`}>
                                        {workflow.icon}
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <h3 className="text-base font-semibold mb-2 text-zinc-100">
                                    {workflow.title}
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                    {workflow.description}
                                </p>

                                {/* Action indicator */}
                                {!workflow.isLocked ? (
                                    <div className={`
                                        flex items-center gap-2 text-sm font-medium transition-all duration-500
                                        ${hoveredCard === workflow.id ? 'translate-x-1 opacity-100' : 'opacity-0'}
                                    `}>
                                        <span className="text-emerald-400">
                                            Get started
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                                    </div>
                                ) : (
                                    <div className={`
                                        flex items-center gap-2 text-sm font-medium transition-all duration-500
                                        ${hoveredCard === workflow.id ? 'translate-x-1 opacity-100' : 'opacity-0'}
                                    `}>
                                        <span className="text-amber-400">
                                            Upgrade to unlock
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-amber-400" />
                                    </div>
                                )}

                                {/* Lock icon badge */}
                                {workflow.isLocked && (
                                    <div className="absolute top-4 right-4">
                                        <div className="p-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg border border-zinc-700">
                                            <Lock className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Image Gallery */}
                <ImageGallery onNavigateToWorkflow={handleNavigateToWorkflow} />
            </div>
        </div>
    );
};

