import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}
export function Card({ children, className = '', as = 'div' }: CardProps) {
  const Tag = as;
  return (
    <Tag className={`rounded-lg border border-ink-700 bg-ink-950 ${className}`}>
      {children}
    </Tag>);

}
interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}
export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-[0.12em] text-gold ${className}`}>
      
      {children}
    </span>);

}