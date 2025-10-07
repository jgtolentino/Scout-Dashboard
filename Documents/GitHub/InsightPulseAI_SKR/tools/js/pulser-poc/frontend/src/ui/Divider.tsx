import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: 'light' | 'medium' | 'dark';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
};

const colorStyles = {
  light: 'border-gray-200',
  medium: 'border-gray-300',
  dark: 'border-gray-400',
};

const spacingStyles = {
  horizontal: {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
  },
  vertical: {
    sm: 'mx-2',
    md: 'mx-4',
    lg: 'mx-6',
  },
};

export default function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  color = 'light',
  spacing = 'md',
  className = '',
}: DividerProps) {
  const orientationClass = orientation === 'horizontal' 
    ? `border-t w-full ${spacingStyles.horizontal[spacing]}`
    : `border-l h-full ${spacingStyles.vertical[spacing]}`;

  return (
    <div
      className={`
        ${orientationClass}
        ${variantStyles[variant]}
        ${colorStyles[color]}
        ${className}
      `}
    />
  );
}