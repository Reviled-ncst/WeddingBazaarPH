import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'pink';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-dark-200',
    success: 'bg-green-900/50 text-green-400',
    warning: 'bg-yellow-900/50 text-yellow-400',
    danger: 'bg-red-900/50 text-red-400',
    pink: 'bg-pink-900/50 text-pink-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Avatar component
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover ring-2 ring-dark-700',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-dark-950 font-semibold ring-2 ring-dark-700',
        sizes[size],
        className
      )}
    >
      {fallback || '?'}
    </div>
  );
}

// Rating stars component
interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  showValue = true,
  className,
}: RatingProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn('flex', sizes[size])}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={i < Math.floor(value) ? 'text-yellow-400' : 'text-dark-600'}
          >
            ?
          </span>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-dark-300 ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Skeleton loader
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-dark-700 rounded-lg',
        className
      )}
    />
  );
}
