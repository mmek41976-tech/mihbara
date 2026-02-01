
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Undo2, Redo2, Plus, FolderOpen, ChevronRight, ChevronLeft,
  PenTool, Eraser, ZoomIn, ZoomOut, Save, Cloud, CloudCheck, 
  Bell, Hand, User as UserIcon, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Project, Brush, Layer, Stroke, ToolType, BrushCollection, User, UserSettings
} from './types';
import { COLORS, DEFAULT_BRUSHES } from './constants';
import CanvasStage from './components/CanvasStage';
import ControlPanel from './components/ControlPanel';
import ProjectModal from './components/ProjectModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { decodeBrushFromLink, encodeBrushForLink } from './utils/brushUtils';
import { drawStroke } from './utils/drawingUtils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customBrushes, setCustomBrushes] = useState<Brush[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeBrush, setActiveBrush] = useState<Brush>(DEFAULT_BRUSHES[0]);
  const [activeColor, setActiveColor] = useState<string>(COLORS.INK_BLACK);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PEN);
  const [previousTool, setPreviousTool] = useState<ToolType>(ToolType.PEN);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isPaperTextureEnabled, setIsPaperTextureEnabled] = useState(true);
  const [isCalligraphyMode, setIsCalligraphyMode] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const mainRef = useRef<HTMLElement>(null);

  const [history, setHistory] = useState<Record<string, Stroke[][]>>({});
  const [redoStack, setRedoStack] = useState<Record<string, Stroke[][]>>({});

  const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId) || null, [projects, currentProjectId]);

  const addNotification = useCallback((message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  const handleLogin = useCallback(() => {
    const mockUser: User = {
      id: `user-${Date.now()}`,
      name: 'عمر الخطاط',
      email: 'omar.khattat@example.com',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      isLoggedIn: true,
      settings: {
        language: 'ar',
        autoSave: true,
        showGrid: false,
        uiScale: 1,
      }
    };
    setUser(mockUser);
    setIsAuthModalOpen(false);
    addNotification(`أهلاً بك مجدداً، ${mockUser.name}`);
  }, [addNotification]);

  const fitToView = useCallback((project: Project) => {
    if (!mainRef.current) return;
    
    const rect = mainRef.current.getBoundingClientRect();
    const availableWidth = rect.width - 120; // زيادة هامش الأمان
    const availableHeight = rect.height - 120;
    
    const scaleX = availableWidth / project.width;
    const scaleY = availableHeight / project.height;
    
    const newZoom = Math.max(0.1, Math.min(scaleX, scaleY, 1));
    
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && activeTool !== ToolType.HAND) {
        setPreviousTool(activeTool);
        setActiveTool(ToolType.HAND);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeTool === ToolType.HAND) {
        setActiveTool(previousTool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, previousTool]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mihbara_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const prefix = savedUser ? `user_${JSON.parse(savedUser).id}_` : 'local_';
    const savedProjects = localStorage.getItem(`${prefix}projects`);
    
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
        if (parsed.length > 0) {
          setCurrentProjectId(parsed[0].id);
          setActiveLayerId(parsed[0].layers[0]?.id || '');
          setTimeout(() => fitToView(parsed[0]), 200);
        } else {
          setIsProjectModalOpen(true);
        }
      } catch (e) { setIsProjectModalOpen(true); }
    } else {
      setIsProjectModalOpen(true);
    }

    const savedBrushes = localStorage.getItem(`${prefix}custom_brushes`);
    if (savedBrushes) setCustomBrushes(JSON.parse(savedBrushes));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('mihbara_user', JSON.stringify(user));
    const prefix = user ? `user_${user.id}_` : 'local_';
    localStorage.setItem(`${prefix}projects`, JSON.stringify(projects));
    localStorage.setItem(`${prefix}custom_brushes`, JSON.stringify(customBrushes));
  }, [projects, customBrushes, user]);

  const handleCreateProject = (name: string, width: number, height: number) => {
    const initialLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: 'طبقة 1',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      // Fix: Use 'source-over' for the blend mode, as 'normal' is invalid for Canvas's globalCompositeOperation.
      blendMode: 'source-over',
      type: 'drawing'
    };
    
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: name,
      width,
      height,
      backgroundColor: '#ffffff',
      layers: [initialLayer],
      strokes: [],
      lastModified: Date.now()
    };

    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    setActiveLayerId(initialLayer.id);
    setIsProjectModalOpen(false);
    setTimeout(() => fitToView(newProject), 100);
    addNotification('تم إنشاء لوحة جديدة');
  };

  const handleDeleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (currentProjectId === id) {
        if (updated.length > 0) {
          setCurrentProjectId(updated[0].id);
          setActiveLayerId(updated[0].layers[0]?.id || '');
        } else {
          setCurrentProjectId(null);
          setActiveLayerId('');
          setIsProjectModalOpen(true);
        }
      }
      return updated;
    });
    addNotification('تم حذف المشروع');
  }, [currentProjectId, addNotification]);

  const handleUpdateStrokes = useCallback((newStrokes: Stroke[]) => {
    if (!currentProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        setHistory(h => ({
          ...h,
          [currentProjectId]: [...(h[currentProjectId] || []), p.strokes].slice(-50)
        }));
        setRedoStack(r => ({ ...r, [currentProjectId]: [] }));
        return { ...p, strokes: newStrokes, lastModified: Date.now() };
      }
      return p;
    }));
  }, [currentProjectId]);

  const handleUndo = useCallback(() => {
    if (!currentProjectId || !history[currentProjectId]?.length) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        const h = history[currentProjectId];
        const lastStrokes = h[h.length - 1];
        setRedoStack(r => ({ ...r, [currentProjectId]: [...(r[currentProjectId] || []), p.strokes] }));
        setHistory(prevH => ({ ...prevH, [currentProjectId]: h.slice(0, -1) }));
        return { ...p, strokes: lastStrokes };
      }
      return p;
    }));
  }, [currentProjectId, history]);

  const handleRedo = useCallback(() => {
    if (!currentProjectId || !redoStack[currentProjectId]?.length) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        const rs = redoStack[currentProjectId];
        const nextStrokes = rs[rs.length - 1];
        setHistory(h => ({ ...h, [currentProjectId]: [...(h[currentProjectId] || []), p.strokes] }));
        setRedoStack(prevR => ({ ...prevR, [currentProjectId]: rs.slice(0, -1) }));
        return { ...p, strokes: nextStrokes };
      }
      return p;
    }));
  }, [currentProjectId, redoStack]);

  const handleAddLayer = useCallback(() => {
    if (!currentProjectId || !currentProject) return;
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `طبقة ${currentProject.layers.length + 1}`,
      isVisible: true,
      isLocked: false,
      opacity: 1,
      // Fix: Use 'source-over' for the blend mode, as 'normal' is invalid for Canvas's globalCompositeOperation.
      blendMode: 'source-over',
      type: 'drawing'
    };
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        const activeLayerIndex = p.layers.findIndex(l => l.id === activeLayerId);
        const newLayers = [...p.layers];
        newLayers.splice(activeLayerIndex >= 0 ? activeLayerIndex + 1 : p.layers.length, 0, newLayer);
        return { ...p, layers: newLayers };
      }
      return p;
    }));
    setActiveLayerId(newLayer.id);
  }, [currentProjectId, currentProject, activeLayerId]);

  const handleImportImageLayer = useCallback((file: File) => {
    if (!currentProjectId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const newLayer: Layer = {
        id: `layer-img-${Date.now()}`,
        name: file.name,
        isVisible: true,
        isLocked: false,
        opacity: 1,
        // Fix: Use 'source-over' for the blend mode, as 'normal' is invalid for Canvas's globalCompositeOperation.
        blendMode: 'source-over',
        type: 'image',
        imageUrl: imageUrl,
      };

      setProjects(prev => prev.map(p => {
        if (p.id === currentProjectId) {
          const activeLayerIndex = p.layers.findIndex(l => l.id === activeLayerId);
          const newLayers = [...p.layers];
          newLayers.splice(activeLayerIndex >= 0 ? activeLayerIndex + 1 : p.layers.length, 0, newLayer);
          return { ...p, layers: newLayers };
        }
        return p;
      }));
      setActiveLayerId(newLayer.id);
      addNotification('تم استيراد الصورة كطبقة جديدة');
    };
    reader.readAsDataURL(file);
  }, [currentProjectId, activeLayerId, addNotification]);

  const handleExportPNG = useCallback(async () => {
    if (!currentProject) return;

    addNotification('بدء عملية التصدير، قد يستغرق الأمر بعض الوقت...');

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = currentProject.width;
    finalCanvas.height = currentProject.height;
    const finalCtx = finalCanvas.getContext('2d');

    if (!finalCtx) {
      addNotification('فشل تهيئة لوحة التصدير');
      return;
    }

    // 1. Fill background
    finalCtx.fillStyle = currentProject.backgroundColor || '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // 2. Preload all images from visible image layers
    const imageLayers = currentProject.layers.filter(l => l.type === 'image' && l.imageUrl && l.isVisible);
    const imagePromises = imageLayers.map(layer => {
      return new Promise<{ layerId: string; image: HTMLImageElement }>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({ layerId: layer.id, image: img });
        img.onerror = () => reject(new Error(`Could not load image for layer ${layer.name}`));
        img.src = layer.imageUrl!;
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);
      const imageMap = new Map(loadedImages.map(item => [item.layerId, item.image]));

      // 3. Composite layers in order
      for (const layer of currentProject.layers) {
        if (!layer.isVisible) continue;

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = currentProject.width;
        layerCanvas.height = currentProject.height;
        const layerCtx = layerCanvas.getContext('2d');
        if (!layerCtx) continue;

        // Draw content for the current layer
        if (layer.type === 'image') {
          const img = imageMap.get(layer.id);
          // FIX: Add an explicit instanceof check to satisfy stricter type checking for drawImage.
          if (img instanceof HTMLImageElement) {
            layerCtx.drawImage(img, 0, 0, layerCanvas.width, layerCanvas.height);
          }
        } else if (layer.type === 'drawing') {
          const layerStrokes = currentProject.strokes.filter(s => s.layerId === layer.id);
          layerStrokes.forEach(stroke => {
            drawStroke(layerCtx, stroke);
          });
        }

        // Composite this layer onto the final canvas
        finalCtx.save();
        finalCtx.globalAlpha = layer.opacity;
        finalCtx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        finalCtx.drawImage(layerCanvas, 0, 0);
        finalCtx.restore();
      }

      // 4. Create download link
      const link = document.createElement('a');
      link.download = `${currentProject.name}_export.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
      addNotification('تم تصدير الصورة بنجاح');
    } catch (error) {
      console.error("Export failed:", error);
      addNotification('حدث خطأ أثناء تصدير الصورة');
    }
  }, [currentProject, addNotification]);

  const isRtl = (user?.settings?.language || 'ar') === 'ar';

  return (
    <div className={`flex h-screen w-full bg-[#12110F] text-[#F3EAD9] overflow-hidden select-none`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-4 left-1/2 z-[500] bg-[#C2A24D] text-[#1C1B18] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold">
            <Bell size={18} /> <span>{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative flex-grow flex flex-col min-w-0">
        <header className="h-14 bg-[#1C1B18]/95 backdrop-blur-xl border-b border-[#7A5C3E]/30 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-amiri text-[#C2A24D] font-bold cursor-pointer" onClick={() => setIsProjectModalOpen(true)}>محبرة</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#242320] rounded-lg p-1 border border-[#7A5C3E]/20">
              <button onClick={handleUndo} className="p-1.5 hover:bg-[#C2A24D]/20 rounded disabled:opacity-20" disabled={!history[currentProjectId!]?.length}><Undo2 size={16} /></button>
              <button onClick={handleRedo} className="p-1.5 hover:bg-[#C2A24D]/20 rounded disabled:opacity-20" disabled={!redoStack[currentProjectId!]?.length}><Redo2 size={16} /></button>
            </div>
            <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#C2A24D] text-[#1C1B18] rounded-md font-bold text-xs"><FolderOpen size={14} /> <span className="hidden xs:inline">{isRtl ? 'المشاريع' : 'Projects'}</span></button>
            {user ? (
              <button onClick={() => setIsProfileModalOpen(true)} className="w-8 h-8 rounded-full border border-[#C2A24D]/50 overflow-hidden"><img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /></button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="p-2 hover:bg-white/10 rounded-full"><UserIcon size={20} /></button>
            )}
          </div>
        </header>

        <main ref={mainRef} className="flex-grow relative bg-[#12110F] overflow-hidden">
          {currentProject ? (
            <CanvasStage 
              project={currentProject} onUpdateStrokes={handleUpdateStrokes} 
              activeBrush={activeBrush} activeColor={activeColor} 
              activeLayerId={activeLayerId} isPaperTextureEnabled={isPaperTextureEnabled} 
              isCalligraphyMode={isCalligraphyMode} activeTool={activeTool} 
              zoom={zoom} pan={pan} setPan={setPan} setZoom={setZoom}
              onUndo={handleUndo} onRedo={handleRedo}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-6">
              <PenTool size={64} className="text-[#C2A24D] opacity-20" />
              <h2 className="text-3xl font-amiri text-[#C2A24D] font-bold">{isRtl ? 'ابدأ رحلتك الإبداعية' : 'Start Your Creative Journey'}</h2>
              <button onClick={() => setIsProjectModalOpen(true)} className="px-10 py-4 bg-[#C2A24D] text-[#1C1B18] rounded-full font-bold shadow-2xl hover:scale-105 transition-all">{isRtl ? 'ابدأ لوحة جديدة' : 'New Canvas'}</button>
            </div>
          )}
        </main>

        <aside className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex flex-col gap-3 p-2 bg-[#1C1B18]/90 backdrop-blur-2xl border border-[#7A5C3E]/30 rounded-2xl z-40 shadow-2xl`}>
          <ToolButton icon={<PenTool size={20} />} active={activeTool === ToolType.PEN} onClick={() => setActiveTool(ToolType.PEN)} tooltip={isRtl ? "فرشاة" : "Brush"} isRtl={isRtl} />
          <ToolButton icon={<Eraser size={20} />} active={activeTool === ToolType.ERASER} onClick={() => setActiveTool(ToolType.ERASER)} tooltip={isRtl ? "ممحاة" : "Eraser"} isRtl={isRtl} />
          <ToolButton icon={<Hand size={20} />} active={activeTool === ToolType.HAND} onClick={() => setActiveTool(ToolType.HAND)} tooltip={isRtl ? "تحريك" : "Hand"} isRtl={isRtl} />
          <div className="h-[1px] bg-[#7A5C3E]/30 mx-2" />
          <ToolButton icon={<ZoomIn size={18} />} onClick={() => setZoom(z => Math.min(z + 0.2, 5))} tooltip={isRtl ? "تكبير" : "Zoom In"} isRtl={isRtl} />
          <ToolButton icon={<ZoomOut size={18} />} onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))} tooltip={isRtl ? "تصغير" : "Zoom Out"} isRtl={isRtl} />
        </aside>
      </div>

      <div className={`relative flex transition-all duration-300 ${isPanelOpen ? 'w-80 md:w-96' : 'w-0'}`}>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`absolute ${isRtl ? '-left-10' : '-right-10'} top-1/2 -translate-y-1/2 bg-[#1C1B18]/90 border border-[#7A5C3E]/30 ${isRtl ? 'border-r-0 rounded-l-xl' : 'border-l-0 rounded-r-xl'} p-2 z-50`}>
          {isPanelOpen ? (isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />) : (isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)}
        </button>
        <div className="w-full h-full overflow-hidden bg-[#1C1B18]">
          <ControlPanel 
            isOpen={isPanelOpen} activeBrush={activeBrush} setActiveBrush={setActiveBrush} 
            activeColor={activeColor} setActiveColor={setActiveColor} layers={currentProject?.layers || []} 
            activeLayerId={activeLayerId} setActiveLayerId={setActiveLayerId} 
            isPaperTextureEnabled={isPaperTextureEnabled} setIsPaperTextureEnabled={setIsPaperTextureEnabled} 
            isCalligraphyMode={isCalligraphyMode} setIsCalligraphyMode={setIsCalligraphyMode} project={currentProject} 
            onAddLayer={handleAddLayer}
            onImportImageLayer={handleImportImageLayer}
            onDeleteLayer={(id) => setProjects(prev => prev.map(p => p.id === currentProjectId ? {...p, layers: p.layers.filter(l => l.id !== id)} : p))} 
            onUpdateLayer={(id, up) => setProjects(prev => prev.map(p => p.id === currentProjectId ? {...p, layers: p.layers.map(l => l.id === id ? {...l, ...up} : l)} : p))} 
            onSaveCustomBrush={(b) => setCustomBrushes(prev => [...prev, {...b, id: `c-${Date.now()}`}])} 
            customBrushes={customBrushes} 
            onShareBrush={() => {}} 
            onDeleteBrush={(id) => setCustomBrushes(prev => prev.filter(b => b.id !== id))} 
            collections={[]} onCreateCollection={()=>{}} 
            onRenameCollection={()=>{}} onAddToCollection={()=>{}} onRemoveFromCollection={()=>{}}
            onDeleteCollection={()=>{}} 
            onUpdateProjectSettings={(up) => setProjects(prev => prev.map(p => p.id === currentProjectId ? {...p, ...up} : p))} 
            onExportPNG={handleExportPNG}
          />
        </div>
      </div>

      <AnimatePresence>
        {isProjectModalOpen && (
          <ProjectModal 
            projects={projects} 
            onClose={() => setIsProjectModalOpen(false)} 
            onCreate={handleCreateProject} 
            onSelect={(p) => { setCurrentProjectId(p.id); setActiveLayerId(p.layers[0]?.id || ''); setIsProjectModalOpen(false); setTimeout(() => fitToView(p), 100); }} 
            onDelete={handleDeleteProject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            onClose={() => setIsAuthModalOpen(false)} 
            onLogin={handleLogin} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isProfileModalOpen && user && (
          <ProfileModal 
            user={user}
            onClose={() => setIsProfileModalOpen(false)}
            onUpdate={(updatedUser) => setUser(updatedUser)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode, active?: boolean, onClick: () => void, tooltip: string, isRtl: boolean }> = ({ icon, active, onClick, tooltip, isRtl }) => (
  <button onClick={onClick} className={`p-4 rounded-xl transition-all relative group ${active ? 'bg-[#C2A24D] text-[#1C1B18]' : 'hover:bg-[#C2A24D]/10 opacity-50 hover:opacity-100'}`}>
    {icon}
    <span className={`absolute ${isRtl ? 'left-full ml-4' : 'right-full mr-4'} px-2 py-1 bg-black text-[#C2A24D] text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg`}>{tooltip}</span>
  </button>
);

export default App;
