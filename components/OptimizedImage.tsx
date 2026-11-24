import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number | string;
  height?: number | string;
  /** 'contain' shows the whole photo (no cropping) over a soft blurred copy of itself. */
  fit?: 'cover' | 'contain';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  width,
  height,
  fit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center"
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {hasError || !src ? (
        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 p-4 text-center">
          <ImageOff size={24} className="mb-2 opacity-20" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
            Photo Unavailable
          </span>
        </div>
      ) : (
        <>
        {fit === 'contain' && (
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60 pointer-events-none"
          />
        )}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          referrerPolicy="no-referrer"
          className={`relative w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          {...props}
        />
        </>
      )}
    </div>
  );
};

export default OptimizedImage;
