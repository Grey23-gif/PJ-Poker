import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let openModalCount = 0;
let previousBodyOverflow = '';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  showCloseButton?: boolean;
  locale?: 'vi' | 'en';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, description, children, maxWidth = 'lg', showCloseButton = true, locale = 'vi', footer,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    if (openModalCount === 0) previousBodyOverflow = document.body.style.overflow;
    openModalCount++;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.body.style.overflow = previousBodyOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl', full: 'max-w-[95vw] h-[90dvh]' };

  return createPortal(
    <dialog
      ref={dialogRef}
      lang={locale}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : locale === 'en' ? 'Dialog' : 'Hộp thoại'}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-0 w-full max-w-none h-full max-h-none bg-transparent p-3 sm:p-6 text-content open:flex items-center justify-center backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className={`surface-card relative min-w-0 w-full ${widths[maxWidth]} shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden`}>
        {(title || showCloseButton) && (
          <div className="px-[var(--card-padding)] py-[var(--component-gap)] border-b border-surface-border flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 break-words">
              <h2 id={titleId} className="text-base font-semibold">{title}</h2>
              {description && <p id={descriptionId} className="text-sm text-muted mt-1">{description}</p>}
            </div>
            {showCloseButton && <button type="button" onClick={onClose} aria-label={locale === 'en' ? 'Close dialog' : 'Đóng hộp thoại'} title={locale === 'en' ? 'Close (Esc)' : 'Đóng (Esc)'} className="min-w-[var(--control-icon-size)] min-h-[var(--control-icon-size)] -m-2 flex items-center justify-center rounded-lg text-muted hover:text-content hover:bg-surface-hover"><X className="w-5 h-5" aria-hidden="true" /></button>}
          </div>
        )}
        <div className="modal-content p-[var(--card-padding)] overflow-y-auto flex-1 min-h-0 min-w-0">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-surface p-[var(--card-padding)] flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </dialog>, document.body,
  );
};
