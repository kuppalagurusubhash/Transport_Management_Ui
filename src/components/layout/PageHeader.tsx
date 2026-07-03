import React from 'react';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-700 bg-ink-950 px-6 py-6 sm:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
          {title}
        </h1>
        {subtitle &&
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        }
      </div>
      {action}
    </header>);

}