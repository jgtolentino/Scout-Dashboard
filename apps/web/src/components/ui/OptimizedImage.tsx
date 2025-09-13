import React from 'react';
import Image, { ImageProps } from 'next/image';

/**
 * Optimized Image Component with Performance Enhancements
 * - Automatic format selection (WebP, AVIF)
 * - Lazy loading by default
 * - Responsive sizes
 * - Loading states
 * - Error handling
 * - Performance monitoring
 */

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  fallbackSrc,
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Generate blur data URL if not provided
  const defaultBlurDataURL = React.useMemo(() => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder based on dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return undefined;
    
    canvas.width = 10;
    canvas.height = 10;
    
    // Create a simple gradient
    const gradient = ctx.createLinearGradient(0, 0, 10, 10);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 10, 10);
    
    return canvas.toDataURL();
  }, [blurDataURL]);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback((error: any) => {
    setImageError(true);
    setIsLoading(false);
    onError?.(new Error(`Failed to load image: ${src}`));
  }, [src, onError]);

  // Determine image source
  const imageSrc = imageError && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={loading}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        onLoad={handleLoad}
        onError={handleError}
        className="transition-opacity duration-300"
        style={{
          objectFit: 'cover',
          opacity: isLoading ? 0.5 : 1,
        }}
        {...props}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {imageError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

/**
 * Responsive Image Component
 * Automatically handles responsive image sizes
 */
interface ResponsiveImageProps extends OptimizedImageProps {
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  aspectRatio = 'auto',
  className = '',
  ...props
}) => {
  const aspectRatioClasses = {
    'square': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    'auto': '',
  };

  return (
    <div className={`relative overflow-hidden ${aspectRatioClasses[aspectRatio]} ${className}`}>
      <OptimizedImage
        fill
        className="object-cover"
        {...props}
      />
    </div>
  );
};

/**
 * Avatar Image Component
 * Optimized for profile pictures and avatars
 */
interface AvatarImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: boolean;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  size = 'md',
  rounded = true,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const sizeDimensions = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      ${rounded ? 'rounded-full' : 'rounded-lg'} 
      overflow-hidden 
      ${className}
    `}>
      <OptimizedImage
        width={sizeDimensions[size].width}
        height={sizeDimensions[size].height}
        className="object-cover w-full h-full"
        quality={85}
        priority={size === 'xl'} // Prioritize large avatars
        {...props}
      />
    </div>
  );
};

/**
 * Hero Image Component
 * Optimized for large banner/hero images
 */
interface HeroImageProps extends OptimizedImageProps {
  overlay?: boolean;
  overlayOpacity?: number;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  overlay = false,
  overlayOpacity = 0.4,
  className = '',
  ...props
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <OptimizedImage
        fill
        priority={true}
        quality={90}
        sizes="100vw"
        className="object-cover"
        {...props}
      />
      
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};