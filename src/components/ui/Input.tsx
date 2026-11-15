import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full min-w-0">
        {label && (
          <label htmlFor={inputId} className="block text-[length:var(--form-label-size)] font-medium text-secondary mb-[var(--form-label-gap)]">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            ref={ref}
            className={`w-full min-w-0 max-w-full bg-field border ${
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-line-strong/80 focus:border-emerald-500 focus:ring-emerald-500/20'
            } text-content placeholder-muted text-sm leading-5 rounded-[10px] min-h-[var(--input-height)] py-[var(--control-padding-y)] ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-12' : 'pr-3'} focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-raised/50 disabled:text-muted disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center text-muted [&_button]:min-h-[var(--control-icon-size)] [&_button]:min-w-[var(--control-icon-size)] [&_button]:flex [&_button]:items-center [&_button]:justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p id={messageId} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p id={messageId} className="mt-1 text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

