import React from 'react';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end justify-between gap-3.5 sm:gap-4 border-b border-ink-700 bg-ink-950/90 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
    <div className="min-w-0 space-y-1">
      <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-[28px] truncate">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-neutral-400">{subtitle}</p>
      )}
    </div>
    {action && <div className="w-full sm:w-auto">{action}</div>}
  </div>
  );
}