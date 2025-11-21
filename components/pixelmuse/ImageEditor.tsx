import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon, PencilIcon, EraserIcon, TextToolIcon, SelectIcon, ArrowIcon, ImageIcon, AspectRatioIcon, DeleteIcon, InfoIcon, LayersIcon, PlusIcon, ShapeIcon } from './icons';

type Tool = 'select' | 'pencil' | 'eraser' | 'rect' | 'arrow' | 'text' | 'hand';
type Handle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br' | 'rotate';

interface Layer {
    id: string;
    type: 'image' | 'drawing';
    name: string;
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    data: HTMLImageElement | HTMLCanvasElement;
}

interface InteractionState {
    isDown: boolean;
    tool: Tool;
    startPoint: { x: number, y: number }; // In canvas world space
    currentPoint: { x: number, y: number }; // In canvas world space
    targetLayerId: string | null;
    originalLayerState: Layer | null;
    path?: { x: number; y: number }[];
    transformHandle?: Handle;
    isPanning: boolean;
    panStart: { x: number; y: number }; // In screen space
    shiftKey: boolean;
    drawingLayer?: Layer; // Store the drawing layer reference for immediate use
    isSelecting: boolean; // For marquee selection box
    selectionBox?: { startX: number; startY: number; endX: number; endY: number }; // Selection box coordinates
}

interface ImageEditorProps {
    imageSrc: string;
    onClose: () => void;
    onGenerate: (prompt: string, images: string[], aspectRatio?: string) => void;
    aspectRatio: string;
}

const HANDLE_SIZE = 10;
const ROTATION_HANDLE_OFFSET = 30;

// Helper to rotate a point around an origin
const rotatePoint = (point: { x: number, y: number }, origin: { x: number, y: number }, angleDeg: number) => {
    const angleRad = angleDeg * Math.PI / 180;
    const s = Math.sin(angleRad);
    const c = Math.cos(angleRad);
    const px = point.x - origin.x;
    const py = point.y - origin.y;
    const xnew = px * c - py * s;
    const ynew = px * s + py * c;
    return { x: xnew + origin.x, y: ynew + origin.y };
};

// Helper to get the four corners of a layer, accounting for rotation
const getLayerCorners = (layer: Layer) => {
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const origin = { x: centerX, y: centerY };
    const halfW = layer.width / 2;
    const halfH = layer.height / 2;
    return {
        tl: rotatePoint({ x: centerX - halfW, y: centerY - halfH }, origin, layer.rotation),
        tr: rotatePoint({ x: centerX + halfW, y: centerY - halfH }, origin, layer.rotation),
        bl: rotatePoint({ x: centerX - halfW, y: centerY + halfH }, origin, layer.rotation),
        br: rotatePoint({ x: centerX + halfW, y: centerY + halfH }, origin, layer.rotation),
    };
};

/**
 * Converts a point from world space (the overall canvas) to a layer's local space.
 * This is crucial for drawing operations to ensure they appear correctly on the layer's canvas.
 * @param point The point in world coordinates {x, y}.
 * @param layer The target layer.
 * @returns The point's coordinates in the layer's local space {x, y}.
 */
