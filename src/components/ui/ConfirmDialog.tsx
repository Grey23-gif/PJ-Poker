import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-10 h-10 text-rose-500" />,
    warning: <AlertCircle className="w-10 h-10 text-amber-500" />,
    info: <Info className="w-10 h-10 text-sky-500" />,
  };

  const buttonVariants: Record<string, 'danger' | 'gold' | 'primary'> = {
    danger: 'danger',
    warning: 'gold',
    info: 'primary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={false}>
      <div className="text-center pt-2 pb-4">
        <div className="flex justify-center mb-3">{icons[variant]}</div>
        <h4 className="text-lg font-semibold text-slate-100">{title}</h4>
        <p className="text-sm text-slate-400 mt-2 px-2">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

