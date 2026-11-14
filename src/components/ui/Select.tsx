import React, { forwardRef, useId } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const messageId = `${selectId}-message`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
          ref={ref}
          className={`w-full bg-slate-900 border ${
            error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700/80 focus:border-emerald-500'
          } text-slate-100 text-sm rounded-[10px] min-h-11 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 disabled:bg-slate-800 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p id={messageId} role="alert" className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p id={messageId} className="mt-1 text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

