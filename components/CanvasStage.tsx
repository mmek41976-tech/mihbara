
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Project, Brush, Stroke, Point, ToolType, Layer } from '../types';
import { getPressure, stabilizePoint, drawStroke } from '../utils/drawingUtils';
import { RefreshCw } from 'lucide-react';

interface CanvasStageProps {
  project: Project;
  onUpdateStrokes: (strokes: Stroke[]) => void;
  activeBrush: Brush;
  activeColor: string;
  activeLayerId: string;
  isPaperTextureEnabled: boolean;
  isCalligraphyMode: boolean;
  activeTool: ToolType;
  zoom: number;
  pan: { x: number, y: number };
  setPan: (pan: { x: number, y: number }) => void;
  setZoom: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const PADDING = 200; // هامش أمان للسماح للفرشاة بالرسم خارج الحدود

const LayerCanvas: React.FC<{ 
  layer: Layer, 
  project: Project, 
  isTemp?: boolean, 
  tempStroke?: Stroke | null 
}> = React.memo(({ layer, project, isTemp, tempStroke }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (layer.type === 'image' && layer.imageUrl) {
      const img = new Image();
      img.src = layer.imageUrl;
      img.onload = () => setLoadedImage(img);
      img.onerror = () => {
        console.error("Failed to load image for layer", layer.name);
        setLoadedImage(null);
      }
    } else {
      setLoadedImage(null);
    }
  }, [layer.type, layer.imageUrl]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const widthWithPadding = project.width + PADDING * 2;
    const heightWithPadding = project.height + PADDING * 2;

    canvas.width = Math.round(widthWithPadding * dpr);
    canvas.height = Math.round(heightWithPadding * dpr);
    canvas.style.width = `${widthWithPadding}px`;
    canvas.style.height = `${heightWithPadding}px`;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, widthWithPadding, heightWithPadding);
    ctx.translate(PADDING, PADDING);

    if (layer.type === 'image') {
      if (loadedImage) {
        ctx.drawImage(loadedImage, 0, 0, project.width, project.height);
      }
    } else { // It's a drawing layer
      if (isTemp) {
        if (tempStroke) {
          drawStroke(ctx, tempStroke);
        }
      } else {
        const layerStrokes = project.strokes.filter(s => s.layerId === layer.id);
        layerStrokes.forEach(stroke => {
          drawStroke(ctx, stroke);
        });
      }
    }
    ctx.restore();
  }, [project.strokes, project.width, project.height, layer, isTemp, tempStroke, loadedImage]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute pointer-events-none"
      style={{ 
        opacity: layer.isVisible ? layer.opacity : 0,
        mixBlendMode: layer.blendMode as any,
        top: `${-PADDING}px`,
        left: `${-PADDING}px`,
      }}
    />
  );
});

const BrushCursor: React.FC<{ 
  pos: { x: number, y: number } | null, 
  brush: Brush, 
  zoom: number,
  activeTool: ToolType 
}> = ({ pos, brush, zoom, activeTool }) => {
  if (!pos || activeTool === ToolType.HAND) return null;

  const { size, angle, roundness } = brush.settings;
  const scaledSize = size * zoom;
  const scaledHeight = Math.max(1, scaledSize * (roundness / 100));

  return (
    <div 
      className="fixed pointer-events-none z-[60] mix-blend-difference"
      style={{
        left: pos.x,
        top: pos.y,
        width: `${scaledSize}px`,
        height: `${scaledHeight}px`,
        border: '1.5px solid #C2A24D',
        borderRadius: '50%',
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        backgroundColor: activeTool === ToolType.ERASER ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
      }}
    />
  );
};

