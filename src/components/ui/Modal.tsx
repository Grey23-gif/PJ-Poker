import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, description, children, maxWidth = 'lg', showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl', full: 'max-w-[95vw] h-[90dvh]' };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Hộp thoại'}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-0 w-full max-w-none h-full max-h-none bg-transparent p-3 sm:p-6 text-slate-100 open:flex items-center justify-center backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className={`surface-card relative w-full ${widths[maxWidth]} shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden`}>
        {(title || showCloseButton) && (
          <div className="px-5 sm:px-6 py-5 border-b border-surface-border flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 id={titleId} className="text-base sm:text-lg font-semibold">{title}</h2>
              {description && <p id={descriptionId} className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
            {showCloseButton && <button type="button" onClick={onClose} aria-label="Đóng hộp thoại" title="Đóng (Esc)" className="min-w-11 min-h-11 -m-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover"><X className="w-5 h-5" aria-hidden="true" /></button>}
          </div>
        )}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </dialog>, document.body,
  );
};
