import React from 'react';

export interface PanelProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const variantStyles = {
  default: 'bg-white border-gray-200',
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-success-50 border-success-200',
  warning: 'bg-warning-50 border-warning-200',
  danger: 'bg-danger-50 border-danger-200',
};

export default function Panel({
  title,
  description,
  variant = 'default',
  collapsible = false,
  defaultExpanded = true,
  children,
  className = '',
  actions,
}: PanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div
      className={`
        ${variantStyles[variant]}
        border rounded-lg
        ${className}
      `}
    >
      {title && (
        <div className="px-4 py-3 border-b border-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {collapsible && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mr-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {description && (
                  <p className="text-sm text-gray-600 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {actions && <div className="ml-4">{actions}</div>}
          </div>
        </div>
      )}

      {(!collapsible || isExpanded) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}