import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
 isOpen, 
 onClose, 
 title, 
 children, 
 footer
}) => {
 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
   <div className="bg-white w-full max-w-[calc(100vw-32px)] md:max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-32px)] animate-in fade-in zoom-in duration-300 slide-in-from-bottom-8">
    {/* Header */}
    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
     <h3 className="text-base font-bold text-slate-900 leading-none">{title}</h3>
     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
      <X className="w-4 h-4" />
     </button>
    </div>

    {/* Body */}
    <div className="p-4 overflow-y-auto flex-1">
     {children}
    </div>

    {/* Footer */}
    {footer && (
     <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
      {footer}
     </div>
    )}
   </div>
  </div>
 );
};
