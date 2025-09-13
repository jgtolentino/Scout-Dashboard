import React from 'react';

interface CardProps {
  accent?: 'primary' | 'success' | 'warning' | 'danger';
  title?: string;
  value?: string | number;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const accentStyles = {
  primary: {
    bar: 'bg-primary',
    title: 'text-primary-800',
    value: 'text-primary-700',
    bg: 'bg-primary-50/30',
    border: 'border-primary-200',
  },
  success: {
    bar: 'bg-success',
    title: 'text-success-800',
    value: 'text-success-700',
    bg: 'bg-success-50/30',
    border: 'border-success-200',
  },
  warning: {
    bar: 'bg-warning',
    title: 'text-warning-800',
    value: 'text-warning-700',
    bg: 'bg-warning-50/30',
    border: 'border-warning-200',
  },
  danger: {
    bar: 'bg-danger',
    title: 'text-danger-800',
    value: 'text-danger-700',
    bg: 'bg-danger-50/30',
    border: 'border-danger-200',
  },
};

export default function Card({
  accent = 'primary',
  title,
  value,
  subtitle,
  children,
  className = '',
  hover = true,
}: CardProps) {
  const styles = accentStyles[accent];
  
  return (
    <div
      className={`
        bg-white 
        rounded-lg 
        border 
        border-gray-200 
        shadow-card 
        overflow-hidden
        flex 
        flex-col
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {/* Accent bar */}
      <div className={`h-1 ${styles.bar}`} />

      {/* Content */}
      <div className="p-6 flex-1">
        {title && (
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${styles.title}`}>
            {title}
          </h3>
        )}
        
        {value && (
          <p className={`text-3xl font-bold ${styles.value}`}>
            {value}
          </p>
        )}
        
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
}