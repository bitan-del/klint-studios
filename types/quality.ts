export type ImageQuality = 'regular' | 'hd' | 'qhd';

export const QUALITY_LIMITS = {
    free: { hd: 0, qhd: 0 },
    basic: { hd: 10, qhd: 0 },
    advanced: { hd: 50, qhd: 50 },
    pro: { hd: 10, qhd: 10 }
} as const;

export const QUALITY_MODELS = {
    regular: 'gemini-2.5-flash-image',
    hd: 'gemini-3-pro-image-preview', // 2K resolution
    qhd: 'gemini-3-pro-image-preview' // 4K resolution
} as const;

export const QUALITY_LABELS = {
    regular: { name: 'Regular', description: 'Standard quality, unlimited' },
    hd: { name: 'HD', description: '2K resolution' },
    qhd: { name: 'QHD', description: '4K ultra HD' }
} as const;

export interface QualityUsage {
    hd: number;
    qhd: number;
}
