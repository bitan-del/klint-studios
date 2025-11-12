import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon, PencilIcon, EraserIcon, TextToolIcon, SelectIcon, ArrowIcon, ImageIcon, AspectRatioIcon, DeleteIcon, InfoIcon, LayersIcon, PlusIcon, ShapeIcon } from './icons';

type Tool = 'select' | 'pencil' | 'eraser' | 'rect' | 'arrow' | 'text';
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
  onGenerate: (prompt: string, editedImage: string, aspectRatio?: string) => void;
  aspectRatio: string;
}

const HANDLE_SIZE = 10;
const ROTATION_HANDLE_OFFSET = 30;

// Helper to rotate a point around an origin
const rotatePoint = (point: {x: number, y: number}, origin: {x: number, y: number}, angleDeg: number) => {
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
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePreview, setGeneratePreview] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');

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


  const screenToCanvas = useCallback((pos: {x: number, y: number}) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
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
            rotate: rotatePoint({ x: centerX, y: centerY - layer.height / 2 - ROTATION_HANDLE_OFFSET/viewState.zoom }, origin, layer.rotation),
        };
    }, [viewState.zoom]);

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

                Object.values(handles).forEach((handle: {x: number; y: number}) => {
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
            ctx.lineWidth = (tool === 'eraser' ? 30 : 5) / viewState.zoom;
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
    
    const centerOfView = screenToCanvas({ x: canvas.getBoundingClientRect().left + canvas.width / 2, y: canvas.getBoundingClientRect().top + canvas.height / 2 });

    const maxDim = 512;
    const scale = Math.min(1, maxDim / image.width, maxDim / image.height);
    const newWidth = image.width * scale;
    const newHeight = image.height * scale;

    const layerId = `layer_${Date.now()}`;
    const newLayer: Layer = {
      id: layerId, type: 'image', name, visible: true,
      x: centerOfView.x - newWidth / 2,
      y: centerOfView.y - newHeight / 2,
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
        
        const mouseBeforeZoom = screenToCanvas({x: mouseX, y: mouseY});
        
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
    const canvasPos = screenToCanvas({x: e.clientX, y: e.clientY});
    interactionState.current = {
      ...interactionState.current,
      isDown: true,
      startPoint: canvasPos,
      currentPoint: canvasPos,
      tool: activeTool,
      shiftKey: e.shiftKey,
    };

    if (activeTool === 'select') {
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
                 const localPos = rotatePoint(canvasPos, {x: centerX, y: centerY}, -layer.rotation);
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
                if(!canvas) return;
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
        
        const canvasPos = screenToCanvas({x: e.clientX, y: e.clientY});
        const { tool, targetLayerId, startPoint, originalLayerState, transformHandle, isPanning, isSelecting } = interactionState.current;
        
        if (isPanning) {
            const canvas = canvasRef.current;
            if(!canvas) return;
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

                    if (interactionState.current.shiftKey) {
                        const ratio = original.width / original.height;
                        if(newWidth / newHeight > ratio) newWidth = newHeight * ratio;
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
                ctx.lineWidth = tool === 'eraser' ? 30 : 5;
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
  
  const handleAddImageClick = () => { fileInputRef.current?.click(); };
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => addImageLayer(img, e.target.files![0].name);
            img.src = event.target?.result as string;
        }
        reader.readAsDataURL(e.target.files[0]);
    }
  };

    const handleGenerate = () => {
        // Use selected layers if available (2-3 elements), otherwise use all visible layers
        const currentLayers = layersRef.current.length > 0 ? layersRef.current : layers;
        const layersToGenerate = selectedLayerIds.length >= 2 
            ? currentLayers.filter(l => selectedLayerIds.includes(l.id) && l.visible && l.id !== 'layer_bg')
            : currentLayers.filter(l => l.visible && l.id !== 'layer_bg');
        
        if (layersToGenerate.length === 0) {
            if (selectedLayerIds.length > 0 && selectedLayerIds.length < 2) {
                alert("Please select 2-3 elements to generate. Drag a selection box around elements to select them.");
            } else {
                alert("No visible content to generate from. Please add or show a layer.");
            }
            return;
        }

        // Use the selection box area if available (from marquee selection), otherwise calculate bounding box
        let minX: number, minY: number, contentWidth: number, contentHeight: number;
        
        if (finalSelectionBox && selectedLayerIds.length >= 2) {
            // Use the exact selection box area that was dragged
            minX = finalSelectionBox.x;
            minY = finalSelectionBox.y;
            contentWidth = Math.round(finalSelectionBox.width);
            contentHeight = Math.round(finalSelectionBox.height);
        } else {
            // Calculate bounding box of selected layers (fallback for single clicks)
            let maxX = -Infinity, maxY = -Infinity;
            minX = Infinity;
            minY = Infinity;
            
            layersToGenerate.forEach(layer => {
                if (layer.type === 'image') {
                    const corners = getLayerCorners(layer);
                    Object.values(corners).forEach(corner => {
                        minX = Math.min(minX, corner.x);
                        minY = Math.min(minY, corner.y);
                        maxX = Math.max(maxX, corner.x);
                        maxY = Math.max(maxY, corner.y);
                    });
                } else if (layer.type === 'drawing') {
                    // For drawing layers, use their bounds
                    minX = Math.min(minX, layer.x);
                    minY = Math.min(minY, layer.y);
                    maxX = Math.max(maxX, layer.x + layer.width);
                    maxY = Math.max(maxY, layer.y + layer.height);
                }
            });

            if (!isFinite(minX)) {
                alert("No visible content to generate from. Please add or show a layer.");
                return; 
            }

            // Add padding around the selection for better context
            const padding = 50;
            contentWidth = Math.round(maxX - minX + padding * 2);
            contentHeight = Math.round(maxY - minY + padding * 2);
            minX -= padding;
            minY -= padding;
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = contentWidth;
        tempCanvas.height = contentHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // White background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw layers that fall within the selection area
        // IMPORTANT: Include ALL drawing layers (text, arrows) that intersect with the selection area, not just selected ones
        const allDrawingLayers = currentLayers.filter(l => l.type === 'drawing' && l.visible && l.id !== 'layer_bg');
        const drawingLayersInArea = allDrawingLayers.filter(layer => {
            // Check if drawing layer intersects with selection area
            return !(
                layer.x + layer.width < minX ||
                layer.x > minX + contentWidth ||
                layer.y + layer.height < minY ||
                layer.y > minY + contentHeight
            );
        });
        
        // Combine selected layers with drawing layers in the area
        const allLayersToDraw = [...layersToGenerate, ...drawingLayersInArea.filter(l => !layersToGenerate.includes(l))];
        
        // Sort layers so drawing layers render on top
        const sortedLayers = [...allLayersToDraw].sort((a, b) => {
            if (a.type === 'drawing' && b.type === 'image') return 1;
            if (a.type === 'image' && b.type === 'drawing') return -1;
            return 0;
        });
        
        sortedLayers.forEach(layer => {
            tempCtx.save();
            if (layer.type === 'image') {
                tempCtx.translate(
                    (layer.x - minX) + layer.width / 2,
                    (layer.y - minY) + layer.height / 2
                );
                tempCtx.rotate(layer.rotation * Math.PI / 180);
                tempCtx.drawImage(layer.data, -layer.width/2, -layer.height/2, layer.width, layer.height);
            } else if (layer.type === 'drawing') {
                // For drawing layers, draw them at their relative position
                tempCtx.translate(
                    (layer.x - minX),
                    (layer.y - minY)
                );
                tempCtx.drawImage(layer.data, 0, 0);
            }
            tempCtx.restore();
        });
        
        const previewDataUrl = tempCanvas.toDataURL('image/png');
        setGeneratePreview(previewDataUrl);
        setGeneratePrompt('');
        setIsGenerateModalOpen(true);
    };

    const handleConfirmGenerate = () => {
        if (!generatePrompt || !generatePreview) {
            alert("Please enter a prompt to describe your desired changes.");
            return;
        }
        
        // For image editing from canvas: use the user's prompt directly
        // The generateImage function will handle the Gemini Vision analysis
        // Just pass the simple prompt - the backend will analyze annotations properly
        const contextualPrompt = textAnnotations.length > 0 
            ? `${generatePrompt}. Image contains text annotations: ${textAnnotations.join(', ')}`
            : generatePrompt;
        
        // Pass the current aspect ratio from the editor to the generation function
        onGenerate(contextualPrompt, generatePreview, aspectRatio);
        setIsGenerateModalOpen(false);
    };
  
  const selectTool = (tool: Tool) => {
      setActiveTool(tool);
      if (tool !== 'select') {
         // Clear selection when switching away from select tool
         setSelectedLayerIds([]);
         const active = getActiveDrawingLayer();
         if (!active) {
            const hasDrawingLayer = layers.some(l => l.type === 'drawing' && l.id !== 'layer_bg');
            if(!hasDrawingLayer) {
                addDrawingLayer();
            } else {
                for(let i = layers.length - 1; i >= 0; i--) {
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
      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 w-20 h-16 transition-colors ${activeTool === tool ? 'bg-[#3a3b3d] text-white' : 'hover:bg-white/10 text-gray-400'}`}
      aria-label={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-[60]">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close editor">
          <CloseIcon className="w-6 h-6 text-white"/>
        </button>
      </div>
      
      <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden bg-[#000000]">
            <canvas 
                ref={canvasRef}
                className="absolute top-0 left-0"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

        {isGenerateModalOpen && (
            <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                <div className="bg-[#1e1f20] rounded-xl p-6 w-full max-w-2xl flex flex-col space-y-4 border border-white/10 shadow-2xl">
                    <h2 className="text-xl font-bold text-gray-100">Generate Image</h2>
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="md:w-1/2">
                            <p className="text-sm text-gray-400 mb-2">Image for Generation:</p>
                            <div className="aspect-square bg-black/20 rounded-lg p-2">
                                <img src={generatePreview!} alt="Generation Preview" className="rounded-md w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="md:w-1/2 flex flex-col">
                            <p className="text-sm text-gray-400 mb-2">Describe what you want to change or create:</p>
                            <textarea 
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                                placeholder="A majestic castle in the background..."
                                className="w-full flex-grow bg-[#2c2d2f] text-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                rows={8}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-[#2c2d2f] rounded-lg hover:bg-[#3a3b3d] text-gray-200 font-medium">Cancel</button>
                        <button onClick={handleConfirmGenerate} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg hover:scale-105 transition-all">Generate</button>
                    </div>
                </div>
            </div>
        )}
        
        {isLayersPanelVisible && (
            <div className="absolute right-4 top-4 h-auto max-h-[calc(100vh-140px)] w-64 bg-[#1e1f20] border border-white/10 rounded-xl p-2.5 shadow-2xl flex flex-col z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-300">Layers</h3>
                    <button onClick={() => setIsLayersPanelVisible(false)} className="text-gray-500 hover:text-white"><CloseIcon className="w-4 h-4"/></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                    {layers.slice().reverse().map(layer => (
                        <div 
                            key={layer.id} 
                            onClick={() => setActiveLayerId(layer.id)}
                            draggable={layer.id !== 'layer_bg'}
                            onDragStart={(e) => handleDragStart(e, layer.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, layer.id)}
                            onDragEnd={() => setDraggedLayerId(null)}
                            className={`p-2 rounded-lg flex items-center space-x-3 transition-all ${activeLayerId === layer.id ? 'bg-[#3a3b3d]' : 'hover:bg-white/10'} ${draggedLayerId === layer.id ? 'opacity-50' : ''} ${layer.id !== 'layer_bg' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                        >
                            <div className="w-10 h-10 bg-black/20 rounded flex-shrink-0 flex items-center justify-center">
                                {layer.type === 'image' ? <img src={(layer.data as HTMLImageElement).src} className="w-full h-full object-contain" alt={layer.name}/> : <PencilIcon className="w-full h-full text-gray-400 p-2.5"/>}
                            </div>
                            <span className="text-xs text-gray-200 flex-grow truncate">{layer.name}</span>
                            {layer.id !== 'layer_bg' && 
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setLayers(ls => {
                                    const updated = ls.filter(l => l.id !== layer.id);
                                    layersRef.current = updated;
                                    return updated;
                                  });
                                }} className="p-1.5 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-full flex-shrink-0"><DeleteIcon /></button>
                            }
                        </div>
                    ))}
                </div>
                <button onClick={addDrawingLayer} className="mt-2 w-full p-2.5 text-xs bg-[#2c2d2f] rounded-lg hover:bg-[#3a3b3d] flex items-center justify-center space-x-2 text-gray-300">
                    <PlusIcon />
                    <span>Add Drawing Layer</span>
                </button>
            </div>
        )}

        {textInputState.visible && (
            <>
                {/* Backdrop to capture clicks outside - transparent but captures events */}
                <div 
                    className="fixed inset-0 z-[9999]"
                    style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                        // Only handle if clicking directly on backdrop (not input container)
                        const target = e.target as HTMLElement;
                        if (target === e.currentTarget || !target.closest('.text-input-container')) {
                            e.stopPropagation();
                            // Don't preventDefault - let the input handle its own events
                            // Submit text if it has content, otherwise just close
                            setTimeout(() => {
                                if (textInputState.value.trim()) {
                                    handleTextSubmit();
                                } else {
                                    setTextInputState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
                                }
                            }, 100);
                        }
                    }}
                />
                <div 
                    className="fixed pointer-events-auto text-input-container"
                    style={{ 
                        left: `${textInputState.x}px`, 
                        top: `${textInputState.y}px`, 
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10000
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <input
                        ref={textInputRef}
                        type="text"
                        value={textInputState.value}
                        onChange={(e) => {
                            setTextInputState(s => ({ ...s, value: e.target.value }));
                        }}
                        onBlur={(e) => {
                            // Don't auto-submit on blur - let backdrop handle it
                            // This prevents double submission
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            // Submit immediately
                            if (textInputState.value.trim()) {
                                handleTextSubmit();
                            } else {
                                setTextInputState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setTextInputState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
                          }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                        }}
                        className="bg-black text-white px-3 py-2 border-2 border-emerald-500 rounded-md shadow-lg outline-none focus:ring-2 focus:ring-emerald-400 text-lg"
                        style={{ minWidth: '200px', minHeight: '44px' }}
                        placeholder="Type text and press Enter"
                        autoFocus
                    />
                </div>
            </>
        )}
        <input type="file" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden"/>
      </div>
      
      {(activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'rect' || activeTool === 'arrow' || activeTool === 'text') && (
        <div className="absolute bottom-[110px] w-full flex justify-center z-10 pointer-events-none">
            <div className="bg-[#2c2d2f] p-2 rounded-lg flex space-x-2 shadow-2xl border border-white/10 pointer-events-auto">
                {['#FFFFFF', '#000000', '#ff453a', '#0a84ff', '#30d158', '#ffd60a'].map(color => (
                    <button 
                        key={color} 
                        onClick={() => setTextColor(color)} 
                        style={{ backgroundColor: color }} 
                        className={`w-8 h-8 rounded-md transition-transform hover:scale-110 ${textColor === color ? 'ring-2 ring-offset-2 ring-offset-[#2c2d2f] ring-white' : ''}`}
                        aria-label={`Set color to ${color}`}
                    />
                ))}
            </div>
        </div>
      )}

      <footer className="absolute bottom-4 w-full max-w-7xl px-4">
        <div className="bg-[#1e1f20] border border-white/10 rounded-xl p-2 shadow-2xl flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
                <ToolButton tool="select" label="Select" icon={<SelectIcon className={`w-6 h-6 ${activeTool === 'select' ? 'text-white' : ''}`}/>} />
                <ToolButton tool="pencil" label="Draw" icon={<PencilIcon className="w-6 h-6"/>} />
                <ToolButton tool="eraser" label="Eraser" icon={<EraserIcon className="w-6 h-6"/>} />
                <ToolButton tool="rect" label="Shape" icon={<ShapeIcon className="w-6 h-6"/>} />
                <ToolButton tool="arrow" label="Arrow" icon={<ArrowIcon className="w-6 h-6"/>} />
                <ToolButton tool="text" label="Text" icon={<TextToolIcon className="w-6 h-6"/>} />
                <button
                    onClick={handleAddImageClick}
                    className="p-2 rounded-lg flex flex-col items-center justify-center space-y-1 w-20 h-16 transition-colors hover:bg-white/10 text-gray-400"
                    aria-label="Add Image"
                    >
                    <ImageIcon className="w-6 h-6"/>
                    <span className="text-xs">Image</span>
                </button>
            </div>
            
            {/* Show generate button when 2-3 elements are selected, or always show for full canvas generation */}
            {(selectedLayerIds.length >= 2 && selectedLayerIds.length <= 3) || selectedLayerIds.length === 0 ? (
                <button
                    onClick={handleGenerate}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg flex items-center space-x-2 transition-all duration-200 ease-in-out hover:scale-105"
                    title={selectedLayerIds.length >= 2 ? `Generating from ${selectedLayerIds.length} selected elements` : "Generate from entire canvas"}
                >
                    <span>Generate</span>
                    {selectedLayerIds.length >= 2 && (
                        <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded">({selectedLayerIds.length} selected)</span>
                    )}
                </button>
            ) : (
                <div className="px-4 py-2 text-sm text-gray-400" title="Drag a selection box around elements to select them">
                    Select 2-3 elements (Drag selection box)
                </div>
            )}
            {/* Show selection count indicator */}
            {selectedLayerIds.length > 0 && selectedLayerIds.length < 2 && (
                <div className="px-3 py-1 text-xs text-gray-300 bg-gray-800/50 rounded">
                    {selectedLayerIds.length} selected - Drag selection box to add more
                </div>
            )}

            <div className="flex items-center space-x-1 p-1 bg-black/20 rounded-lg relative">
                <button onClick={() => setIsAspectOpen(o => !o)} className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-white/10 rounded-md" aria-label="Aspect Ratio">
                    <AspectRatioIcon />
                    <span className="text-sm font-semibold">{aspectRatio}</span>
                </button>
                 {isAspectOpen && (
                    <div className="absolute bottom-full mb-2 right-0 w-28 bg-[#3a3b3d] rounded-lg p-1 shadow-lg border border-white/10 z-10">
                        {aspectRatios.map(ratio => (
                            <button key={ratio} onClick={() => { setAspectRatio(ratio); setIsAspectOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-[#4c4d4f] ${aspectRatio === ratio ? 'text-white bg-[#4c4d4f]' : 'text-gray-300'}`}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={() => setIsLayersPanelVisible(v => !v)} className={`p-2.5 hover:bg-white/10 rounded-md ${isLayersPanelVisible ? 'text-white bg-white/10' : 'text-gray-400'}`} aria-label="Toggle Layers Panel"><LayersIcon /></button>
                <button className="p-2.5 text-gray-400 hover:bg-white/10 rounded-md" aria-label="Info"><InfoIcon /></button>
            </div>
        </div>
      </footer>
    </div>
  );
};
