/**
 * Power BI Theme Configuration
 * 
 * This file defines visual styling that matches Microsoft Power BI's aesthetic
 * while incorporating TBWA's brand colors.
 */

export const powerBITheme = {
  colors: {
    // Primary palette (TBWA branded)
    primary: '#FFCF00', // TBWA Yellow
    primaryLight: 'rgba(255, 207, 0, 0.2)',
    primaryDark: '#E6BB00',
    
    // Neutrals (Power BI style)
    background: '#F9F9F9',
    cardBackground: '#FFFFFF',
    border: '#E5E7EB',
    text: '#252423',
    textSecondary: '#605E5C',
    textTertiary: '#8A8886',
    
    // Chart colors (Power BI defaults adapted to TBWA)
    chart: [
      '#FFCF00', // TBWA Yellow
      '#4285F4', // Blue
      '#34A853', // Green
      '#EA4335', // Red
      '#FBBC05', // Amber
      '#8289A9', // Slate
      '#5F6B7A', // Navy
      '#DD712E', // Orange
      '#8A5EAB', // Purple
      '#2D908C', // Teal
    ],
    
    // Status colors (for KPIs)
    success: '#107C10',
    warning: '#FFCF00',
    error: '#E81123',
    info: '#0078D4',
  },
  
  // Visual effects and styling
  effects: {
    dropShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    cardShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    focusShadow: '0 0 0 2px rgba(255, 207, 0, 0.4)',
    hoverEffect: 'rgba(0, 0, 0, 0.03)',
  },
  
  // Typography
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSizes: {
      xs: '0.875rem', // 14px
      sm: '0.9375rem', // 15px 
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      xxl: '1.5rem',   // 24px
    },
    fontWeights: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.5,
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    xxl: '2rem',     // 32px
  },
  
  // Component-specific styling
  components: {
    // Card styling
    card: {
      borderRadius: '4px',
      padding: '16px',
      headerPadding: '16px 16px 8px 16px',
      bodyPadding: '8px 16px 16px 16px',
      titleFontSize: '15px',
      subtitleFontSize: '14px',
    },
    
    // Filter/slicer styling
    slicer: {
      height: '32px',
      fontSize: '14px',
      fontWeight: 400,
      borderRadius: '2px',
      paddingX: '12px',
    },
    
    // Button styling
    button: {
      height: '32px',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '2px',
      primaryColor: '#FFCF00',
      primaryTextColor: '#000000',
      secondaryColor: '#FFFFFF',
      secondaryTextColor: '#252423',
      secondaryBorderColor: '#E5E7EB',
    },
    
    // Chart styling
    chart: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '12px',
      textColor: '#252423',
      gridColor: '#F0F0F0',
      axisColor: '#E0E0E0',
      borderRadius: '2px',
    },
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
};

export default powerBITheme;