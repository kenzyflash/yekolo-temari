import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  fullHeight?: boolean;
}

export const ResponsiveWrapper = ({ 
  children, 
  className,
  withPadding = true,
  fullHeight = false 
}: ResponsiveWrapperProps) => {
  return (
    <div 
      className={cn(
        "w-full",
        withPadding && "responsive-padding",
        fullHeight && "min-h-screen",
        className
      )}
    >
      <div className="max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
};