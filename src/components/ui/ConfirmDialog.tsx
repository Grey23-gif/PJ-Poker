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
  locale?: 'vi' | 'en';
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
  locale = 'vi',
}) => {
  const icons = {
    danger: <AlertTriangle className="w-10 h-10 text-danger" />,
    warning: <AlertCircle className="w-10 h-10 text-warning" />,
    info: <Info className="w-10 h-10 text-info" />,
  };

  const buttonVariants: Record<string, 'danger' | 'gold' | 'primary'> = {
    danger: 'danger',
    warning: 'gold',
    info: 'primary',
  };

  return (
    <Modal locale={locale} isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={false}>
      <div className="text-center pt-2 pb-4">
        <div className="flex justify-center mb-3">{icons[variant]}</div>
        <h4 className="text-lg font-semibold text-content">{title}</h4>
        <p className="text-sm text-muted mt-2 px-2">{message}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
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

