import React, { useState } from 'react';
import { Train } from 'lucide-react';

interface RailwayImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const RailwayImage: React.FC<RailwayImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Indian Railways Passenger Train Infrastructure'
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-gradient-to-br from-[#002244] to-slate-900 text-slate-200 flex flex-col items-center justify-center p-6 text-center border border-slate-700 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
          <Train className="w-6 h-6" />
        </div>
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">{alt}</span>
        <span className="text-[11px] text-slate-400 mt-0.5">{fallbackText}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
};
