import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'outline' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[10px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-poker-green hover:bg-poker-green-light text-[#06291e] border border-transparent',
    emerald: 'bg-poker-green hover:bg-poker-green-light text-[#06291e] border border-transparent',
    gold: 'bg-[#d8b56c]/10 hover:bg-[#d8b56c]/20 text-gold border border-[#d8b56c]/40',
    secondary: 'bg-raised hover:bg-raised text-content border border-line-strong focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/40 focus:ring-rose-500 border border-rose-500/30',
    outline: 'border border-line-strong hover:border-line-strong text-secondary hover:text-content hover:bg-raised/60 focus:ring-slate-500',
    ghost: 'text-muted hover:text-content hover:bg-raised/50 focus:ring-slate-600',
  };

  const sizes = {
    sm: 'min-h-[var(--button-sm-height)] text-xs leading-5 px-3 py-1.5 gap-1.5',
    md: 'min-h-[var(--button-height)] text-sm leading-5 px-3.5 py-2 gap-2',
    lg: 'min-h-[var(--button-lg-height)] text-sm leading-5 px-4 py-2.5 gap-2',
    icon: 'min-h-[var(--control-icon-size)] min-w-[var(--control-icon-size)] p-2',
  };

  return (
    <button
      aria-busy={isLoading || undefined}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

