import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl overflow-hidden';
    
    const variants = {
      default: 'bg-dark-900 border border-dark-800',
      glass: 'bg-dark-900/70 backdrop-blur-lg border border-dark-700/50',
      elevated: 'bg-dark-900 shadow-xl shadow-black/30',
    };

    const hoverStyles = hover
      ? 'transition-all duration-300 hover:shadow-xl hover:shadow-pink-400/10 hover:-translate-y-1 cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 flex items-center', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';

// Card Image
interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: 'video' | 'square' | 'wide';
}

const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, aspectRatio = 'video', ...props }, ref) => {
    const aspectRatios = {
      video: 'aspect-video',
      square: 'aspect-square',
      wide: 'aspect-[2/1]',
    };

    return (
      <div 
        ref={ref} 
        className={cn('relative overflow-hidden', aspectRatios[aspectRatio], className)} 
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

export { Card, CardHeader, CardContent, CardFooter, CardImage };
