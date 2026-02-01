
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Image as ImageIcon, X, Trash2, FileText, Ruler } from 'lucide-react';
import { CANVAS_PRESETS } from '../constants';
import { Project } from '../types';

interface ProjectModalProps {
  onClose: () => void;
  onCreate: (name: string, width: number, height: number) => void;
  projects: Project[];
  onSelect: (p: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ onClose, onCreate, projects, onSelect, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'recent'>(projects.length > 0 ? 'recent' : 'new');
  const [name, setName] = useState('مشروع جديد');
  const [customWidth, setCustomWidth] = useState<number>(2048);
  const [customHeight, setCustomHeight] = useState<number>(2048);

  const handleCreate = () => {
    // Sanitize inputs to ensure they are valid numbers.
    // If the state somehow contains NaN, fall back to a default. Otherwise, use the number.
    const saneWidth = isNaN(customWidth) ? 2048 : customWidth;
    const saneHeight = isNaN(customHeight) ? 2048 : customHeight;

    // Ensure dimensions are at least 1px.
    const w = Math.max(1, Math.floor(saneWidth));
    const h = Math.max(1, Math.floor(saneHeight));
    
    onCreate(name.trim() || 'مشروع بدون اسم', w, h);
  };

  const handleSelectPreset = (w: number, h: number) => {
    setCustomWidth(w);
    setCustomHeight(h);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => projects.length > 0 && onClose()}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl bg-[#1C1B18] border border-[#7A5C3E]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-56 bg-[#242320] border-l border-[#7A5C3E]/30 p-4 space-y-2 flex flex-col">
          <button 
            type="button"
            onClick={() => setActiveTab('new')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'new' ? 'bg-[#C2A24D] text-[#1C1B18]' : 'hover:bg-[#7A5C3E]/20'}`}
          >
            <Plus size={18} />
            <span className="font-bold text-sm">عمل جديد</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'recent' ? 'bg-[#C2A24D] text-[#1C1B18]' : 'hover:bg-[#7A5C3E]/20'}`}
          >
            <FolderOpen size={18} />
            <span className="font-bold text-sm">الأعمال السابقة</span>
          </button>
          
          <div className="mt-auto p-4 opacity-20 text-[10px] text-center border-t border-[#7A5C3E]/20 font-mono">
            MIHBARA ENGINE v2.6
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
          {projects.length > 0 && (
            <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 opacity-40 hover:opacity-100 transition-opacity z-10">
              <X size={24} />
            </button>
          )}

          {activeTab === 'new' ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-amiri text-[#C2A24D] font-bold">إنشاء لوحة عمل</h2>
                <p className="text-xs opacity-50">أدخل الأبعاد المطلوبة بدقة بالبكسل</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-70 flex items-center gap-2">
                    <FileText size={12} /> اسم المشروع
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#242320] border border-[#7A5C3E]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C2A24D] text-[#F3EAD9] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-70">العرض (PX)</label>
                    <input 
                      type="number" 
                      value={customWidth} 
                      onChange={e => setCustomWidth(Number(e.target.value))}
                      className="w-full bg-[#242320] border border-[#7A5C3E]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C2A24D] text-[#F3EAD9]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-70">الارتفاع (PX)</label>
                    <input 
                      type="number" 
                      value={customHeight} 
                      onChange={e => setCustomHeight(Number(e.target.value))}
                      className="w-full bg-[#242320] border border-[#7A5C3E]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C2A24D] text-[#F3EAD9]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#7A5C3E]/10">
                  <label className="text-[10px] font-bold text-[#C2A24D] uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={10} /> قياسات قياسية
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CANVAS_PRESETS.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.width, p.height)}
                        className={`flex items-center justify-between p-3 bg-[#242320] border rounded-xl transition-all text-xs group ${customWidth === p.width && customHeight === p.height ? 'border-[#C2A24D] bg-[#C2A24D]/5' : 'border-[#7A5C3E]/10 hover:border-[#C2A24D]/40'}`}
                      >
                        <span className="group-hover:text-[#C2A24D] font-bold">{p.name}</span>
                        <span className="opacity-30 text-[10px] font-mono">{p.width}x{p.height}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleCreate}
                className="w-full py-4 bg-[#C2A24D] text-[#1C1B18] rounded-xl font-bold shadow-xl shadow-[#C2A24D]/10 hover:bg-[#C2A24D]/90 active:scale-[0.98] transition-all mt-6"
              >
                تأكيد وإنشاء اللوحة
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-amiri text-[#C2A24D] font-bold">الأعمال المحفوظة</h2>
              {projects.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p>لا توجد لوحات محفوظة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {projects.map(p => (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-4 bg-[#242320] border border-[#7A5C3E]/20 rounded-2xl hover:border-[#C2A24D]/50 transition-all group cursor-pointer"
                      onClick={() => { onSelect(p); onClose(); }}
                    >
                      <div className="flex items-center gap-4">
                        <FileText size={22} className="text-[#C2A24D]" />
                        <div>
                          <p className="font-bold text-[#F3EAD9]">{p.name}</p>
                          <p className="text-[10px] opacity-40">{p.width} × {p.height} PX</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if(confirm('حذف العمل؟')) onDelete(p.id); }}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectModal;
