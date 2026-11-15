import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div role="group" aria-label="Chọn mục hiển thị" className={`flex max-w-full min-w-0 items-center space-x-1 border-b border-line p-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 min-h-[var(--button-height)] px-3 py-1.5 text-sm leading-5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-raised text-success shadow-sm border border-line-strong/80'
                : 'text-muted hover:text-content hover:bg-raised/40'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                  isActive
                    ? 'bg-emerald-500/20 text-success'
                    : 'bg-raised/60 text-muted'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

