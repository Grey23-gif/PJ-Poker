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
    gold: 'bg-[#d8b56c]/10 hover:bg-[#d8b56c]/20 text-[#e6c785] border border-[#d8b56c]/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/40 focus:ring-rose-500 border border-rose-500/30',
    outline: 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white hover:bg-slate-800/60 focus:ring-slate-500',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 focus:ring-slate-600',
  };

  const sizes = {
    sm: 'min-h-11 text-xs px-3 py-2 gap-1.5',
    md: 'min-h-11 text-sm px-4 py-2.5 gap-2',
    lg: 'min-h-12 text-base px-5 py-3 gap-2.5',
    icon: 'min-h-11 min-w-11 p-2.5',
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

