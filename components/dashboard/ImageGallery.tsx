import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImagePromptModal } from './ImagePromptModal';

const PIXABAY_API_KEY = '52906954-7ee2f60c956d273ec30455691';

interface PixabayImage {
    id: number;
    largeImageURL: string;
    webformatURL: string;
}

type FilterCategory = 'all' | 'ai' | 'nature' | 'people' | 'product' | 'poster' | 'logo' | 'tshirt';

interface FilterOption {
    id: FilterCategory;
    label: string;
}

const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI Art' },
    { id: 'nature', label: 'Nature' },
    { id: 'people', label: 'People' },
    { id: 'product', label: 'Product' },
    { id: 'poster', label: 'Poster' },
    { id: 'logo', label: 'Logo' },
    { id: 'tshirt', label: 'T-shirt' },
];

interface ImageGalleryProps {
    onNavigateToWorkflow?: (workflowId: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ onNavigateToWorkflow }) => {
    const [images, setImages] = useState<PixabayImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
    const [loadedImageIds, setLoadedImageIds] = useState<Set<number>>(new Set());
    const [selectedImage, setSelectedImage] = useState<{ url: string; id: number } | null>(null);
    const loadedImageIdsRef = useRef<Set<number>>(new Set());
    const isLoadingRef = useRef(false);

    const aiKeywords = ['ai generated art', 'digital art abstract', 'futuristic art', 'cyberpunk art', 'neon art', 'ai artwork', 'algorithm art', 'synthwave art', 'digital illustration', 'abstract digital art', 'generated art', 'ai portrait'];
    const natureKeywords = ['nature landscape', 'mountain scenery', 'forest path', 'wildlife photography', 'ocean waves', 'sunset nature', 'flower garden', 'animal photography', 'bird watching', 'butterfly garden', 'deer forest', 'nature scene'];
    const peopleKeywords = ['portrait photography', 'people portrait', 'human portrait', 'model photography', 'face portrait', 'woman portrait', 'man portrait', 'person portrait', 'headshot', 'people photo'];
    const productKeywords = ['product photography', 'product shot', 'product display', 'commercial product', 'product showcase', 'product image', 'product photo', 'merchandise photo', 'product advertising'];
    const posterKeywords = ['poster design', 'graphic poster', 'art poster', 'print poster', 'advertisement poster', 'movie poster', 'event poster', 'poster art', 'design poster', 'creative poster'];
    const logoKeywords = ['logo design', 'brand logo', 'company logo', 'logo symbol', 'business logo', 'corporate logo', 'logo mark', 'brand identity', 'logo graphic', 'professional logo'];
    const tshirtKeywords = ['t-shirt design', 'tshirt mockup', 'shirt design', 'apparel design', 'clothing design', 'fashion t-shirt', 't-shirt graphic', 'tshirt print', 'shirt mockup', 't-shirt art'];

    const fetchImages = async (keyword: string, count: number, category?: string): Promise<PixabayImage[]> => {
        try {
            // Add category-specific parameters for better filtering
            let url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(keyword)}&image_type=all&per_page=${count}&safesearch=true&order=popular&min_width=400`;
            
            // Add category filter if specified
            if (category) {
                const categoryMap: Record<string, string> = {
                    'ai': 'illustration',
                    'nature': 'photo',
                    'people': 'photo',
                    'product': 'photo',
                    'poster': 'illustration',
                    'logo': 'illustration',
                    'tshirt': 'illustration',
                };
                const imageType = categoryMap[category] || 'all';
                url += `&image_type=${imageType}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.hits || [];
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    };

    const getKeywordsForFilter = (filter: FilterCategory): string[] => {
        switch (filter) {
            case 'ai':
                return aiKeywords;
            case 'nature':
                return natureKeywords;
            case 'people':
                return peopleKeywords;
            case 'product':
                return productKeywords;
            case 'poster':
                return posterKeywords;
            case 'logo':
                return logoKeywords;
            case 'tshirt':
                return tshirtKeywords;
            case 'all':
            default:
                return [...aiKeywords, ...natureKeywords, ...peopleKeywords, ...productKeywords, ...posterKeywords, ...logoKeywords, ...tshirtKeywords];
        }
    };

    const loadMoreImages = useCallback(async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setIsLoading(true);

        try {
            const totalToLoad = 20;
            let allImages: PixabayImage[] = [];
            let attempts = 0;
            const maxAttempts = 3;

            // For "all" filter, prioritize abstract art (70%)
            if (activeFilter === 'all') {
                const aiCount = Math.ceil(totalToLoad * 0.7); // 70% abstract art
                const otherCount = totalToLoad - aiCount; // 30% other categories
                
                // Fetch 70% from AI/abstract art keywords
                let aiImages: PixabayImage[] = [];
                let aiAttempts = 0;
                while (aiImages.length < aiCount && aiAttempts < maxAttempts) {
                    aiAttempts++;
                    const aiKeyword1 = aiKeywords[Math.floor(Math.random() * aiKeywords.length)];
                    const aiKeyword2 = aiKeywords[Math.floor(Math.random() * aiKeywords.length)];
                    
                    const fetchedAi1 = await fetchImages(aiKeyword1, Math.ceil(aiCount * 1.5), 'ai');
                    const fetchedAi2 = await fetchImages(aiKeyword2, Math.ceil(aiCount * 1.5), 'ai');
                    
                    const allAiFetched = [...fetchedAi1, ...fetchedAi2];
                    for (let img of allAiFetched) {
                        if (!loadedImageIdsRef.current.has(img.id) && aiImages.length < aiCount) {
                            loadedImageIdsRef.current.add(img.id);
                            aiImages.push(img);
                        }
                    }
                }
                
                // Fetch 30% from other categories
                const otherKeywords = [...natureKeywords, ...peopleKeywords, ...productKeywords, ...posterKeywords, ...logoKeywords, ...tshirtKeywords];
                let otherImages: PixabayImage[] = [];
                let otherAttempts = 0;
                while (otherImages.length < otherCount && otherAttempts < maxAttempts) {
                    otherAttempts++;
                    const otherKeyword1 = otherKeywords[Math.floor(Math.random() * otherKeywords.length)];
                    const otherKeyword2 = otherKeywords[Math.floor(Math.random() * otherKeywords.length)];
                    
                    const fetchedOther1 = await fetchImages(otherKeyword1, Math.ceil(otherCount * 1.5));
                    const fetchedOther2 = await fetchImages(otherKeyword2, Math.ceil(otherCount * 1.5));
                    
                    const allOtherFetched = [...fetchedOther1, ...fetchedOther2];
                    for (let img of allOtherFetched) {
                        if (!loadedImageIdsRef.current.has(img.id) && otherImages.length < otherCount) {
                            loadedImageIdsRef.current.add(img.id);
                            otherImages.push(img);
                        }
                    }
                }
                
                // Combine: 70% AI, 30% other, then shuffle
                allImages = [...aiImages, ...otherImages].sort(() => Math.random() - 0.5);
            } else {
                // For specific filters, use original logic
                const keywords = getKeywordsForFilter(activeFilter);
                const category = activeFilter;

                // Keep fetching until we get unique images
                while (allImages.length < totalToLoad && attempts < maxAttempts) {
                    attempts++;

                    // Fetch images based on active filter with multiple keywords
                    const keyword1 = keywords[Math.floor(Math.random() * keywords.length)];
                    const keyword2 = keywords[Math.floor(Math.random() * keywords.length)];
                    
                    // Fetch with first keyword
                    const fetchedImages1 = await fetchImages(keyword1, Math.ceil(totalToLoad * 1.5), category);
                    
                    // Fetch with second keyword if we need more
                    let fetchedImages2: PixabayImage[] = [];
                    if (fetchedImages1.length < totalToLoad) {
                        fetchedImages2 = await fetchImages(keyword2, Math.ceil(totalToLoad * 1.5), category);
                    }
                    
                    const allFetchedImages = [...fetchedImages1, ...fetchedImages2];

                    // Add non-duplicate images
                    for (let img of allFetchedImages) {
                        if (!loadedImageIdsRef.current.has(img.id) && allImages.length < totalToLoad) {
                            loadedImageIdsRef.current.add(img.id);
                            allImages.push(img);
                        }
                    }
                }
            }

            setImages(prev => [...prev, ...allImages]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [activeFilter]);

    useEffect(() => {
        // Reset images and loaded IDs when filter changes
        setImages([]);
        setLoadedImageIds(new Set());
        loadedImageIdsRef.current.clear();
        loadMoreImages();
    }, [activeFilter, loadMoreImages]);

    useEffect(() => {
        const handleScroll = () => {
            if (isLoadingRef.current) return;
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
                loadMoreImages();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreImages]);

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-16">
            {/* Filter Bar */}
            <div className="mb-8 flex flex-wrap items-center gap-2">
                {filterOptions.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${activeFilter === filter.id
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                            }
                        `}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div 
                className="gallery"
                style={{
                    columnCount: 4,
                    columnGap: '15px',
                }}
            >
                {images.map((image, index) => {
                    const isImageLoaded = loadedImageIds.has(image.id);
                    return (
                        <div
                            key={image.id}
                            className="gallery-item"
                            style={{
                                marginBottom: '15px',
                                breakInside: 'avoid',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#1a1a1a',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.4s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                minHeight: '200px',
                                opacity: 0,
                                animation: `fadeInUp 0.5s ease forwards`,
                                animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                            }}
                            onClick={() => setSelectedImage({ url: image.largeImageURL || image.webformatURL, id: image.id })}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                            }}
                        >
                            {/* White background layer for transparent images */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: '#ffffff',
                                    background: '#ffffff',
                                    zIndex: 0,
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                            {/* Loading Placeholder */}
                            {!isImageLoaded && (
                                <div
                                    className="image-placeholder"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s infinite',
                                        zIndex: 20,
                                        borderRadius: '12px',
                                    }}
                                />
                            )}
                            
                            {/* Actual Image */}
                            <img
                                src={image.largeImageURL || image.webformatURL}
                                alt="Gallery Image"
                                loading="lazy"
                                onLoad={() => {
                                    setLoadedImageIds(prev => new Set([...prev, image.id]));
                                }}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                                    pointerEvents: 'none',
                                    opacity: isImageLoaded ? 1 : 0,
                                    position: 'relative',
                                    zIndex: 10,
                                    backgroundColor: '#ffffff',
                                    background: '#ffffff',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {isLoading && (
                <div className="loading" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div
                        className="spinner"
                        style={{
                            border: '3px solid #333',
                            borderTop: '3px solid #667eea',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                            margin: '20px auto',
                        }}
                    />
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                
                @keyframes fadeInUp {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 1200px) {
                    .gallery {
                        column-count: 3 !important;
                    }
                }
                
                @media (max-width: 768px) {
                    .gallery {
                        column-count: 2 !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .gallery {
                        column-count: 1 !important;
                    }
                }
            `}</style>

            {/* Image Prompt Modal */}
            {selectedImage && (
                <ImagePromptModal
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    imageUrl={selectedImage.url}
                    imageId={selectedImage.id}
                    onNavigateToWorkflow={onNavigateToWorkflow}
                />
            )}
        </div>
    );
};

