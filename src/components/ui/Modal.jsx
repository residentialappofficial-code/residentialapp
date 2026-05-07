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
   <div className="bg-white w-[85%] md:w-[40%] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300 slide-in-from-bottom-8">
    {/* Header */}
    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
     <h3 className="text-lg font-bold text-slate-900">{title}</h3>
     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all">
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Body */}
    <div className="p-6 max-h-[80vh] overflow-y-auto">
     {children}
    </div>

    {/* Footer */}
    {footer && (
     <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
      {footer}
     </div>
    )}
   </div>
  </div>
 );
};
