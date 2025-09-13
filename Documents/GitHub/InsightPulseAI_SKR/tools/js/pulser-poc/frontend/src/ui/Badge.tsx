import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  danger: 'bg-danger-100 text-danger-800 border-danger-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  rounded = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
    >
      {children}
    </span>
  );
}