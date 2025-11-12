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
}

interface ImageEditorProps {
  imageSrc: string;
  onClose: () => void;
  onGenerate: (prompt: string, editedImage: string) => void;
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
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
  });

  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [isAspectOpen, setIsAspectOpen] = useState(false);
  const aspectRatios = ["9:16", "16:9", "4:3", "3:4", "1:1"];

  // FIX: Use a controlled state object for the text input to ensure stability.
  const [textInputState, setTextInputState] = useState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePreview, setGeneratePreview] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');

  // Effect to focus and manage the text input when it becomes visible.
  useEffect(() => {
    if (textInputState.visible && textInputRef.current) {
      textInputRef.current.focus();
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
    const activeLayer = layers.find(l => l.id === activeLayerId);
    return (activeLayer && activeLayer.type === 'drawing') ? activeLayer : null;
  }, [layers, activeLayerId]);

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

        // Draw layers from bottom to top
        const layersToRender = [...layers];
        layersToRender.forEach(layer => {
            if (!layer.visible) return;
            ctx.save();
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.drawImage(layer.data, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
            ctx.restore();
        });
        
        // Draw transform handles for active image layer
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (activeLayer && activeLayer.type === 'image' && activeTool === 'select') {
            const handles = getHandles(activeLayer);
            const handleSizeOnCanvas = HANDLE_SIZE / viewState.zoom;
            ctx.save();

            // Draw bounding box
            ctx.beginPath();
            ctx.moveTo(handles.tl.x, handles.tl.y);
            ctx.lineTo(handles.tr.x, handles.tr.y);
            ctx.lineTo(handles.br.x, handles.br.y);
            ctx.lineTo(handles.bl.x, handles.bl.y);
            ctx.closePath();
            ctx.strokeStyle = '#a2ff00';
            ctx.lineWidth = 1.5 / viewState.zoom;
            ctx.stroke();

            // Draw rotation line and handle
            ctx.beginPath();
            ctx.moveTo(handles.tm.x, handles.tm.y);
            ctx.lineTo(handles.rotate.x, handles.rotate.y);
            ctx.strokeStyle = '#a2ff00';
            ctx.stroke();

            Object.values(handles).forEach((handle: {x: number; y: number}) => {
                ctx.fillStyle = '#a2ff00';
                ctx.strokeStyle = '#1a1a1a'
                ctx.lineWidth = 2 / viewState.zoom;
                ctx.fillRect(handle.x - handleSizeOnCanvas / 2, handle.y - handleSizeOnCanvas / 2, handleSizeOnCanvas, handleSizeOnCanvas);
                ctx.strokeRect(handle.x - handleSizeOnCanvas / 2, handle.y - handleSizeOnCanvas / 2, handleSizeOnCanvas, handleSizeOnCanvas);
            });

            ctx.restore();
        }

        // Draw temporary user interactions (drawing, shapes)
        const { isDown, tool, startPoint, currentPoint, path } = interactionState.current;
        if (isDown && getActiveDrawingLayer()) {
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
    }, [layers, activeLayerId, activeTool, getHandles, viewState, getActiveDrawingLayer, textColor]);
  
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
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(layerId);
    setActiveTool('select');
  }, [screenToCanvas]);

  const addDrawingLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerOfView = screenToCanvas({ x: canvas.getBoundingClientRect().left + canvas.width / 2, y: canvas.getBoundingClientRect().top + canvas.height / 2 });

    const newDrawingCanvas = document.createElement('canvas');
    const layerSize = 1024;
    newDrawingCanvas.width = layerSize;
    newDrawingCanvas.height = layerSize;

    const layerId = `layer_${Date.now()}`;
    const newLayer: Layer = {
        id: layerId,
        type: 'drawing',
        name: `Drawing ${layers.filter(l => l.type === 'drawing').length + 1}`,
        visible: true,
        x: centerOfView.x - layerSize / 2,
        y: centerOfView.y - layerSize / 2,
        width: layerSize,
        height: layerSize,
        rotation: 0,
        data: newDrawingCanvas,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(layerId);
    return newLayer;
  }, [layers, screenToCanvas]);

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

            setLayers([backgroundLayer, imageLayer]);
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
    if (textInputState.visible) return;
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
        
        let clickedLayer: Layer | null = null;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
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
            setActiveLayerId(clickedLayer.id);
            interactionState.current.targetLayerId = clickedLayer.id;
            interactionState.current.originalLayerState = { ...clickedLayer };
        } else {
            const canvas = canvasRef.current;
            if(!canvas) return;
            const rect = canvas.getBoundingClientRect();
            interactionState.current.isPanning = true;
            interactionState.current.panStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    } else if (activeTool === 'text') {
        if (getActiveDrawingLayer()) {
            setTextInputState({ visible: true, x: e.clientX, y: e.clientY, worldX: canvasPos.x, worldY: canvasPos.y, value: '' });
        } else {
             alert("Please select or create a drawing layer to add text.");
        }
    } else {
        if (getActiveDrawingLayer()) {
             if (activeTool === 'pencil' || activeTool === 'eraser') {
                 interactionState.current.path = [canvasPos];
             }
        } else if (activeTool !== 'rect' && activeTool !== 'arrow') {
          // Auto-create a layer if needed for drawing tools
          const newLayer = addDrawingLayer();
          setActiveLayerId(newLayer.id);
           if (activeTool === 'pencil' || activeTool === 'eraser') {
               interactionState.current.path = [canvasPos];
           }
        }
    }
  };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        interactionState.current.shiftKey = e.shiftKey;
        if (!interactionState.current.isDown) return;
        
        const canvasPos = screenToCanvas({x: e.clientX, y: e.clientY});
        const { tool, targetLayerId, startPoint, originalLayerState, transformHandle, isPanning } = interactionState.current;
        
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
                    setLayers(ls => ls.map(l => l.id === targetLayerId ? { ...l, rotation: original.rotation + angleDiff } : l));
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

                    setLayers(ls => ls.map(l => l.id === targetLayerId ? { ...l, width: Math.max(10, newWidth), height: Math.max(10, newHeight), x: newX, y: newY } : l));
                }
            } else {
                 setLayers(ls => ls.map(l => l.id === targetLayerId ? { ...l, x: originalLayerState.x + dx, y: originalLayerState.y + dy } : l));
            }
        } else if (getActiveDrawingLayer() && (tool === 'pencil' || tool === 'eraser')) {
            interactionState.current.path?.push(canvasPos);
        }
    };
    const handleMouseUp = () => {
        if (!interactionState.current.isDown) return;
        const { tool, startPoint, currentPoint, path } = interactionState.current;

        const activeDrawingLayer = getActiveDrawingLayer();
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
                    // FIX: Use a single, valid path to draw the arrow correctly.
                    const headlen = 15;
                    const dx = localCurrent.x - localStart.x;
                    const dy = localCurrent.y - localStart.y;
                    const angle = Math.atan2(dy, dx);
                    ctx.beginPath();
                    ctx.moveTo(localStart.x, localStart.y);
                    ctx.lineTo(localCurrent.x, localCurrent.y);
                    ctx.lineTo(localCurrent.x - headlen * Math.cos(angle - Math.PI / 6), localCurrent.y - headlen * Math.sin(angle - Math.PI / 6));
                    ctx.moveTo(localCurrent.x, localCurrent.y);
                    ctx.lineTo(localCurrent.x - headlen * Math.cos(angle + Math.PI / 6), localCurrent.y - headlen * Math.sin(angle + Math.PI / 6));
                    ctx.stroke();
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
            }
        }
        
        interactionState.current = { ...interactionState.current, isDown: false, targetLayerId: null, originalLayerState: null, path: [], transformHandle: undefined, isPanning: false };
    };

    // FIX: Refactored to use controlled state, preventing unexpected closing.
    const handleTextSubmit = () => {
        if (!textInputState.visible) return;

        const { worldX, worldY, value } = textInputState;
        const textValue = value.trim();
        const activeDrawingLayer = getActiveDrawingLayer();
        
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
            }
        }
        
        setTextInputState({ visible: false, x: 0, y: 0, worldX: 0, worldY: 0, value: '' });
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
        if (layers.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        layers.forEach(layer => {
            if (!layer.visible || layer.id === 'layer_bg') return;
            const corners = getLayerCorners(layer);
            Object.values(corners).forEach(corner => {
                minX = Math.min(minX, corner.x);
                minY = Math.min(minY, corner.y);
                maxX = Math.max(maxX, corner.x);
                maxY = Math.max(maxY, corner.y);
            });
        });

        if (!isFinite(minX)) {
        alert("No visible content to generate from. Please add or show a layer.");
        return; 
        }

        const contentWidth = Math.round(maxX - minX);
        const contentHeight = Math.round(maxY - minY);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = contentWidth;
        tempCanvas.height = contentHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        layers.forEach(layer => {
            if (!layer.visible || layer.id === 'layer_bg') return;
            tempCtx.save();
            tempCtx.translate(
                (layer.x - minX) + layer.width / 2,
                (layer.y - minY) + layer.height / 2
            );
            tempCtx.rotate(layer.rotation * Math.PI / 180);
            tempCtx.drawImage(layer.data, -layer.width/2, -layer.height/2, layer.width, layer.height);
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
        onGenerate(generatePrompt, generatePreview);
        setIsGenerateModalOpen(false);
    };
  
  const selectTool = (tool: Tool) => {
      setActiveTool(tool);
      if (tool !== 'select') {
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
        if (sourceIndex === -1 || targetIndex === -1) return prevLayers;

        const newLayers = [...prevLayers];
        const [removed] = newLayers.splice(sourceIndex, 1);
        newLayers.splice(targetIndex, 0, removed);
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
                                className="w-full flex-grow bg-[#2c2d2f] text-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#a2ff00] resize-none"
                                rows={8}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-[#2c2d2f] rounded-lg hover:bg-[#3a3b3d] text-gray-200 font-medium">Cancel</button>
                        <button onClick={handleConfirmGenerate} className="px-6 py-2 bg-[#a2ff00] text-black font-semibold rounded-lg hover:scale-105 transition-transform">Generate</button>
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
                                <button onClick={(e) => { e.stopPropagation(); setLayers(ls => ls.filter(l => l.id !== layer.id)); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-full flex-shrink-0"><DeleteIcon /></button>
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
            <div style={{ position: 'fixed', left: `${textInputState.x}px`, top: `${textInputState.y}px`, zIndex: 100, transform: 'translate(-50%, -50%)' }}>
                <textarea
                    ref={textInputRef}
                    value={textInputState.value}
                    onChange={(e) => setTextInputState(s => ({ ...s, value: e.target.value }))}
                    onBlur={handleTextSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setTextInputState(s => ({ ...s, visible: false, value: '' })); // Cancel
                      }
                    }}
                    className="bg-black text-white p-2 border border-gray-500 rounded-md shadow-lg outline-none resize-none"
                    rows={1}
                    style={{ minWidth: '100px', minHeight: '40px' }}
                />
            </div>
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
            
            <button
                onClick={handleGenerate}
                className="px-8 py-4 bg-[#a2ff00] text-black font-semibold rounded-lg flex items-center space-x-2 transition-transform duration-200 ease-in-out hover:scale-105"
            >
                <span>Generate</span>
            </button>

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
