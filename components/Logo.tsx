
import React, { useState } from 'react';
import { CONFIG } from '../services/config';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-auto',
    md: 'h-16 w-auto',
    lg: 'h-32 w-auto',
    xl: 'w-full max-w-[480px] h-auto min-h-[150px]'
  };

  // If the image fails or the URL is default and missing, show a high-quality fallback
  if (hasError || !CONFIG.LOGO_URL) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-6 text-white text-center`}>
        <div className="text-4xl font-black tracking-tighter">CIAL</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mt-1">Cloud AI Labs</div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center overflow-visible`}>
      <img 
        src={CONFIG.LOGO_URL} 
        alt="CIAL AI Cloud Logo" 
        className="w-full h-auto max-h-full object-contain filter drop-shadow-2xl select-none pointer-events-none transition-all duration-500"
        style={{ filter: 'drop-shadow(0 15px 35px rgba(59, 130, 246, 0.4))' }}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
