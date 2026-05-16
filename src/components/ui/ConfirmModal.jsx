import React from 'react';
import { AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi", 
  message, 
  confirmText = "Ya, Lanjutkan", 
  cancelText = "Batal",
  type = "warning", // warning, danger, success, info
  loading = false
}) => {
  const icons = {
    warning: <HelpCircle className="w-12 h-12 text-orange-500" />,
    danger: <AlertCircle className="w-12 h-12 text-red-500" />,
    success: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
    info: <Info className="w-12 h-12 text-indigo-500" />,
  };

  const colors = {
    warning: "bg-orange-50",
    danger: "bg-red-50",
    success: "bg-emerald-50",
    info: "bg-indigo-50",
  };

  const buttonVariants = {
    warning: "primary",
    danger: "danger",
    success: "success",
    info: "primary",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center p-4">
        <div className={`p-4 rounded-3xl ${colors[type]} mb-6`}>
          {icons[type]}
        </div>
        <p className="text-slate-600 font-medium leading-relaxed mb-8">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 py-3"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={buttonVariants[type]} 
            onClick={onConfirm} 
            className="flex-1 py-3"
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
