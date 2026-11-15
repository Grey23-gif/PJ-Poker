import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  glow?: 'none' | 'green' | 'gold';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subValue,
  change,
  icon,
  iconBgColor = 'bg-emerald-500/10 text-success border border-emerald-500/20',
  glow = 'none',
  onClick,
}) => {
  return (
    <Card
      glow={glow}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
      className={`stats-card p-4 relative transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium text-muted">{title}</p>
          <div className="stats-card-value font-semibold text-content tracking-tight leading-tight">{value}</div>
          {subValue && <p className="text-xs text-muted">{subValue}</p>}
        </div>
        {icon && (
          <div aria-hidden="true" className={`p-2.5 rounded-lg w-fit shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-3 pt-3 border-t border-line/80 flex items-center text-xs">
          {change.isPositive ? (
            <span className="flex items-center text-success font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {change.value}
            </span>
          ) : (
            <span className="flex items-center text-danger font-medium">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              {change.value}
            </span>
          )}
          <span className="text-muted ml-2">so với hôm qua</span>
        </div>
      )}
    </Card>
  );
};

