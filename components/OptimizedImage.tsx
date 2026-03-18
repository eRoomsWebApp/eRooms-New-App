
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = "", 
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

      {hasError ? (
        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 p-4 text-center">
          <ImageOff size={24} className="mb-2 opacity-20" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Asset Unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
