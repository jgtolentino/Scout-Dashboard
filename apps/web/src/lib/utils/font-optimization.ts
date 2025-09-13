/**
 * Font Optimization Utilities
 * - Font loading strategies
 * - Performance optimization
 * - Preloading critical fonts
 * - Font display optimization
 */

export interface FontConfig {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  subsets: string[];
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
}

/**
 * System font stack for optimal performance
 */
export const SYSTEM_FONTS = {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ].join(', '),
  
  serif: [
    'ui-serif',
    'Georgia',
    'Cambria',
    '"Times New Roman"',
    'Times',
    'serif',
  ].join(', '),
  
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Menlo',
    'Consolas',
    '"Liberation Mono"',
    'monospace',
  ].join(', '),
};

/**
 * Font configurations for the application
 */
export const FONT_CONFIGS: Record<string, FontConfig> = {
  inter: {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    subsets: ['latin', 'latin-ext'],
    display: 'swap',
    preload: true,
  },
  
  robotoMono: {
    family: 'Roboto Mono',
    weights: [400, 500, 700],
    styles: ['normal'],
    subsets: ['latin'],
    display: 'swap',
    preload: false,
  },
  
  playfairDisplay: {
    family: 'Playfair Display',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
    preload: false,
  },
};

/**
 * Generate preload links for critical fonts
 */
export function generateFontPreloadLinks(fontConfigs: FontConfig[] = []): string {
  const criticalFonts = fontConfigs.filter(config => config.preload);
  
  return criticalFonts
    .map(config => {
      return config.weights
        .map(weight => {
          return config.styles
            .map(style => {
              const href = generateGoogleFontUrl({
                ...config,
                weights: [weight],
                styles: [style],
              });
              
              return `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`;
            })
            .join('\n');
        })
        .join('\n');
    })
    .join('\n');
}

/**
 * Generate Google Fonts URL with optimization parameters
 */
