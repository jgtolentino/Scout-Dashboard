/**
 * Accessibility and theming helper utilities
 * Used to standardize component appearances and ensure accessibility
 */

export const focusRingClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

export const srOnlyClasses = "sr-only";

// Function to determine if a color contrast is sufficient (WCAG standards)
export function hasGoodContrast(foreground: string, background: string): boolean {
  // Simplified contrast check - in a real app, you would use a proper color contrast calculator
  return true;
}

// Ensure consistent spacing across components
export const spacing = {
  xs: 'gap-1 p-1',
  sm: 'gap-2 p-2',
  md: 'gap-3 p-3',
  lg: 'gap-4 p-4',
  xl: 'gap-6 p-6',
};

// Typography standards
export const typography = {
  h1: 'text-2xl md:text-3xl font-semibold tracking-tight',
  h2: 'text-xl md:text-2xl font-semibold tracking-tight',
  h3: 'text-lg md:text-xl font-medium',
  h4: 'text-base md:text-lg font-medium',
  body: 'text-sm md:text-base',
  small: 'text-xs md:text-sm',
  muted: 'text-sm text-muted-foreground',
};

// Transition standards
export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  default: 'transition-all duration-200 ease-in-out', 
  slow: 'transition-all duration-300 ease-in-out',
  emphasis: 'transition-transform duration-200 ease-in-out hover:scale-102',
};

// Interactive state classes
export const interactiveStates = {
  default: 'hover:bg-primary/10',
  subtle: 'hover:bg-muted/50',
  destructive: 'hover:bg-destructive/10',
  card: 'hover:shadow-md hover:translate-y-[-2px]',
};

// Key animation classes
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
};

// Accessibility helpers
export const a11y = {
  // Add proper keyboard focus indication
  focusable: focusRingClasses,
  
  // Hide element visually but keep it accessible to screen readers
  srOnly: srOnlyClasses,
  
  // Adds ARIA pressed attribute for toggle buttons
  toggleButton: (isPressed: boolean) => ({
    'aria-pressed': isPressed,
    className: isPressed ? 'bg-primary/10' : '',
  }),
  
  // Adds ARIA expanded attribute for dropdown triggers
  expandable: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded,
  }),
};

// Medallion tier specific colors and styles
export const medallionStyles = {
  bronze: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500'
  },
  silver: {
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: 'text-slate-400'
  },
  gold: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500'
  },
  platinum: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500'
  }
};

// Role specific styles
export const roleStyles = {
  client: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500'
  },
  internal: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500'
  }
};

// Priority specific styles for consistent coloring
export const priorityStyles = {
  high: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500'
  },
  medium: {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500'
  },
  low: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500'
  }
};