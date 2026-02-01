
import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Layers, 
  Settings, 
  PenTool, 
  Eraser, 
  Copy, 
  Share2, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  Download,
  Save,
  Image as ImageIcon,
  Library,
  ChevronRight,
  Edit2,
  CheckCircle2,
  FileText,
  X,
  Upload,
  Zap,
  Pipette,
  FileDown,
  FileUp,
  SlidersHorizontal,
  Blend,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brush, BrushType, Layer, Project, BrushSettings, Stroke, Point, BrushCollection } from '../types';
import { COLORS, DEFAULT_BRUSHES, LIBRARY_BRUSHES, TEXTURES, BLEND_MODES } from '../constants';
import { drawStroke } from '../utils/drawingUtils';
import { exportBrushToFile } from '../utils/brushUtils';
import { jsPDF } from 'jspdf';

interface ControlPanelProps {
  isOpen: boolean;
  activeBrush: Brush;
  setActiveBrush: (b: Brush) => void;
  activeColor: string;
  setActiveColor: (c: string) => void;
  layers: Layer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  isPaperTextureEnabled: boolean;
  setIsPaperTextureEnabled: (v: boolean) => void;
  isCalligraphyMode: boolean;
  setIsCalligraphyMode: (v: boolean) => void;
  project: Project | null;
  onAddLayer: () => void;
  onImportImageLayer: (file: File) => void;
  onDeleteLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onSaveCustomBrush: (brush: Brush) => void;
  customBrushes: Brush[];
  onShareBrush: (brush: Brush) => void;
  onDeleteBrush: (brushId: string) => void;
  collections: BrushCollection[];
  onCreateCollection: () => void;
  onRenameCollection: (id: string) => void;
  onAddToCollection: (colId: string, brushId: string) => void;
  onRemoveFromCollection: (colId: string, brushId: string) => void;
  onDeleteCollection: (colId: string) => void;
  onUpdateProjectSettings: (updates: Partial<Project>) => void;
  onImportBrush?: (brush: Brush) => void;
  onExportPNG: () => void;
}

