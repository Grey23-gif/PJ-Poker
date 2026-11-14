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
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            ref={ref}
            className={`w-full bg-slate-900/90 border ${
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500/20'
            } text-slate-100 placeholder-slate-500 text-sm rounded-[10px] min-h-11 py-2.5 ${
              leftIcon ? 'pl-9' : 'pl-3.5'
            } ${rightIcon ? 'pr-14' : 'pr-3.5'} focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center text-slate-400 [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:flex [&_button]:items-center [&_button]:justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p id={messageId} role="alert" className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p id={messageId} className="mt-1 text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

