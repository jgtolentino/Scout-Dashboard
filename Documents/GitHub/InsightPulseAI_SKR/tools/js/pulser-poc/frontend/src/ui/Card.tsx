import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

const accentColors = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  none: '',
};

const paddingSizes = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowSizes = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export default function Card({
  title,
  subtitle,
  accent = 'primary',
  padding = 'md',
  shadow = 'md',
  hover = false,
  children,
  className = '',
  headerActions,
  footer,
}: CardProps) {
  return (
    <div
      className={`
        bg-white
        border border-border
        rounded-lg
        overflow-hidden
        ${shadowSizes[shadow]}
        ${hover ? 'hover:shadow-cardHover transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {/* Accent Bar */}
      {accent !== 'none' && <div className={`h-1 ${accentColors[accent]}`} />}
      
      {/* Header */}
      {(title || headerActions) && (
        <div className={`flex justify-between items-start ${paddingSizes[padding]} ${children ? 'pb-0' : ''}`}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="ml-4">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      {children && (
        <div className={paddingSizes[padding]}>
          {children}
        </div>
      )}
      
      {/* Footer */}
      {footer && (
        <div className={`border-t border-gray-200 bg-gray-50 ${paddingSizes[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
}