export function generateGoogleFontUrl(config: FontConfig): string {
  const baseUrl = 'https://fonts.googleapis.com/css2';
  const params = new URLSearchParams();
  
  // Family with weights and styles
  const weights = config.weights.join(',');
  const styles = config.styles.includes('italic') ? 'ital,wght' : 'wght';
  
  let familyParam = `${config.family}:${styles}@`;
  
  if (config.styles.includes('italic')) {
    const combinations: string[] = [];
    config.weights.forEach(weight => {
      combinations.push(`0,${weight}`); // normal
      combinations.push(`1,${weight}`); // italic
    });
    familyParam += combinations.join(';');
  } else {
    familyParam += weights;
  }
  
  params.append('family', familyParam);
  params.append('display', config.display);
  
  // Subsets
  if (config.subsets.length > 0) {
    params.append('subset', config.subsets.join(','));
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Font loading performance monitoring
 */
export class FontPerformanceMonitor {
  private loadTimes: Map<string, number> = new Map();
  private observer?: PerformanceObserver;
  
  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
    }
  }
  
  private initializeObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.startsWith('font-')) {
            this.recordFontLoad(entry.name, entry.duration);
          }
        }
      });
      
      this.observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Failed to initialize font performance observer:', error);
    }
  }
  
  private recordFontLoad(fontName: string, duration: number): void {
    this.loadTimes.set(fontName, duration);
    
    // Log slow font loads
    if (duration > 1000) {
      console.warn(`Slow font load detected: ${fontName} took ${duration}ms`);
    }
  }
  
  public measureFontLoad(fontFamily: string, callback: () => void): void {
    if (typeof window === 'undefined') {
      callback();
      return;
    }
    
    const measureName = `font-${fontFamily}`;
    const startMark = `${measureName}-start`;
    const endMark = `${measureName}-end`;
    
    performance.mark(startMark);
    
    callback();
    
    // Use document.fonts API if available
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      });
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      }, 100);
    }
  }
  
  public getFontLoadTimes(): Map<string, number> {
    return new Map(this.loadTimes);
  }
  
  public getAverageFontLoadTime(): number {
    const times = Array.from(this.loadTimes.values());
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  public dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Font loading strategy implementation
 */
export class FontLoadingStrategy {
  private monitor: FontPerformanceMonitor;
  
  constructor() {
    this.monitor = new FontPerformanceMonitor();
  }
  
  /**
   * Load fonts with progressive enhancement
   */
  public async loadFontsProgressively(configs: FontConfig[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Load critical fonts first
    const criticalFonts = configs.filter(config => config.preload);
    const nonCriticalFonts = configs.filter(config => !config.preload);
    
    // Load critical fonts immediately
    await Promise.all(
      criticalFonts.map(config => this.loadFont(config))
    );
    
    // Load non-critical fonts after page load
    if (document.readyState === 'complete') {
      this.loadNonCriticalFonts(nonCriticalFonts);
    } else {
      window.addEventListener('load', () => {
        this.loadNonCriticalFonts(nonCriticalFonts);
      });
    }
  }
  
  private async loadFont(config: FontConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.monitor.measureFontLoad(config.family, () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = generateGoogleFontUrl(config);
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load font: ${config.family}`));
        
        document.head.appendChild(link);
      });
    });
  }
  
  private loadNonCriticalFonts(configs: FontConfig[]): void {
    // Use requestIdleCallback for better performance
    const loadFonts = () => {
      configs.forEach(config => {
        this.loadFont(config).catch(error => {
          console.warn('Failed to load non-critical font:', error);
        });
      });
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadFonts);
    } else {
      setTimeout(loadFonts, 0);
    }
  }
  
  /**
   * Check if a font is loaded
   */
  public isFontLoaded(fontFamily: string, weight = 400, style = 'normal'): boolean {
    if (typeof window === 'undefined' || !('fonts' in document)) {
      return false;
    }
    
    return document.fonts.check(`${weight} ${style} 16px "${fontFamily}"`);
  }
  
  /**
   * Wait for font to load
   */
  public async waitForFont(
    fontFamily: string, 
    weight = 400, 
    style = 'normal', 
    timeout = 3000
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('fonts' in document)) {
      return false;
    }
    
    const fontSpec = `${weight} ${style} 16px "${fontFamily}"`;
    
    try {
      await Promise.race([
        document.fonts.load(fontSpec),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Font load timeout')), timeout)
        ),
      ]);
      
      return document.fonts.check(fontSpec);
    } catch (error) {
      console.warn(`Font load timeout or error for ${fontFamily}:`, error);
      return false;
    }
  }
  
  public dispose(): void {
    this.monitor.dispose();
  }
}

/**
 * Font fallback utilities
 */
export function generateFontFallback(
  primaryFont: string, 
  fallbackType: 'sans' | 'serif' | 'mono' = 'sans'
): string {
  return `"${primaryFont}", ${SYSTEM_FONTS[fallbackType]}`;
}

/**
 * Critical font CSS generator
 */
export function generateCriticalFontCSS(configs: FontConfig[]): string {
  const criticalFonts = configs.filter(config => config.preload);
  
  return criticalFonts
    .map(config => {
      return `
        @font-face {
          font-family: "${config.family}";
          font-style: normal;
          font-weight: ${config.weights[0]};
          font-display: ${config.display};
          src: url("${generateGoogleFontUrl(config)}") format("woff2");
        }
      `;
    })
    .join('\n');
}

/**
 * Font optimization metrics
 */
export interface FontMetrics {
  totalFonts: number;
  loadedFonts: number;
  averageLoadTime: number;
  slowFonts: string[];
  failedFonts: string[];
}

export function getFontMetrics(monitor: FontPerformanceMonitor): FontMetrics {
  const loadTimes = monitor.getFontLoadTimes();
  const slowFonts: string[] = [];
  
  loadTimes.forEach((time, font) => {
    if (time > 1000) {
      slowFonts.push(font);
    }
  });
  
  return {
    totalFonts: Object.keys(FONT_CONFIGS).length,
    loadedFonts: loadTimes.size,
    averageLoadTime: monitor.getAverageFontLoadTime(),
    slowFonts,
    failedFonts: [], // Would need additional tracking for failed loads
  };
}