const BrushIconPreview: React.FC<{ brush: Brush; color: string; size?: number }> = ({ brush, color, size = 32 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const points: Point[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw a small stylized stroke
    const ptsCount = 10;
    for (let i = 0; i <= ptsCount; i++) {
      const t = i / ptsCount;
      points.push({ 
        x: centerX - 10 + t * 20, 
        y: centerY + Math.sin(t * Math.PI) * 5, 
        pressure: 0.3 + Math.sin(t * Math.PI) * 0.7, 
        timestamp: Date.now() 
      });
    }

    const previewStroke: Stroke = {
      id: 'icon-preview',
      brushId: brush.id,
      brushSettings: { ...brush.settings, size: brush.settings.size * (size / 100) },
      color: color,
      points,
      layerId: 'preview'
    };
    drawStroke(ctx, previewStroke);
  }, [brush.settings, color, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-md border border-[#7A5C3E]/20 bg-[#1C1B18]/50" />;
};

const BrushPreview: React.FC<{ brush: Brush; color: string }> = ({ brush, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const points: Point[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const steps = 40;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = centerX - 40 + t * 80;
      const y = centerY + Math.sin(t * Math.PI * 1.5) * 15;
      const pressure = 0.2 + Math.sin(t * Math.PI) * 0.8;
      points.push({ x, y, pressure, timestamp: Date.now() });
    }

    const previewStroke: Stroke = {
      id: 'preview',
      brushId: brush.id,
      brushSettings: brush.settings,
      color: color,
      points,
      layerId: 'preview'
    };
    drawStroke(ctx, previewStroke);
  }, [brush.settings.size, brush.settings.angle, brush.settings.roundness, brush.settings.stabilization, brush.settings.textureUrl, brush.id, color]);

  return (
    <div className="w-full h-24 bg-[#1C1B18] rounded-xl border border-[#7A5C3E]/20 overflow-hidden flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-opacity-10">
      <canvas ref={canvasRef} width={160} height={80} className="w-full h-full object-contain" />
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isOpen, 
  activeBrush, 
  setActiveBrush,
  activeColor,
  setActiveColor,
  layers,
  activeLayerId,
  setActiveLayerId,
  isPaperTextureEnabled,
  setIsPaperTextureEnabled,
  isCalligraphyMode,
  setIsCalligraphyMode,
  project,
  onAddLayer,
  onImportImageLayer,
  onDeleteLayer,
  onUpdateLayer,
  onSaveCustomBrush,
  customBrushes,
  onShareBrush,
  onDeleteBrush,
  collections,
  onCreateCollection,
  onRenameCollection,
  onAddToCollection,
  onRemoveFromCollection,
  onDeleteCollection,
  onUpdateProjectSettings,
  onImportBrush,
  onExportPNG
}) => {
  const [activeTab, setActiveTab] = useState<'brushes' | 'layers' | 'settings'>('brushes');
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const brushImportInputRef = useRef<HTMLInputElement>(null);
  const imageImportInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateActiveBrushSettings = (updates: Partial<BrushSettings>) => {
    const updatedSettings = { ...activeBrush.settings, ...updates };
    if (updates.size !== undefined) {
      const ratio = updates.size / (activeBrush.settings.size || 1);
      updatedSettings.minSize = activeBrush.settings.minSize * ratio;
      updatedSettings.maxSize = activeBrush.settings.maxSize * ratio;
    }
    setActiveBrush({ ...activeBrush, settings: updatedSettings });
  };
  
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportImageLayer(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleImportBrush = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBrush) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const brush = JSON.parse(event.target?.result as string) as Brush;
          if (brush.settings && brush.name) {
            onImportBrush({ ...brush, id: `imported-${Date.now()}` });
          } else {
            alert('تنسيق ملف الفرشاة غير صالح');
          }
        } catch (e) {
          alert('فشل قراءة ملف الفرشاة');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportPDF = () => {
    const tempCanvas = document.createElement('canvas');
    if (!project) return;
    tempCanvas.width = project.width;
    tempCanvas.height = project.height;
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) return;
    tctx.fillStyle = project.backgroundColor || '#ffffff';
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(c => {
      if (c.width === project.width && c.height === project.height) {
        tctx.save();
        tctx.drawImage(c, 0, 0);
        tctx.restore();
      }
    });
    try {
      const imgData = tempCanvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: project.width > project.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [project.width, project.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, project.width, project.height);
      pdf.save(`${project.name || 'mihbara'}.pdf`);
    } catch (e) {
      alert('فشل تصدير ملف PDF');
    }
  };

  return (
    <div className={`h-full w-full bg-[#1C1B18] border-r border-[#7A5C3E]/30 flex flex-col overflow-hidden ${!isOpen ? 'hidden' : ''}`}>
      <div className="flex border-b border-[#7A5C3E]/30">
        <TabButton active={activeTab === 'brushes'} onClick={() => setActiveTab('brushes')} icon={<PenTool size={18} />} label="الفُرش" />
        <TabButton active={activeTab === 'layers'} onClick={() => setActiveTab('layers')} icon={<Layers size={18} />} label="الطبقات" />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="الإعدادات" />
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
        {activeTab === 'brushes' && (
          <>
            <div className="bg-[#242320] p-4 rounded-xl border border-[#C2A24D]/20 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#C2A24D]">{activeBrush.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => onShareBrush(activeBrush)} className="p-1.5 bg-[#7A5C3E]/20 text-[#C2A24D] rounded hover:bg-[#7A5C3E]/40 transition-colors flex items-center gap-1 text-[10px] font-bold"><Share2 size={14} /><span>رابط</span></button>
                  <button onClick={() => onSaveCustomBrush(activeBrush)} className="p-1.5 bg-[#C2A24D] text-[#1C1B18] rounded hover:bg-[#C2A24D]/90 transition-colors flex items-center gap-1 text-[10px] font-bold"><Save size={14} /><span>حفظ</span></button>
                </div>
              </div>
              <BrushPreview brush={activeBrush} color={activeColor} />
              <div className="space-y-4 pt-2">
                <SliderSetting label="الحجم" value={activeBrush.settings.size} min={1} max={200} onChange={v => handleUpdateActiveBrushSettings({ size: v })} />
                <SliderSetting label="الزاوية" value={activeBrush.settings.angle} min={0} max={180} onChange={v => handleUpdateActiveBrushSettings({ angle: v })} />
                <SliderSetting label="الاستدارة" value={activeBrush.settings.roundness} min={1} max={100} onChange={v => handleUpdateActiveBrushSettings({ roundness: v })} />
                <SliderSetting label="التنعيم" value={activeBrush.settings.stabilization} min={0} max={1} step={0.01} onChange={v => handleUpdateActiveBrushSettings({ stabilization: v })} />
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">النسيج (Textures)</p>
                  <div className="grid grid-cols-5 gap-1">
                    {TEXTURES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => handleUpdateActiveBrushSettings({ textureUrl: t.url })}
                        className={`aspect-square rounded border transition-all overflow-hidden relative ${activeBrush.settings.textureUrl === t.url ? 'border-[#C2A24D] ring-2 ring-[#C2A24D]/30' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                        title={t.name}
                      >
                        {t.url ? (
                          <div className="w-full h-full bg-cover bg-center invert grayscale brightness-50" style={{ backgroundImage: `url(${t.url})` }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px]">X</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-[#7A5C3E] uppercase tracking-widest">فُرشي الخاصة</h4>
                <div className="flex items-center gap-2">
                  <input type="file" ref={brushImportInputRef} onChange={handleImportBrush} className="hidden" accept=".brush,.json" />
                  <button onClick={() => brushImportInputRef.current?.click()} className="p-1 hover:bg-[#C2A24D]/20 rounded text-[#C2A24D] transition-all flex items-center gap-1 text-[10px]"><FileUp size={14} /><span>استيراد</span></button>
                  <button onClick={() => onSaveCustomBrush(activeBrush)} className="p-1 hover:bg-[#C2A24D]/20 rounded text-[#C2A24D] transition-all flex items-center gap-1 text-[10px]"><Plus size={12} /><span>إنشاء</span></button>
                </div>
              </div>
              {customBrushes.length > 0 ? (
                <div className="space-y-1">
                  {customBrushes.map(b => (
                    <div key={b.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${activeBrush.id === b.id ? 'bg-[#C2A24D] text-[#1C1B18]' : 'hover:bg-[#7A5C3E]/10'}`} onClick={() => setActiveBrush(b)}>
                      <BrushIconPreview brush={b} color={activeBrush.id === b.id ? '#1C1B18' : activeColor} size={24} />
                      <span className="text-xs truncate flex-grow">{b.name}</span>
                      <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onShareBrush(b); }} className="p-1 hover:bg-black/10 rounded" title="مشاركة رابط الفرشاة"><Share2 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); exportBrushToFile(b); }} className="p-1 hover:bg-black/10 rounded" title="تصدير الفرشاة"><FileDown size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteBrush(b.id); }} className="p-1 hover:bg-red-500/20 text-red-500 rounded" title="حذف الفرشاة"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] opacity-30 text-center py-2">لا توجد فرش مخصصة بعد</p>
              )}
            </div>
            
            <BrushSection title="رسم واسكتش" brushes={DEFAULT_BRUSHES.filter(b => b.category === 'sketch')} activeId={activeBrush.id} activeColor={activeColor} onSelect={setActiveBrush} />
            <BrushSection title="الخط العربي" brushes={DEFAULT_BRUSHES.filter(b => b.category === 'calligraphy')} activeId={activeBrush.id} activeColor={activeColor} onSelect={setActiveBrush} />
            <BrushSection title="مكتبة المحبرة" brushes={LIBRARY_BRUSHES} activeId={activeBrush.id} activeColor={activeColor} onSelect={setActiveBrush} />
          </>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onAddLayer} className="w-full py-2 bg-[#C2A24D] text-[#1C1B18] rounded-lg flex items-center justify-center gap-2 hover:bg-[#C2A24D]/90 transition-all font-bold shadow-lg"><Plus size={16} /><span>طبقة رسم</span></button>
              <input type="file" ref={imageImportInputRef} onChange={handleImageImport} accept="image/png, image/jpeg, image/webp" className="hidden" />
              <button onClick={() => imageImportInputRef.current?.click()} className="w-full py-2 bg-[#242320] border border-[#7A5C3E]/30 text-[#F3EAD9] rounded-lg flex items-center justify-center gap-2 hover:border-[#C2A24D] transition-all font-bold"><ImageIcon size={16} /><span>استيراد صورة</span></button>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-[#7A5C3E] uppercase tracking-widest mb-1">الطبقات</h4>
              {layers.map(layer => (
                <div 
                  key={layer.id} 
                  className={`p-3 rounded-xl border flex flex-col gap-3 transition-all cursor-pointer shadow-sm ${activeLayerId === layer.id ? 'bg-[#C2A24D]/5 border-[#C2A24D]/50' : 'bg-[#242320] border-[#7A5C3E]/10 hover:border-[#7A5C3E]/30'}`} 
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow overflow-hidden">
                      <div className="w-10 h-10 rounded-md bg-[#12110F] border border-[#7A5C3E]/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {layer.type === 'image' && layer.imageUrl ? (
                            <img src={layer.imageUrl} alt={layer.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layers size={20} className="opacity-30" />
                          )}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <span className={`text-sm font-bold truncate block ${activeLayerId === layer.id ? 'text-[#C2A24D]' : 'text-[#F3EAD9]'}`}>{layer.name}</span>
                        <span className="text-xs text-white/30">{layer.type === 'image' ? 'طبقة صورة' : 'طبقة رسم'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { isVisible: !layer.isVisible }); }} 
                        className={`p-1.5 transition-all ${layer.isVisible ? 'text-[#C2A24D] opacity-100' : 'text-gray-500 opacity-40'}`}
                      >
                        {layer.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }} 
                        className="opacity-20 hover:opacity-100 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {activeLayerId === layer.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-4 pt-2 border-t border-[#7A5C3E]/10 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-60 text-[#C2A24D]">
                          <div className="flex items-center gap-1"><SlidersHorizontal size={10} /> <span>الشفافية</span></div>
                          <span>{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          value={layer.opacity} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                          className="w-full accent-[#C2A24D] h-1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-60 text-[#C2A24D]">
                          <Blend size={10} /> <span>نمط الدمج</span>
                        </div>
                        <select 
                          value={layer.blendMode}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateLayer(layer.id, { blendMode: e.target.value })}
                          className="w-full bg-[#1C1B18] border border-[#7A5C3E]/30 rounded-lg px-2 py-1.5 text-xs text-[#F3EAD9] focus:outline-none focus:border-[#C2A24D] appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23C2A24D\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 8px center' }}
                        >
                          {BLEND_MODES.map(mode => (
                            <option key={mode.id} value={mode.id}>{mode.name}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold opacity-60">مظهر العمل</h3>
              <ToggleSetting label="تفعيل نسيج الورق" checked={isPaperTextureEnabled} onChange={setIsPaperTextureEnabled} />
              <ToggleSetting label="وضع الخط العربي" checked={isCalligraphyMode} onChange={setIsCalligraphyMode} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onExportPNG} className="flex items-center justify-center gap-2 p-3 bg-[#242320] rounded-xl hover:bg-[#C2A24D]/10 transition-colors border border-[#7A5C3E]/30 text-xs font-bold">
                <Camera size={18} /><span>تصدير PNG</span>
              </button>
              <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 p-3 bg-[#242320] rounded-xl hover:bg-[#C2A24D]/10 transition-colors border border-[#7A5C3E]/30 text-xs font-bold">
                <FileText size={18} /><span>تصدير PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#242320] border-t border-[#7A5C3E]/30 space-y-4">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border-2 border-[#C2A24D] shadow-inner relative overflow-hidden group cursor-pointer" style={{ backgroundColor: activeColor }} onClick={() => colorPickerRef.current?.click()}>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity"><Pipette size={18} className="text-white" /></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#C2A24D] font-bold uppercase tracking-widest">اللون النشط</span>
                <span className="text-xs font-mono opacity-60 uppercase">{activeColor}</span>
              </div>
           </div>
           <button onClick={() => colorPickerRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-[#C2A24D]/10 text-[#C2A24D] border border-[#C2A24D]/30 rounded-lg text-[10px] font-bold"><Sparkles size={14} /><span>عجلة الألوان</span></button>
           <input type="color" ref={colorPickerRef} value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="sr-only" />
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${active ? 'border-[#C2A24D] text-[#1C1B18] bg-[#C2A24D]/5' : 'border-transparent opacity-40 hover:opacity-100'}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const SliderSetting: React.FC<{ label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs opacity-60"><span>{label}</span><span>{step < 1 ? value.toFixed(2) : Math.round(value)}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-[#C2A24D] h-1" />
  </div>
);

const ToggleSetting: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between bg-[#242320] p-3 rounded-xl">
    <span className="text-sm">{label}</span>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-[#C2A24D]" />
  </div>
);

const BrushSection: React.FC<{ title: string, brushes: Brush[], activeId: string, activeColor: string, onSelect: (b: Brush) => void }> = ({ title, brushes, activeId, activeColor, onSelect }) => (
  <div className="space-y-2">
    <h4 className="text-[11px] font-bold text-[#7A5C3E] uppercase tracking-widest">{title}</h4>
    <div className="space-y-1">
      {brushes.map(b => (
        <div key={b.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group/brush ${activeId === b.id ? 'bg-[#C2A24D] text-[#1C1B18]' : 'hover:bg-[#7A5C3E]/10'}`} onClick={() => onSelect(b)}>
          <BrushIconPreview brush={b} color={activeId === b.id ? '#1C1B18' : activeColor} size={24} />
          <span className="text-xs truncate flex-grow">{b.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ControlPanel;