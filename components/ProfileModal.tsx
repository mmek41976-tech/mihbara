
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Settings, Check, Camera, RefreshCw, Upload, Loader2, Languages, Maximize } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [settings, setSettings] = useState(user.settings);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(user.avatar);
  }, [user.avatar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = { 
      ...user, 
      name, 
      settings, 
      avatar 
    };
    onUpdate(updatedUser);
    onClose();
  };

  const randomizeAvatar = () => {
    setIsUploading(true);
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const seed = Math.random().toString(36).substring(7);
        setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
        setIsUploading(false);
      }
    }, 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      setIsUploading(true);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      reader.onloadend = () => {
        setTimeout(() => {
          setAvatar(reader.result as string);
          setIsUploading(false);
          setUploadProgress(0);
        }, 600);
      };
      reader.readAsDataURL(file);
    }
  };

  const isRtl = settings.language === 'ar';

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#1C1B18] border border-[#C2A24D]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-[#7A5C3E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="text-[#C2A24D]" size={20} />
            <h2 className="text-xl font-amiri font-bold text-[#C2A24D]">
              {isRtl ? 'إعدادات الحساب والملف الشخصي' : 'Account & Profile Settings'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-[#C2A24D] bg-[#242320] p-1 shadow-2xl relative overflow-hidden flex items-center justify-center">
                <img src={avatar} alt="Profile" className={`w-full h-full rounded-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`} />
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <span className="text-xs font-bold text-[#C2A24D]">{uploadProgress}%</span>
                  </div>
                )}
                <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}>
                  <Camera size={28} className="text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2.5 bg-[#C2A24D] text-[#1C1B18] rounded-full shadow-lg hover:scale-110 transition-transform border border-[#1C1B18] disabled:opacity-50"><Upload size={16} /></button>
                <button type="button" onClick={randomizeAvatar} disabled={isUploading} className="p-2.5 bg-[#7A5C3E] text-[#F3EAD9] rounded-full shadow-lg hover:scale-110 transition-transform border border-[#1C1B18] disabled:opacity-50"><RefreshCw size={16} className={isUploading ? 'animate-spin' : ''} /></button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-70">{isRtl ? 'اسم المستخدم' : 'Username'}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#242320] border border-[#7A5C3E]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C2A24D] transition-colors" required />
            </div>

            <div className="h-[1px] bg-[#7A5C3E]/20" />

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#C2A24D] uppercase tracking-wider">{isRtl ? 'تفضيلات التطبيق' : 'App Preferences'}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#242320] rounded-xl border border-[#7A5C3E]/10">
                  <div className="flex items-center gap-3">
                    <Languages size={18} className="text-[#C2A24D]" />
                    <div className="space-y-1">
                      <p className="text-sm">{isRtl ? 'لغة الواجهة' : 'Interface Language'}</p>
                    </div>
                  </div>
                  <select 
                    value={settings.language} 
                    onChange={e => setSettings({...settings, language: e.target.value as 'ar' | 'en'})}
                    className="bg-[#1C1B18] border border-[#7A5C3E]/30 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="p-4 bg-[#242320] rounded-xl border border-[#7A5C3E]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Maximize size={18} className="text-[#C2A24D]" />
                      <p className="text-sm">{isRtl ? 'حجم الواجهة' : 'UI Scale'}</p>
                    </div>
                    <span className="text-xs font-mono text-[#C2A24D]">{Math.round(settings.uiScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.75" 
                    max="1.5" 
                    step="0.05" 
                    value={settings.uiScale} 
                    onChange={e => setSettings({...settings, uiScale: parseFloat(e.target.value)})}
                    className="w-full accent-[#C2A24D] h-1" 
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#242320] rounded-xl border border-[#7A5C3E]/10">
                  <p className="text-sm">{isRtl ? 'المزامنة التلقائية' : 'Auto-Sync'}</p>
                  <button type="button" onClick={() => setSettings({...settings, autoSave: !settings.autoSave})} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoSave ? 'bg-[#C2A24D]' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoSave ? (isRtl ? 'right-1' : 'left-1') : (isRtl ? 'right-7' : 'left-7')}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 bg-[#242320] border-t border-[#7A5C3E]/30 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-[#7A5C3E]/30 rounded-xl hover:bg-white/5 transition-colors font-medium">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isUploading} className="flex-[2] py-3 bg-[#C2A24D] text-[#1C1B18] rounded-xl font-bold hover:bg-[#C2A24D]/90 transition-all flex items-center justify-center gap-2">
            <Check size={18} />
            <span>{isRtl ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
