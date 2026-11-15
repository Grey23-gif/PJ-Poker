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
      <div className="w-full min-w-0">
        {label && (
          <label htmlFor={selectId} className="block text-[length:var(--form-label-size)] font-medium text-secondary mb-[var(--form-label-gap)]">
            {label}
          </label>
        )}
        <select
          id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
          ref={ref}
          className={`w-full min-w-0 max-w-full bg-field border ${
            error ? 'border-rose-500 focus:border-rose-500' : 'border-line-strong/80 focus:border-emerald-500'
          } text-content text-sm leading-5 rounded-[10px] min-h-[var(--input-height)] py-[var(--control-padding-y)] px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 disabled:bg-raised disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p id={messageId} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p id={messageId} className="mt-1 text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

