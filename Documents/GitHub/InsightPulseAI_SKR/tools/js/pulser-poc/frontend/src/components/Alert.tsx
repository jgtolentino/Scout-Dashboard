import React from 'react';

interface AlertProps {
  variant: 'error' | 'warning' | 'success' | 'info';
  children: React.ReactNode;
  onClose?: () => void;
}

const variantStyles = {
  error: {
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    text: 'text-danger-800',
    icon: '✕',
    iconBg: 'bg-danger-100 text-danger-600',
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-800',
    icon: '!',
    iconBg: 'bg-warning-100 text-warning-600',
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    text: 'text-success-800',
    icon: '✓',
    iconBg: 'bg-success-100 text-success-600',
  },
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    text: 'text-primary-800',
    icon: 'i',
    iconBg: 'bg-primary-100 text-primary-600',
  },
};

export default function Alert({ variant, children, onClose }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg p-4 flex items-start gap-3`}>
      <div className={`${styles.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold`}>
        {styles.icon}
      </div>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="Close alert"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}