import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, X, Loader2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { geminiService } from '../../services/geminiService';

interface SocialMediaPostsWorkflowProps {
    onBack: () => void;
    onOpenDailyLimitModal?: () => void;
}

interface StyleInsights {
    style: string;
    themes: string[];
    colorPalette: string[];
    contentTypes: string[];
}

export const SocialMediaPostsWorkflow: React.FC<SocialMediaPostsWorkflowProps> = ({ onBack, onOpenDailyLimitModal }) => {
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [brandLogo, setBrandLogo] = useState<string | null>(null);
    const [brandFont, setBrandFont] = useState('');
    const [brandColor, setBrandColor] = useState('#10B981');
    const [batchCount, setBatchCount] = useState<2 | 4 | 8>(2);
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
    const [styleInsights, setStyleInsights] = useState<StyleInsights | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    
    const { user, incrementGenerationsUsed } = useAuth();
    const referenceInputRef = useRef<HTMLInputElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'reference' | 'product' | 'logo') => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (type === 'reference') {
                    setReferenceImage(result);
                    setStyleInsights(null); // Clear previous insights
                } else if (type === 'product') {
                    setProductImage(result);
                } else {
                    setBrandLogo(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, type: 'reference' | 'product' | 'logo') => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (type === 'reference') {
                    setReferenceImage(result);
                    setStyleInsights(null);
                } else if (type === 'product') {
                    setProductImage(result);
                } else {
                    setBrandLogo(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeStyle = async () => {
        if (!referenceImage) return;
        
        setIsAnalyzing(true);
        try {
            const analysisPrompt = `Analyze this reference image for the Social Media Posts Creator tool in Klint Studios.

**Your Task:** Extract the visual style, aesthetic, and design essence from this image so we can apply it to new content.

**Analyze:**
- Overall visual style and aesthetic (e.g., "Modern & Minimalist", "Bold & Vibrant", "Elegant & Luxurious")
- Key themes and mood (e.g., "Lifestyle", "Professional", "Playful", "Sophisticated")
- Color palette (extract 4-6 dominant hex color codes)
- Design elements and content type (e.g., "Clean Layouts", "Dynamic Angles", "Soft Lighting")

**Output Format:** Return ONLY a JSON object:
{
  "style": "Overall style description",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "contentTypes": ["Element 1", "Element 2", "Element 3"]
}

Return ONLY the JSON, no markdown, no explanations.`;

            const result = await geminiService.analyzeImage(referenceImage, analysisPrompt);
            
            console.log('📊 Style analysis received:', result);
            
            try {
                // Extract JSON from response
                let jsonText = result.trim();
                const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonText = jsonMatch[1].trim();
                }
                
                const insights = JSON.parse(jsonText);
                setStyleInsights(insights);
            } catch (parseError) {
                console.error('Failed to parse style insights:', parseError);
                // Fallback to default insights
                setStyleInsights({
                    style: 'Modern & Clean',
                    themes: ['Professional', 'Elegant', 'Contemporary'],
                    colorPalette: ['#000000', '#FFFFFF', '#10B981', '#3B82F6'],
                    contentTypes: ['Clean Composition', 'Professional Lighting', 'Minimal Design']
                });
            }
        } catch (error) {
            console.error('Failed to analyze style:', error);
            alert('Failed to analyze image style. Using default insights.');
            setStyleInsights({
                style: 'Modern & Clean',
                themes: ['Professional', 'Elegant', 'Contemporary'],
                colorPalette: ['#000000', '#FFFFFF', '#10B981', '#3B82F6'],
                contentTypes: ['Clean Composition', 'Professional Lighting', 'Minimal Design']
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!productImage || !styleInsights) return;
        
        setIsGenerating(true);
        setCurrentProgress(0);
        try {
            const posts: string[] = [];
            
            // Create style description from insights
            const styleDescription = `Create a social media post inspired by this style: ${styleInsights.style}. 
Themes: ${styleInsights.themes.join(', ')}. 
Use color palette similar to: ${styleInsights.colorPalette.join(', ')}.
Design elements: ${styleInsights.contentTypes.join(', ')}.
${brandFont ? `Font style: ${brandFont}.` : ''}
Brand color: ${brandColor}.
Make it Instagram-ready, visually appealing, and on-brand.`;

            // Generate each post
            for (let i = 0; i < batchCount; i++) {
                setCurrentProgress(i + 1);
                console.log(`🎨 Generating post ${i + 1} of ${batchCount}...`);
                const prompt = `${styleDescription} Variation ${i + 1}: Create a unique social media composition featuring the product with the analyzed style aesthetic.`;
                
                try {
                    const result = await geminiService.generateSimplifiedPhotoshoot(
                        prompt,
                        aspectRatio,
                        productImage
                    );
                    
                    if (result && result.trim()) {
                        posts.push(result);
                        console.log(`✓ Generated post ${i + 1}: ${result.substring(0, 50)}...`);
                    } else {
                        console.warn(`Post ${i + 1} returned empty result`);
                    }
                } catch (err) {
                    console.error(`Error generating post ${i + 1}:`, err);
                    // Continue with next post even if one fails
                }
            }
            
            if (posts.length === 0) {
                alert('Failed to generate any posts. Please check your internet connection and try again.');
            } else if (posts.length < batchCount) {
                alert(`Generated ${posts.length} out of ${batchCount} posts. Some generations failed.`);
            }
            
            console.log(`🎉 Generation complete! Total posts: ${posts.length}`);
            
            setGeneratedPosts(posts);
            if (user && posts.length > 0) {
                const result = await incrementGenerationsUsed(posts.length);
                if (result.dailyLimitHit && onOpenDailyLimitModal) {
                    onOpenDailyLimitModal();
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to generate posts:', error);
            alert('Failed to generate posts. Please check your internet connection and try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `social-post-${Date.now()}-${index + 1}.png`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <div className="h-6 w-px bg-zinc-800" />
                        <div>
                            <h1 className="text-xl font-semibold text-white">Social Media Posts</h1>
                            <p className="text-sm text-zinc-400">Style-inspired batch content generation</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Reference Design Upload */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">1. Reference Design</h2>
                                    <p className="text-sm text-zinc-400 mt-1">Upload a design whose style you want to copy</p>
                                </div>
                            </div>

                            {!referenceImage ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'reference')}
                                    onClick={() => referenceInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-900/50 transition-all"
                                >
                                    <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-400 text-sm mb-1">Click to upload or drag & drop</p>
                                    <p className="text-xs text-zinc-500">PNG, JPG, WEBP</p>
                                    <input
                                        ref={referenceInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, 'reference')}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative rounded-xl overflow-hidden bg-zinc-900">
                                        <img src={referenceImage} alt="Reference" className="w-full h-48 object-cover" />
                                        <button
                                            onClick={() => {
                                                setReferenceImage(null);
                                                setStyleInsights(null);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAnalyzeStyle}
                                        disabled={isAnalyzing}
                                        className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyzing Style...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Analyze Style
                                            </>
                                        )}
                                    </button>

                                    {styleInsights && (
                                        <div className="mt-4 p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                                            <p className="text-xs font-semibold text-emerald-400 mb-3">Style Insights</p>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-zinc-500">Style:</span>
                                                    <p className="text-zinc-200">{styleInsights.style}</p>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500">Themes:</span>
                                                    <p className="text-zinc-200">{styleInsights.themes.join(', ')}</p>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500">Colors:</span>
                                                    <div className="flex gap-1 mt-1">
                                                        {styleInsights.colorPalette.map((color, i) => (
                                                            <div key={i} className="w-6 h-6 rounded border border-zinc-600" style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500">Elements:</span>
                                                    <p className="text-zinc-200">{styleInsights.contentTypes.join(', ')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Product/Model Upload */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-white">2. Upload Product/Model Image</h2>
                                <p className="text-sm text-zinc-400 mt-1">(Required)</p>
                            </div>

                            {!productImage ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'product')}
                                    onClick={() => productInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-900/50 transition-all"
                                >
                                    <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-400 text-sm mb-1">Click to upload or drag & drop</p>
                                    <p className="text-xs text-zinc-500">PNG, JPG, WEBP</p>
                                    <input
                                        ref={productInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, 'product')}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden bg-zinc-900">
                                    <img src={productImage} alt="Product" className="w-full h-48 object-cover" />
                                    <button
                                        onClick={() => setProductImage(null)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Brand Customization */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">3. Brand Customization (Optional)</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Brand Font Style</label>
                                    <input
                                        type="text"
                                        value={brandFont}
                                        onChange={(e) => setBrandFont(e.target.value)}
                                        placeholder="e.g., Modern Sans-Serif, Elegant Script"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Brand Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={brandColor}
                                            onChange={(e) => setBrandColor(e.target.value)}
                                            className="w-12 h-10 rounded border border-zinc-700 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={brandColor}
                                            onChange={(e) => setBrandColor(e.target.value)}
                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Generate & Results */}
                    <div className="space-y-6">
                        
                        {/* Dimension Selector */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Dimensions</h3>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                                            aspectRatio === ratio
                                                ? 'bg-emerald-500 text-black'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Batch Size & Generate */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Batch Size</h3>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {([2, 4, 8] as const).map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setBatchCount(count)}
                                        className={`py-2.5 rounded-lg font-semibold transition-colors ${
                                            batchCount === count
                                                ? 'bg-emerald-500 text-black'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!productImage || !styleInsights || isGenerating}
                                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating {currentProgress}/{batchCount} Posts...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate {batchCount} Posts
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-zinc-500 mt-3 text-center">
                                AI will analyze your reference style and create posts matching their aesthetic with your product.
                            </p>
                        </div>

                        {/* Generated Posts */}
                        {generatedPosts.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-sm font-semibold text-white mb-4">Generated Posts ({generatedPosts.length})</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {generatedPosts.map((post, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={post}
                                                alt={`Post ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => handleDownload(post, index)}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                                            >
                                                <Download className="w-6 h-6 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
