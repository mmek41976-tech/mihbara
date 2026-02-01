
import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, X, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#1C1B18] border border-[#C2A24D]/30 rounded-3xl overflow-hidden shadow-2xl p-8 text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 opacity-40 hover:opacity-100 transition-opacity">
          <X size={20} />
        </button>

        <div className="w-20 h-20 bg-[#C2A24D]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#C2A24D]/20">
          <Sparkles size={40} className="text-[#C2A24D]" />
        </div>

        <h2 className="text-3xl font-amiri text-[#C2A24D] mb-2">مرحباً بك في محبرة</h2>
        <p className="text-[#F3EAD9]/60 text-sm mb-8 leading-relaxed">
          سجل دخولك لمزامنة مشاريعك، فرشاتك المخصصة، وإعداداتك الخاصة عبر جميع أجهزتك.
        </p>

        <button 
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-100 transition-all active:scale-95 mb-4 shadow-lg"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>تسجيل الدخول عبر Google</span>
        </button>

        <p className="text-[10px] opacity-30 mt-4">
          بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بمحبرة.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthModal;