const worldToLocal = (point: { x: number; y: number }, layer: Layer): { x: number; y: number } => {
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;

    // 1. Translate point so the layer's center becomes the new origin
    const translatedPoint = { x: point.x - centerX, y: point.y - centerY };

    // 2. Rotate the point backwards by the layer's rotation angle
    const angleRad = -layer.rotation * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const rotatedPoint = {
        x: translatedPoint.x * cos - translatedPoint.y * sin,
        y: translatedPoint.x * sin + translatedPoint.y * cos,
    };

    // 3. Translate the point into the layer's own coordinate system (where top-left is 0,0)
    return {
        x: rotatedPoint.x + layer.width / 2,
        y: rotatedPoint.y + layer.height / 2,
    };
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc: initialImageSrc, onClose, onGenerate, aspectRatio: initialAspectRatio }) => {
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    // Multi-selection support - track selected layer IDs
    const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
    // Store the final selection box area for generation
    const [finalSelectionBox, setFinalSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Use a ref to always have the latest layers for the render loop
    const layersRef = useRef<Layer[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

    const [viewState, setViewState] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const interactionState = useRef<InteractionState>({
        isDown: false,
        tool: 'select',
        startPoint: { x: 0, y: 0 },
        currentPoint: { x: 0, y: 0 },
        targetLayerId: null,
        originalLayerState: null,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        shiftKey: false,
        drawingLayer: undefined,
        isSelecting: false,
        selectionBox: undefined,
    });

    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
    const [isAspectOpen, setIsAspectOpen] = useState(false);
    const aspectRatios = ["9:16", "16:9", "4:3", "3:4", "1:1"];

    // FIX: Use a controlled state object for the text input to ensure stability.
    const [textInputState, setTextInputState] = useState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
    const [textColor, setTextColor] = useState<string>('#FFFFFF');
    const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
    // Track text annotations for contextual understanding
    const [textAnnotations, setTextAnnotations] = useState<string[]>([]);
    // Flag to prevent canvas clicks from closing text input
    const textInputSubmittingRef = useRef(false);

    // Chat Interface State
    const [chatInput, setChatInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Stroke width control
    const [strokeWidth, setStrokeWidth] = useState(5);

    // Color picker state
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    // Effect to focus and manage the text input when it becomes visible.
    useEffect(() => {
        if (textInputState.visible && textInputRef.current) {
            // Use setTimeout to ensure the input is rendered before focusing
            setTimeout(() => {
                if (textInputRef.current) {
                    textInputRef.current.focus();
                    textInputRef.current.select(); // Select any existing text
                }
            }, 10);
        }
    }, [textInputState.visible]);


    const screenToCanvas = useCallback((pos: { x: number, y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (pos.x - rect.left - viewState.pan.x) / viewState.zoom,
            y: (pos.y - rect.top - viewState.pan.y) / viewState.zoom,
        };
    }, [viewState]);

    const getActiveDrawingLayer = useCallback(() => {
        // Use ref to get latest layers
        const activeLayer = layersRef.current.find(l => l.id === activeLayerId);
        return (activeLayer && activeLayer.type === 'drawing') ? activeLayer : null;
    }, [activeLayerId]);

    const getHandles = useCallback((layer: Layer): Record<Handle, { x: number; y: number }> => {
        const corners = getLayerCorners(layer);
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        const origin = { x: centerX, y: centerY };

        return {
            ...corners,
            tm: rotatePoint({ x: centerX, y: centerY - layer.height / 2 }, origin, layer.rotation),
            ml: rotatePoint({ x: centerX - layer.width / 2, y: centerY }, origin, layer.rotation),
            mr: rotatePoint({ x: centerX + layer.width / 2, y: centerY }, origin, layer.rotation),
            bm: rotatePoint({ x: centerX, y: centerY + layer.height / 2 }, origin, layer.rotation),
            rotate: rotatePoint({ x: centerX, y: centerY - layer.height / 2 - ROTATION_HANDLE_OFFSET / viewState.zoom }, origin, layer.rotation),
        };
    }, [viewState.zoom]);

    const getCanvasSnapshot = useCallback((width: number, height: number): string | null => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return null;

        // Fill with white background to ensure sketches are visible and model interprets them correctly
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, width, height);

        // Determine which layers to render:
        // If there are selected layers, ONLY render those.
        // Otherwise, render all visible layers.
        let targetLayers = [...layersRef.current];
        if (selectedLayerIds.length > 0) {
            targetLayers = targetLayers.filter(l => selectedLayerIds.includes(l.id));
        }

        // Sort by z-index (same as render loop)
        const layersToRender = targetLayers.sort((a, b) => {
            if (a.id === 'layer_bg') return -1;
            if (b.id === 'layer_bg') return 1;
            // Drawing layers MUST be on top of image layers
            if (a.type === 'drawing' && b.type === 'image') return 1;
            if (a.type === 'image' && b.type === 'drawing') return -1;
            // If same type, preserve order (newer on top)
            return 0;
        });

        // Calculate the bounding box of the TARGET layers to center/crop them
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        layersToRender.forEach(layer => {
            if (!layer.visible) return;
            const corners = getLayerCorners(layer);
            [corners.tl, corners.tr, corners.bl, corners.br].forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

        // If no layers, just return the white background
        if (minX === Infinity) {
            return tempCanvas.toDataURL('image/png');
        }

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // Determine scale to fit content within snapshot dimensions
        // If we are selecting specific items, we might want to crop tightly to them?
        // For now, let's fit them into the requested width/height (which is usually the canvas size)
        // BUT, we should probably crop the snapshot to the content if it's a selection?
        // The current logic fits the content into the full canvas size (width/height).
        // Let's stick to fitting for now, but maybe add padding.

        const scaleX = width / contentWidth;
        const scaleY = height / contentHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 1:1 if content is smaller

        // Calculate translation to center the content
        const translateX = (width - contentWidth * scale) / 2 - minX * scale;
        const translateY = (height - contentHeight * scale) / 2 - minY * scale;

        tempCtx.save();
        tempCtx.translate(translateX, translateY);
        tempCtx.scale(scale, scale);

        layersToRender.forEach(layer => {
            if (!layer.visible) return;
            tempCtx.save();
            tempCtx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            tempCtx.rotate(layer.rotation * Math.PI / 180);
            tempCtx.drawImage(layer.data, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
            tempCtx.restore();
        });

        tempCtx.restore();
        return tempCanvas.toDataURL('image/png');
    }, [getLayerCorners, selectedLayerIds]);

    const handleChatSubmit = useCallback(async () => {
        // Allow generation if there's a prompt OR if there are selected items
        if (!chatInput.trim() && selectedLayerIds.length === 0) return;

        setIsGenerating(true);
        try {
            // Extract individual image layers instead of creating a composite screenshot
            const imageLayers = selectedLayerIds.length > 0
                ? layersRef.current.filter(l => selectedLayerIds.includes(l.id) && l.type === 'image')
                : layersRef.current.filter(l => l.type === 'image' && l.id !== 'layer_bg');

            if (imageLayers.length === 0) {
                console.error("No image layers to generate from.");
                setIsGenerating(false);
                return;
            }

            // Convert each image layer to a data URL
            const imageDataUrls: string[] = [];
            for (const layer of imageLayers) {
                const img = layer.data as HTMLImageElement;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(img, 0, 0);
                    imageDataUrls.push(tempCanvas.toDataURL('image/png'));
                }
            }

            // Build the prompt with context
            let fullPrompt = chatInput.trim();

            // If no explicit prompt but items are selected, provide default instruction
            if (!fullPrompt && selectedLayerIds.length > 0) {
                fullPrompt = "Interpret this visual composition and create the image as shown by the layout and visual guides.";
            }

            // Add text annotations context if any
            if (textAnnotations.length > 0) {
                fullPrompt += `\n\nUser has added the following text annotations: ${textAnnotations.join(', ')}.`;
            }

            // CRITICAL: Add face preservation instruction for all generations
            fullPrompt += "\n\nIMPORTANT: Preserve the exact facial features, identity, and appearance of any people in the reference images. Keep faces identical to the original.";

            onGenerate(fullPrompt, imageDataUrls, aspectRatio);
            setChatInput('');
            setTextAnnotations([]); // Clear annotations after submission
        } catch (error) {
            console.error("Error generating image:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [chatInput, onGenerate, getCanvasSnapshot, canvasSize, aspectRatio, textAnnotations]);

    const drawAllLayers = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // Draw the pure black pasteboard background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(viewState.pan.x, viewState.pan.y);
        ctx.scale(viewState.zoom, viewState.zoom);

        // Use the ref to get the latest layers (always up-to-date)
        // Sort layers so drawing layers (arrows, text, etc.) render on top of image layers
        const layersToRender = [...layersRef.current].sort((a, b) => {
            // Background layer always at bottom
            if (a.id === 'layer_bg') return -1;
            if (b.id === 'layer_bg') return 1;
            // Drawing layers render on top of image layers
            if (a.type === 'drawing' && b.type === 'image') return 1;
            if (a.type === 'image' && b.type === 'drawing') return -1;
            // Keep original order for same type
            return 0;
        });
        layersToRender.forEach(layer => {
            if (!layer.visible) return;
            ctx.save();
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.drawImage(layer.data, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
            ctx.restore();
        });

        // Draw selection boxes for selected layers
        if (activeTool === 'select') {
            // Draw bounding boxes for all selected layers (images, drawings, etc.)
            selectedLayerIds.forEach(layerId => {
                const selectedLayer = layersToRender.find(l => l.id === layerId);
                if (selectedLayer && selectedLayer.visible) {
                    ctx.save();

                    if (selectedLayer.type === 'image') {
                        const handles = getHandles(selectedLayer);
                        // Draw bounding box
                        ctx.beginPath();
                        ctx.moveTo(handles.tl.x, handles.tl.y);
                        ctx.lineTo(handles.tr.x, handles.tr.y);
                        ctx.lineTo(handles.br.x, handles.br.y);
                        ctx.lineTo(handles.bl.x, handles.bl.y);
                        ctx.closePath();
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 1.5 / viewState.zoom;
                        ctx.stroke();
                    } else if (selectedLayer.type === 'drawing') {
                        // Draw bounding box for drawing layers
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 1.5 / viewState.zoom;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height);
                        ctx.setLineDash([]);
                    }

                    ctx.restore();
                }
            });

            // Draw selection box (marquee) if actively selecting
            if (interactionState.current.isSelecting && interactionState.current.selectionBox) {
                const box = interactionState.current.selectionBox;
                ctx.save();
                ctx.strokeStyle = '#10b981';
                ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
                ctx.lineWidth = 2 / viewState.zoom;
                ctx.setLineDash([5, 5]);
                const x = Math.min(box.startX, box.endX);
                const y = Math.min(box.startY, box.endY);
                const width = Math.abs(box.endX - box.startX);
                const height = Math.abs(box.endY - box.startY);
                ctx.fillRect(x, y, width, height);
                ctx.strokeRect(x, y, width, height);
                ctx.setLineDash([]);
                ctx.restore();
            }

            // Draw transform handles for active image layer
            const activeLayer = layersToRender.find(l => l.id === activeLayerId);
            if (activeLayer && activeLayer.type === 'image') {
                const handles = getHandles(activeLayer);
                const handleSizeOnCanvas = HANDLE_SIZE / viewState.zoom;
                ctx.save();

                // Draw bounding box (if not already drawn above)
                if (!selectedLayerIds.includes(activeLayer.id)) {
                    ctx.beginPath();
                    ctx.moveTo(handles.tl.x, handles.tl.y);
                    ctx.lineTo(handles.tr.x, handles.tr.y);
                    ctx.lineTo(handles.br.x, handles.br.y);
                    ctx.lineTo(handles.bl.x, handles.bl.y);
                    ctx.closePath();
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 1.5 / viewState.zoom;
                    ctx.stroke();
                }

                // Draw rotation line and handle
                ctx.beginPath();
                ctx.moveTo(handles.tm.x, handles.tm.y);
                ctx.lineTo(handles.rotate.x, handles.rotate.y);
                ctx.strokeStyle = '#10b981';
                ctx.stroke();

                Object.values(handles).forEach((handle: { x: number; y: number }) => {
                    ctx.fillStyle = '#10b981';
                    ctx.strokeStyle = '#1a1a1a'
                    ctx.lineWidth = 2 / viewState.zoom;
                    ctx.fillRect(handle.x - handleSizeOnCanvas / 2, handle.y - handleSizeOnCanvas / 2, handleSizeOnCanvas, handleSizeOnCanvas);
                    ctx.strokeRect(handle.x - handleSizeOnCanvas / 2, handle.y - handleSizeOnCanvas / 2, handleSizeOnCanvas, handleSizeOnCanvas);
                });

                ctx.restore();
            }
        }

        // Draw temporary user interactions (drawing, shapes)
        const { isDown, tool, startPoint, currentPoint, path, drawingLayer } = interactionState.current;
        // Use stored drawing layer or get active one
        const previewDrawingLayer = drawingLayer || getActiveDrawingLayer();
        if (isDown && previewDrawingLayer) {
            ctx.strokeStyle = textColor;
            // Scale stroke width based on user setting and zoom
            const scaleFactor = 1 / viewState.zoom;
            ctx.lineWidth = (tool === 'eraser' ? strokeWidth * 10 : strokeWidth) * scaleFactor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (tool === 'rect') {
                ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
            } else if (tool === 'arrow') {
                // FIX: Correctly draw arrow preview with a single, valid path.
                const headlen = 15 / viewState.zoom;
                const dx = currentPoint.x - startPoint.x;
                const dy = currentPoint.y - startPoint.y;
                const angle = Math.atan2(dy, dx);
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(currentPoint.x, currentPoint.y);
                ctx.lineTo(currentPoint.x - headlen * Math.cos(angle - Math.PI / 6), currentPoint.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(currentPoint.x, currentPoint.y);
                ctx.lineTo(currentPoint.x - headlen * Math.cos(angle + Math.PI / 6), currentPoint.y - headlen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            } else if ((tool === 'pencil' || tool === 'eraser') && path && path.length > 0) {
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    }, [activeLayerId, activeTool, selectedLayerIds, getHandles, viewState, getActiveDrawingLayer, textColor]);

    useEffect(() => {
        let animationFrameId: number;
        const renderLoop = () => {
            drawAllLayers();
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [drawAllLayers]);

    const addImageLayer = useCallback((image: HTMLImageElement, name: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Place new images at the center of the current view, accounting for pan and zoom
        // Calculate world coordinates for the center of the screen
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;

        // Convert screen center to world coordinates
        const worldCenter = screenToCanvas({
            x: canvas.getBoundingClientRect().left + screenCenterX,
            y: canvas.getBoundingClientRect().top + screenCenterY
        });

        const maxDim = 512;
        const scale = Math.min(1, maxDim / image.width, maxDim / image.height);
        const newWidth = image.width * scale;
        const newHeight = image.height * scale;

        // Add a small offset for each new image so they don't stack perfectly
        const imageLayerCount = layersRef.current.filter(l => l.type === 'image' && l.id !== 'layer_bg').length;
        const offset = imageLayerCount * 30; // 30px offset per image

        const layerId = `layer_${Date.now()}`;
        const newLayer: Layer = {
            id: layerId, type: 'image', name, visible: true,
            x: worldCenter.x - newWidth / 2 + offset,
            y: worldCenter.y - newHeight / 2 + offset,
            width: newWidth, height: newHeight, rotation: 0, data: image,
        };
        setLayers(prev => {
            const updated = [...prev, newLayer];
            layersRef.current = updated;
            return updated;
        });
        setActiveLayerId(layerId);
        setActiveTool('select');
    }, [screenToCanvas]);

    const addDrawingLayer = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a drawing layer that covers the entire infinite canvas
        // Use a very large size so it covers all possible drawing areas
        const newDrawingCanvas = document.createElement('canvas');
        const layerSize = 10000; // Large enough to cover entire canvas
        newDrawingCanvas.width = layerSize;
        newDrawingCanvas.height = layerSize;

        const layerId = `layer_${Date.now()}`;
        const newLayer: Layer = {
            id: layerId,
            type: 'drawing',
            name: `Drawing ${layers.filter(l => l.type === 'drawing').length + 1}`,
            visible: true,
            // Center the drawing layer at origin (0,0) so it covers the entire canvas
            x: -layerSize / 2,
            y: -layerSize / 2,
            width: layerSize,
            height: layerSize,
            rotation: 0,
            data: newDrawingCanvas,
        };
        setLayers(prev => {
            const updated = [...prev, newLayer];
            layersRef.current = updated;
            return updated;
        });
        setActiveLayerId(layerId);
        return newLayer;
    }, [screenToCanvas]);

    const setupCanvas = useCallback(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;
        const { clientWidth, clientHeight } = container;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        if (canvasSize.width !== clientWidth || canvasSize.height !== clientHeight) {
            setCanvasSize({ width: clientWidth, height: clientHeight });
        }
    }, [canvasSize]);

    useEffect(() => {
        if (canvasSize.width === 0 || canvasSize.height === 0) {
            return;
        }

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = initialImageSrc;
        image.onload = () => {
            const imageLayer: Layer = {
                id: `layer_image_${Date.now()}`,
                type: 'image',
                name: 'Initial Image',
                visible: true,
                x: -image.width / 2,
                y: -image.height / 2,
                width: image.width,
                height: image.height,
                rotation: 0,
                data: image,
            };

            const backgroundLayer: Layer = {
                id: 'layer_bg',
                type: 'drawing',
                name: 'Background',
                visible: true,
                x: -image.width,
                y: -image.height,
                width: image.width * 2,
                height: image.height * 2,
                rotation: 0,
                data: document.createElement('canvas'),
            };
            (backgroundLayer.data as HTMLCanvasElement).width = backgroundLayer.width;
            (backgroundLayer.data as HTMLCanvasElement).height = backgroundLayer.height;

            const initialLayers = [backgroundLayer, imageLayer];
            layersRef.current = initialLayers;
            setLayers(initialLayers);
            setActiveLayerId(imageLayer.id);
            setActiveTool('select');

            const scaleX = canvasSize.width / imageLayer.width;
            const scaleY = canvasSize.height / imageLayer.height;
            const zoom = Math.min(scaleX, scaleY) * 0.8;

            const panX = canvasSize.width / 2;
            const panY = canvasSize.height / 2;

            setViewState({ zoom, pan: { x: panX, y: panY } });
        };
    }, [initialImageSrc, canvasSize.width, canvasSize.height]);

    useEffect(() => {
        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const zoomFactor = 1.1;
            const newZoom = e.deltaY < 0 ? viewState.zoom * zoomFactor : viewState.zoom / zoomFactor;

            const mouseBeforeZoom = screenToCanvas({ x: mouseX, y: mouseY });

            setViewState(prev => {
                const newPanX = (mouseX - rect.left) - mouseBeforeZoom.x * newZoom;
                const newPanY = (mouseY - rect.top) - mouseBeforeZoom.y * newZoom;
                return { zoom: newZoom, pan: { x: newPanX, y: newPanY } };
            });
        };
        const currentCanvas = canvasRef.current;
        currentCanvas?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('resize', setupCanvas);
            currentCanvas?.removeEventListener('wheel', handleWheel);
        }
    }, [setupCanvas, screenToCanvas, viewState.zoom]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Prevent canvas interaction when text input is visible
        // The backdrop will handle closing the text input
        if (textInputState.visible) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
        interactionState.current = {
            ...interactionState.current,
            isDown: true,
            startPoint: canvasPos,
            currentPoint: canvasPos,
            tool: activeTool,
            shiftKey: e.shiftKey,
        };

        if (activeTool === 'hand') {
            // Hand tool - always pan
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            interactionState.current.isPanning = true;
            interactionState.current.panStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        } else if (activeTool === 'select') {
            // First check if clicking on transform handles
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (activeLayer?.type === 'image') {
                const handles = getHandles(activeLayer);
                for (const [key, value] of Object.entries(handles)) {
                    const handlePos = value as { x: number; y: number; };
                    if (Math.hypot(handlePos.x - canvasPos.x, handlePos.y - canvasPos.y) < (HANDLE_SIZE * 1.5 / viewState.zoom)) {
                        interactionState.current.transformHandle = key as Handle;
                        interactionState.current.targetLayerId = activeLayer.id;
                        interactionState.current.originalLayerState = JSON.parse(JSON.stringify(activeLayer));
                        return;
                    }
                }
            }

            // Find which layer was clicked (check all layers from top to bottom)
            // Use layersRef to get the latest layers
            let clickedLayer: Layer | null = null;
            const currentLayers = layersRef.current.length > 0 ? layersRef.current : layers;
            for (let i = currentLayers.length - 1; i >= 0; i--) {
                const layer = currentLayers[i];
                if (layer.id !== 'layer_bg' && layer.type === 'image' && layer.visible) {
                    const centerX = layer.x + layer.width / 2;
                    const centerY = layer.y + layer.height / 2;
                    const localPos = rotatePoint(canvasPos, { x: centerX, y: centerY }, -layer.rotation);
                    if (localPos.x >= layer.x && localPos.x <= layer.x + layer.width && localPos.y >= layer.y && localPos.y <= layer.y + layer.height) {
                        clickedLayer = layer;
                        break;
                    }
                }
            }

            if (clickedLayer) {
                // Multi-selection: Shift+click adds to selection, regular click replaces selection
                if (e.shiftKey) {
                    // Add to selection if not already selected
                    setSelectedLayerIds(prev => {
                        const isAlreadySelected = prev.includes(clickedLayer!.id);
                        if (isAlreadySelected) {
                            // Remove if already selected (toggle off)
                            const newSelection = prev.filter(id => id !== clickedLayer!.id);
                            // If we removed the active layer, set a new active layer
                            if (newSelection.length > 0 && activeLayerId === clickedLayer!.id) {
                                setActiveLayerId(newSelection[newSelection.length - 1]);
                            } else if (newSelection.length === 0) {
                                setActiveLayerId(null);
                            }
                            return newSelection;
                        } else {
                            // Add to selection (max 3 layers)
                            const newSelection = [...prev, clickedLayer!.id];
                            const finalSelection = newSelection.slice(-3); // Keep only last 3
                            setActiveLayerId(clickedLayer!.id);
                            return finalSelection;
                        }
                    });
                } else {
                    // Single selection - replace current selection
                    setSelectedLayerIds([clickedLayer.id]);
                    setActiveLayerId(clickedLayer.id);
                    // Clear selection box when clicking directly on an element
                    setFinalSelectionBox(null);
                }
                interactionState.current.targetLayerId = clickedLayer.id;
                interactionState.current.originalLayerState = { ...clickedLayer };
            } else {
                // Clicked on empty space - start selection box (marquee selection)
                if (!e.shiftKey) {
                    // Start selection box
                    interactionState.current.isSelecting = true;
                    interactionState.current.selectionBox = {
                        startX: canvasPos.x,
                        startY: canvasPos.y,
                        endX: canvasPos.x,
                        endY: canvasPos.y
                    };
                } else {
                    // Shift+click on empty space - keep current selection and allow panning
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    interactionState.current.isPanning = true;
                    interactionState.current.panStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }
            }
        } else if (activeTool === 'text') {
            // Auto-create drawing layer if needed for text
            let drawingLayer = getActiveDrawingLayer();
            if (!drawingLayer) {
                const newLayer = addDrawingLayer();
                setActiveLayerId(newLayer.id);
                drawingLayer = newLayer;
            }
            if (drawingLayer) {
                // Store the layer reference for immediate use
                interactionState.current.drawingLayer = drawingLayer;
                // Get container-relative coordinates for text input positioning
                const container = containerRef.current;
                if (container) {
                    const rect = container.getBoundingClientRect();
                    const containerX = e.clientX - rect.left;
                    const containerY = e.clientY - rect.top;
                    setTextInputState({ visible: true, x: containerX, y: containerY, worldX: canvasPos.x, worldY: canvasPos.y, value: '' });
                } else {
                    setTextInputState({ visible: true, x: e.clientX, y: e.clientY, worldX: canvasPos.x, worldY: canvasPos.y, value: '' });
                }
            }
        } else {
            // For all drawing tools (pencil, eraser, rect, arrow)
            let drawingLayer = getActiveDrawingLayer();
            if (!drawingLayer) {
                // Auto-create a layer if needed
                const newLayer = addDrawingLayer();
                setActiveLayerId(newLayer.id);
                drawingLayer = newLayer;
            }
            if (drawingLayer) {
                // Store the layer reference for immediate use in handleMouseUp
                interactionState.current.drawingLayer = drawingLayer;
                if (activeTool === 'pencil' || activeTool === 'eraser') {
                    interactionState.current.path = [canvasPos];
                }
                // For rect and arrow, we just need to ensure the layer exists
                // The drawing will happen in handleMouseUp
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        interactionState.current.shiftKey = e.shiftKey;
        if (!interactionState.current.isDown) return;

        const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
        const { tool, targetLayerId, startPoint, originalLayerState, transformHandle, isPanning, isSelecting } = interactionState.current;

        if (isPanning) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const dx = screenPos.x - interactionState.current.panStart.x;
            const dy = screenPos.y - interactionState.current.panStart.y;
            setViewState(prev => ({ ...prev, pan: { x: prev.pan.x + dx, y: prev.pan.y + dy } }));
            interactionState.current.panStart = screenPos;
            return;
        }

        // Update selection box if actively selecting
        if (isSelecting && interactionState.current.selectionBox) {
            interactionState.current.selectionBox.endX = canvasPos.x;
            interactionState.current.selectionBox.endY = canvasPos.y;
            return; // Don't process other interactions while selecting
        }

        interactionState.current.currentPoint = canvasPos;

        if (tool === 'select' && targetLayerId && originalLayerState) {
            const dx = canvasPos.x - startPoint.x;
            const dy = canvasPos.y - startPoint.y;

            if (transformHandle) {
                const original = originalLayerState;
                const centerX = original.x + original.width / 2;
                const centerY = original.y + original.height / 2;

                if (transformHandle === 'rotate') {
                    const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX);
                    const currentAngle = Math.atan2(canvasPos.y - centerY, canvasPos.x - centerX);
                    const angleDiff = (currentAngle - startAngle) * 180 / Math.PI;
                    setLayers(ls => {
                        const updated = ls.map(l => l.id === targetLayerId ? { ...l, rotation: original.rotation + angleDiff } : l);
                        layersRef.current = updated;
                        return updated;
                    });
                } else {
                    const angleRad = original.rotation * Math.PI / 180;
                    const cos = Math.cos(angleRad);
                    const sin = Math.sin(angleRad);

                    let newWidth = original.width;
                    let newHeight = original.height;
                    let newX = original.x;
                    let newY = original.y;

                    if (transformHandle.includes('r')) newWidth = original.width + (dx * cos + dy * sin);
                    if (transformHandle.includes('l')) newWidth = original.width - (dx * cos + dy * sin);
                    if (transformHandle.includes('b')) newHeight = original.height + (dy * cos - dx * sin);
                    if (transformHandle.includes('t')) newHeight = original.height - (dy * cos - dx * sin);

                    // Make proportional scaling the default (more natural)
                    // Hold Shift to allow free-form scaling
                    if (!interactionState.current.shiftKey) {
                        const ratio = original.width / original.height;
                        if (newWidth / newHeight > ratio) newWidth = newHeight * ratio;
                        else newHeight = newWidth / ratio;
                    }

                    const dw = newWidth - original.width;
                    const dh = newHeight - original.height;

                    newX -= (dw / 2 * cos + dh / 2 * -sin);
                    newY -= (dw / 2 * sin + dh / 2 * cos);

                    if (transformHandle.includes('l')) newX += dw * cos;
                    if (transformHandle.includes('t')) newY += dh * cos;
                    if (transformHandle.includes('t')) newX += dh * sin;
                    if (transformHandle.includes('l')) newY -= dw * sin;

                    setLayers(ls => {
                        const updated = ls.map(l => l.id === targetLayerId ? { ...l, width: Math.max(10, newWidth), height: Math.max(10, newHeight), x: newX, y: newY } : l);
                        layersRef.current = updated;
                        return updated;
                    });
                }
            } else {
                setLayers(ls => {
                    const updated = ls.map(l => l.id === targetLayerId ? { ...l, x: originalLayerState.x + dx, y: originalLayerState.y + dy } : l);
                    layersRef.current = updated;
                    return updated;
                });
            }
        } else {
            // For drawing tools, use stored drawing layer or get active one
            const drawingLayer = interactionState.current.drawingLayer || getActiveDrawingLayer();
            if (drawingLayer) {
                if (tool === 'pencil' || tool === 'eraser') {
                    interactionState.current.path?.push(canvasPos);
                }
                // For rect and arrow, currentPoint is already updated above, which triggers the preview in drawAllLayers
            }
        }
    };
    const handleMouseUp = () => {
        if (!interactionState.current.isDown) return;
        const { tool, startPoint, currentPoint, path, drawingLayer } = interactionState.current;

        // Use the stored drawing layer if available, otherwise try to get active layer
        const activeDrawingLayer = drawingLayer || getActiveDrawingLayer();
        if (activeDrawingLayer) {
            const ctx = (activeDrawingLayer.data as HTMLCanvasElement).getContext('2d');
            if (ctx) {
                const localStart = worldToLocal(startPoint, activeDrawingLayer);
                const localCurrent = worldToLocal(currentPoint, activeDrawingLayer);

                ctx.save();
                ctx.strokeStyle = textColor;
                ctx.fillStyle = textColor;
                ctx.lineWidth = tool === 'eraser' ? strokeWidth * 10 : strokeWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (tool === 'rect') {
                    ctx.strokeRect(localStart.x, localStart.y, localCurrent.x - localStart.x, localCurrent.y - localStart.y);
                } else if (tool === 'arrow') {
                    // Draw arrow with proper head
                    const headlen = 20;
                    const dx = localCurrent.x - localStart.x;
                    const dy = localCurrent.y - localStart.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Only draw if there's a meaningful distance
                    if (distance > 5) {
                        const angle = Math.atan2(dy, dx);
                        ctx.beginPath();
                        // Draw the main line
                        ctx.moveTo(localStart.x, localStart.y);
                        ctx.lineTo(localCurrent.x, localCurrent.y);
                        // Draw arrow head - left side
                        ctx.moveTo(localCurrent.x, localCurrent.y);
                        ctx.lineTo(localCurrent.x - headlen * Math.cos(angle - Math.PI / 6), localCurrent.y - headlen * Math.sin(angle - Math.PI / 6));
                        // Draw arrow head - right side
                        ctx.moveTo(localCurrent.x, localCurrent.y);
                        ctx.lineTo(localCurrent.x - headlen * Math.cos(angle + Math.PI / 6), localCurrent.y - headlen * Math.sin(angle + Math.PI / 6));
                        ctx.stroke();
                    }
                } else if ((tool === 'pencil' || tool === 'eraser') && path && path.length > 0) {
                    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                    ctx.beginPath();
                    path.forEach((p, i) => {
                        const localPoint = worldToLocal(p, activeDrawingLayer);
                        if (i === 0) ctx.moveTo(localPoint.x, localPoint.y);
                        else ctx.lineTo(localPoint.x, localPoint.y);
                    });
                    ctx.stroke();
                }
                ctx.restore();

                // Update the layers state and ref to ensure the drawing persists
                // The canvas element has been modified, so we need to update the state
                setLayers(prevLayers => {
                    // Check if the layer still exists in the current state
                    const currentLayer = prevLayers.find(l => l.id === activeDrawingLayer.id);
                    if (!currentLayer) {
                        // Layer was removed, don't update
                        return prevLayers;
                    }

                    // Create a new array with updated layer reference
                    // The canvas element in layer.data contains the drawing, preserve it
                    const updated = prevLayers.map(layer => {
                        if (layer.id === activeDrawingLayer.id) {
                            // Return a new object reference, but keep the same canvas element
                            // The canvas element has the drawing, so we preserve it
                            return { ...layer, data: activeDrawingLayer.data };
                        }
                        return layer;
                    });

                    // Update the ref immediately so the render loop sees the changes
                    layersRef.current = updated;
                    return updated;
                });
            }
        }

        // Handle selection box completion
        if (interactionState.current.isSelecting && interactionState.current.selectionBox) {
            const box = interactionState.current.selectionBox;
            const selectionRect = {
                x: Math.min(box.startX, box.endX),
                y: Math.min(box.startY, box.endY),
                width: Math.abs(box.endX - box.startX),
                height: Math.abs(box.endY - box.startY)
            };

            // Store the final selection box area for generation
            setFinalSelectionBox(selectionRect);

            // Find all layers that intersect with the selection box
            const currentLayers = layersRef.current.length > 0 ? layersRef.current : layers;
            const selectedIds: string[] = [];

            currentLayers.forEach(layer => {
                if (layer.id === 'layer_bg' || !layer.visible) return;

                let intersects = false;

                if (layer.type === 'image') {
                    // Check if image layer intersects with selection box
                    const corners = getLayerCorners(layer);
                    const layerBounds = {
                        minX: Math.min(...Object.values(corners).map(c => c.x)),
                        minY: Math.min(...Object.values(corners).map(c => c.y)),
                        maxX: Math.max(...Object.values(corners).map(c => c.x)),
                        maxY: Math.max(...Object.values(corners).map(c => c.y))
                    };

                    intersects = !(
                        layerBounds.maxX < selectionRect.x ||
                        layerBounds.minX > selectionRect.x + selectionRect.width ||
                        layerBounds.maxY < selectionRect.y ||
                        layerBounds.minY > selectionRect.y + selectionRect.height
                    );
                } else if (layer.type === 'drawing') {
                    // Check if drawing layer intersects with selection box
                    intersects = !(
                        layer.x + layer.width < selectionRect.x ||
                        layer.x > selectionRect.x + selectionRect.width ||
                        layer.y + layer.height < selectionRect.y ||
                        layer.y > selectionRect.y + selectionRect.height
                    );
                }

                if (intersects) {
                    selectedIds.push(layer.id);
                }
            });

            // Update selection (limit to 3 for generation, but allow more for display)
            if (selectedIds.length > 0) {
                setSelectedLayerIds(selectedIds.slice(0, 3)); // Limit to 3 for generation
                if (selectedIds.length > 0) {
                    setActiveLayerId(selectedIds[0]);
                }
            } else {
                // If nothing selected, clear selection
                setSelectedLayerIds([]);
                setActiveLayerId(null);
                setFinalSelectionBox(null);
            }
        }

        interactionState.current = {
            ...interactionState.current,
            isDown: false,
            targetLayerId: null,
            originalLayerState: null,
            path: [],
            transformHandle: undefined,
            isPanning: false,
            drawingLayer: undefined,
            isSelecting: false,
            selectionBox: undefined
        };
    };

    // FIX: Refactored to use controlled state, preventing unexpected closing.
    const handleTextSubmit = () => {
        if (!textInputState.visible || textInputSubmittingRef.current) return;

        textInputSubmittingRef.current = true;

        const { worldX, worldY, value } = textInputState;
        const textValue = value.trim();
        // Use stored drawing layer from interaction state if available, otherwise get active one
        const activeDrawingLayer = interactionState.current.drawingLayer || getActiveDrawingLayer();

        if (activeDrawingLayer && textValue) {
            const dCtx = (activeDrawingLayer.data as HTMLCanvasElement).getContext('2d');
            if (dCtx) {
                const localPos = worldToLocal({ x: worldX, y: worldY }, activeDrawingLayer);

                dCtx.save();
                dCtx.fillStyle = textColor;
                dCtx.font = `48px sans-serif`;
                dCtx.textAlign = 'left';
                dCtx.textBaseline = 'top';
                dCtx.fillText(textValue, localPos.x, localPos.y);
                dCtx.restore();

                // Track text annotation for contextual understanding
                setTextAnnotations(prev => [...prev, textValue]);

                // Force a re-render by updating the layers state
                // This ensures the canvas re-draws with the new text
                setLayers(prevLayers => {
                    const updatedLayers = prevLayers.map(layer => {
                        if (layer.id === activeDrawingLayer.id) {
                            // Return a new object reference to trigger re-render
                            return { ...layer };
                        }
                        return layer;
                    });
                    layersRef.current = updatedLayers;
                    return updatedLayers;
                });
            }
        }

        setTextInputState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
        setTimeout(() => {
            textInputSubmittingRef.current = false;
        }, 100);
    }

    const handleAddImageClick = () => {
        console.log('[ImageEditor] Image button clicked, fileInputRef:', fileInputRef.current);
        fileInputRef.current?.click();
    };
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('[ImageEditor] File input changed, files:', e.target.files);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]; // Capture file reference before async operations
            const fileName = file.name; // Capture filename before async operations

            const reader = new FileReader();
            reader.onload = (event) => {
                console.log('[ImageEditor] File loaded, creating image element');
                const img = new Image();
                img.onload = () => {
                    console.log('[ImageEditor] Image element loaded, adding layer');
                    addImageLayer(img, fileName); // Use captured filename
                };
                img.onerror = (err) => {
                    console.error('[ImageEditor] Image load error:', err);
                };
                img.src = event.target?.result as string;
            };
            reader.onerror = (err) => {
                console.error('[ImageEditor] FileReader error:', err);
            };
            reader.readAsDataURL(file); // Use captured file reference
        }
        // Reset file input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };



    const selectTool = (tool: Tool) => {
        setActiveTool(tool);
        if (tool !== 'select') {
            // Clear selection when switching away from select tool
            setSelectedLayerIds([]);
            const active = getActiveDrawingLayer();
            if (!active) {
                const hasDrawingLayer = layers.some(l => l.type === 'drawing' && l.id !== 'layer_bg');
                if (!hasDrawingLayer) {
                    addDrawingLayer();
                } else {
                    for (let i = layers.length - 1; i >= 0; i--) {
                        if (layers[i].type === 'drawing' && layers[i].id !== 'layer_bg') {
                            setActiveLayerId(layers[i].id);
                            break;
                        }
                    }
                }
            }
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, layerId: string) => {
        e.dataTransfer.setData('text/plain', layerId);
        setDraggedLayerId(layerId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetLayerId: string) => {
        e.preventDefault();
        const sourceLayerId = e.dataTransfer.getData('text/plain');
        if (sourceLayerId === targetLayerId || sourceLayerId === 'layer_bg' || targetLayerId === 'layer_bg') {
            setDraggedLayerId(null);
            return;
        };

        setLayers(prevLayers => {
            const sourceIndex = prevLayers.findIndex(l => l.id === sourceLayerId);
            const targetIndex = prevLayers.findIndex(l => l.id === targetLayerId);
            if (sourceIndex === -1 || targetIndex === -1) {
                layersRef.current = prevLayers;
                return prevLayers;
            }

            const newLayers = [...prevLayers];
            const [removed] = newLayers.splice(sourceIndex, 1);
            newLayers.splice(targetIndex, 0, removed);
            layersRef.current = newLayers;
            return newLayers;
        });
        setDraggedLayerId(null);
    };

    const ToolButton: React.FC<{ tool: Tool, icon: React.ReactNode, label: string }> = ({ tool, icon, label }) => (
        <button
            onClick={() => selectTool(tool)}
            className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${activeTool === tool
                ? 'bg-white text-black shadow-lg transform scale-105'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
            aria-label={label}
        >
            {icon}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col overflow-hidden font-sans">
            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors border border-white/10"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    {/* Undo/Redo placeholders - logic to be implemented if needed, for now just UI */}
                    <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/50 backdrop-blur-md border border-white/10 cursor-not-allowed">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                    </button>
                    <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/50 backdrop-blur-md border border-white/10 cursor-not-allowed">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden bg-[#09090b]">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* Text Input Overlay */}
                {textInputState.visible && (
                    <div className="absolute inset-0 z-50" onClick={handleTextSubmit}>
                        <input
                            ref={textInputRef}
                            type="text"
                            value={textInputState.value}
                            onChange={(e) => setTextInputState(prev => ({ ...prev, value: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTextSubmit();
                            }}
                            style={{
                                position: 'absolute',
                                left: textInputState.x,
                                top: textInputState.y,
                                transform: 'translate(-50%, -50%)',
                                minWidth: '200px',
                                color: textColor,
                                fontSize: `${Math.max(24, 24 / viewState.zoom)}px`,
                                fontFamily: 'Inter, sans-serif',
                                background: 'transparent',
                                border: '2px dashed #ccff00',
                                outline: 'none',
                                padding: '4px 8px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />
            </div>

            {/* Bottom Toolbar Container */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center items-end z-50 px-4 pointer-events-none">
                <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-2 flex items-center gap-2 pointer-events-auto backdrop-blur-xl">

                    {/* Tools Section */}
                    <div className="flex items-center gap-1 pr-4 border-r border-white/10">
                        <ToolButton tool="select" label="Select" icon={<SelectIcon className="w-5 h-5" />} />
                        <ToolButton tool="hand" label="Hand" icon={
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                            </svg>
                        } />
                        <ToolButton tool="pencil" label="Draw" icon={<PencilIcon className="w-5 h-5" />} />
                        <ToolButton tool="eraser" label="Eraser" icon={<EraserIcon className="w-5 h-5" />} />
                        <ToolButton tool="rect" label="Shape" icon={<ShapeIcon className="w-5 h-5" />} />
                        <ToolButton tool="arrow" label="Arrow" icon={<ArrowIcon className="w-5 h-5" />} />
                        <ToolButton tool="text" label="Text" icon={<TextToolIcon className="w-5 h-5" />} />

                        <button
                            onClick={handleAddImageClick}
                            className="p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/10 text-gray-400 hover:text-white"
                            aria-label="Add Image"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        {/* Color Picker */}
                        <div className="relative ml-1">
                            <button
                                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                className="w-10 h-10 rounded-full border-2 border-white/20 shadow-inner transition-transform hover:scale-110"
                                style={{ backgroundColor: textColor }}
                                aria-label="Color Picker"
                            />
                            {/* Popover Color Palette */}
                            {isColorPickerOpen && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 flex flex-col gap-2 bg-[#27272a] p-2 rounded-xl border border-white/10 shadow-xl z-50">
                                    {['#FFFFFF', '#000000', '#ff453a', '#0a84ff', '#30d158', '#ffd60a', '#bf5af2', '#ff9f0a'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setTextColor(color);
                                                setIsColorPickerOpen(false);
                                            }}
                                            style={{ backgroundColor: color }}
                                            className={`w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110 ${textColor === color ? 'ring-2 ring-white' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thickness Slider */}
                        {(activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'rect' || activeTool === 'arrow') && (
                            <div className="flex items-center gap-2 ml-2 px-3 py-2 bg-[#27272a] rounded-xl">
                                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="4" y1="12" x2="20" y2="12" />
                                </svg>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={strokeWidth}
                                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((strokeWidth - 1) / 19) * 100}%, #4b5563 ${((strokeWidth - 1) / 19) * 100}%, #4b5563 100%)`
                                    }}
                                />
                                <span className="text-xs text-gray-400 w-6 text-center">{strokeWidth}</span>
                            </div>
                        )}
                    </div>

                    {/* Chat / Generate Section */}
                    <div className="flex items-center gap-2 pl-2">
                        <div className="relative w-64">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit(e)}
                                placeholder="Describe your edit..."
                                className="w-full bg-[#27272a] text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none text-sm border border-transparent focus:border-white/20 transition-all"
                                disabled={isGenerating}
                            />
                        </div>

                        <button
                            onClick={handleChatSubmit}
                            disabled={(!chatInput.trim() && selectedLayerIds.length === 0) || isGenerating}
                            className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg ${(chatInput.trim() || selectedLayerIds.length > 0) && !isGenerating
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-500/20 transform hover:-translate-y-0.5'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <span>Generate{selectedLayerIds.length > 0 ? ` (${selectedLayerIds.length} selected)` : ''}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