const CanvasStage: React.FC<CanvasStageProps> = ({ 
  project, 
  onUpdateStrokes, 
  activeBrush, 
  activeColor, 
  activeLayerId,
  activeTool,
  zoom,
  pan,
  setPan,
  setZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number, y: number } | null>(null);
  
  const isMiddleClickPanning = useRef(false);
  const startPanPos = useRef({ x: 0, y: 0 });
  const startPointerPos = useRef({ x: 0, y: 0 });

  const getCanvasPoint = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return { x: NaN, y: NaN, pressure: 0, timestamp: Date.now() };
  
    const rect = wrapper.getBoundingClientRect();
  
    // Calculate pointer position relative to the transformed canvas's top-left corner
    const pointX = e.clientX - rect.left;
    const pointY = e.clientY - rect.top;
  
    // Scale the coordinates back to the original canvas size by dividing by zoom
    const x = pointX / zoom;
    const y = pointY / zoom;
  
    if (isNaN(x) || isNaN(y)) {
      return { x: NaN, y: NaN, pressure: 0, timestamp: Date.now() };
    }
  
    return { 
      x, 
      y, 
      pressure: getPressure(e as any), 
      timestamp: Date.now() 
    };
  }, [zoom]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      isMiddleClickPanning.current = true;
      startPointerPos.current = { x: e.clientX, y: e.clientY };
      startPanPos.current = { ...pan };
      setIsPointerDown(true);
      return;
    }

    if (activeTool === ToolType.HAND) {
      startPointerPos.current = { x: e.clientX, y: e.clientY };
      startPanPos.current = { ...pan };
      setIsPointerDown(true);
      return;
    }

    if (e.button !== 0) return;

    const activeLayer = project.layers.find(l => l.id === activeLayerId);
    if (activeLayer && (activeLayer.type === 'image' || activeLayer.isLocked)) {
        return;
    }

    const point = getCanvasPoint(e);
    if (isNaN(point.x)) return;

    setIsPointerDown(true);
    
    const newStroke: Stroke = {
      id: `stroke-${Date.now()}`,
      brushId: activeTool === ToolType.ERASER ? 'eraser' : activeBrush.id,
      brushSettings: activeTool === ToolType.ERASER 
        ? { ...activeBrush.settings, opacity: 1 } 
        : { ...activeBrush.settings },
      color: activeColor,
      points: [point],
      layerId: activeLayerId
    };
    
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setPointerPos({ x: e.clientX, y: e.clientY });

    if (!isPointerDown) return;

    if (activeTool === ToolType.HAND || isMiddleClickPanning.current) {
      const dx = e.clientX - startPointerPos.current.x;
      const dy = e.clientY - startPointerPos.current.y;
      setPan({
        x: startPanPos.current.x + dx,
        y: startPanPos.current.y + dy
      });
      return;
    }

    if (!currentStroke) return;

    const rawPoint = getCanvasPoint(e);
    if (isNaN(rawPoint.x)) return;
    
    const stabilized = stabilizePoint(currentStroke.points, rawPoint, activeBrush.settings.stabilization);
    
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, stabilized]
    } : null);
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 0) {
      onUpdateStrokes([...project.strokes, currentStroke]);
    }
    setCurrentStroke(null);
    setIsPointerDown(false);
    isMiddleClickPanning.current = false;
  };

  const handleResetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  const backgroundStyle = useMemo(() => {
    return {
      width: `${project.width}px`,
      height: `${project.height}px`,
      backgroundColor: project.backgroundColor || '#ffffff',
      transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
      transformOrigin: 'center',
      position: 'relative' as const,
      boxShadow: '0 0 0 1px rgba(122, 92, 62, 0.2), 0 30px 60px -12px rgba(0, 0, 0, 0.5)',
      transition: 'none', 
      willChange: 'transform',
      overflow: 'hidden', // إخفاء الهامش الزائد
    };
  }, [project.width, project.height, project.backgroundColor, zoom, pan]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden flex items-center justify-center bg-[#1C1B18] touch-none 
        ${activeTool === ToolType.HAND || isMiddleClickPanning.current ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ cursor: activeTool === ToolType.HAND || isMiddleClickPanning.current ? undefined : 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { handlePointerUp(); setPointerPos(null); }}
      onPointerEnter={(e) => setPointerPos({ x: e.clientX, y: e.clientY })}
      onContextMenu={(e) => e.preventDefault()}
    >
      <BrushCursor pos={pointerPos} brush={activeBrush} zoom={zoom} activeTool={activeTool} />

      <div ref={canvasWrapperRef} style={backgroundStyle} className="pointer-events-auto">
        {project.layers.map(layer => (
          <React.Fragment key={layer.id}>
            <LayerCanvas layer={layer} project={project} />
            {activeLayerId === layer.id && currentStroke && layer.type === 'drawing' && (
              <LayerCanvas 
                layer={layer} 
                project={project} 
                isTemp 
                tempStroke={currentStroke} 
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
        <button 
          onClick={handleResetView}
          className="p-3 bg-black/60 backdrop-blur-md text-[#C2A24D] rounded-full border border-[#7A5C3E]/30 hover:bg-[#C2A24D] hover:text-[#1C1B18] transition-all shadow-xl"
          title="إعادة ضبط العرض"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-[12px] text-[#C2A24D] font-mono border border-[#7A5C3E]/30 pointer-events-none z-50 shadow-lg">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasStage;
