import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'green' | 'gold';
  variant?: 'default' | 'table' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  variant = 'default',
  ...props
}) => {
  const glowClasses = {
    none: '',
    green: 'border-t-emerald-500/50',
    gold: 'border-t-amber-400/50',
  };

  const variantClasses = {
    default: 'surface-card min-w-0',
    table: 'surface-card min-w-0 border-emerald-800/50',
    glass: 'surface-card min-w-0',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`ui-card-header border-b border-line/80 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h2 className={`font-semibold text-content text-[length:var(--card-title-size)] leading-snug flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h2>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs sm:text-sm text-muted mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`ui-card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`ui-card-footer border-t border-line/80 bg-field/40 rounded-b-xl flex flex-wrap items-center justify-end gap-3 ${className}`} {...props}>
    {children}
  </div>
);

