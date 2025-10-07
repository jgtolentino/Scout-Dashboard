import React from 'react';

interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

const levelStyles = {
  1: 'text-4xl font-bold',
  2: 'text-3xl font-bold',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-semibold',
  5: 'text-lg font-medium',
  6: 'text-base font-medium',
};

const colorStyles = {
  primary: 'text-gray-900',
  secondary: 'text-gray-700',
  muted: 'text-gray-500',
};

export default function Title({
  level = 3,
  children,
  className = '',
  color = 'primary',
}: TitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={`${levelStyles[level]} ${colorStyles[color]} ${className}`}>
      {children}
    </Tag>
  );
}