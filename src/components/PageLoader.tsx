import React from 'react';

interface PageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'memuat halaman',
  size = 'md',
  className = '',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center select-none ${className}`}>
      <div className="relative flex items-center justify-center mb-3.5">
        <img
          src="/assets/loader-spinner.png"
          alt="Memuat..."
          className={`${sizeClasses[size]} object-contain animate-spin`}
        />
      </div>
      <p className="text-sm font-medium text-slate-500 tracking-wide">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default PageLoader;
