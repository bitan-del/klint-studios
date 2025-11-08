import { useEffect, useCallback } from 'react';

interface UseClipboardPasteOptions {
    onPaste: (file: File) => void;
    enabled?: boolean;
    accept?: string; // e.g., 'image/*'
}

export const useClipboardPaste = ({ 
    onPaste, 
    enabled = true,
    accept = 'image/*'
}: UseClipboardPasteOptions) => {
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        if (!enabled) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Check if the item is an image
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                e.stopPropagation();

                const file = item.getAsFile();
                if (file) {
                    // Check if file type matches accept criteria
                    if (accept === 'image/*' || file.type.match(accept)) {
                        onPaste(file);
                    }
                }
                break;
            }
        }
    }, [onPaste, enabled, accept]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste, enabled]);
};

