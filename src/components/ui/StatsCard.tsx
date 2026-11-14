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
  iconBgColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
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
      className={`stats-card p-5 relative transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50' : ''
      }`}
    >
      <div className="flex flex-col-reverse gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <div className="stats-card-value font-semibold text-slate-100 tracking-tight leading-tight">{value}</div>
          {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
        </div>
        {icon && (
          <div aria-hidden="true" className={`p-2.5 rounded-lg w-fit shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center text-xs">
          {change.isPositive ? (
            <span className="flex items-center text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {change.value}
            </span>
          ) : (
            <span className="flex items-center text-rose-400 font-medium">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              {change.value}
            </span>
          )}
          <span className="text-slate-500 ml-2">so với hôm qua</span>
        </div>
      )}
    </Card>
  );
};

