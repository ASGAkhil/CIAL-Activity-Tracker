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

  // Shadow size logic based on the logo size
  const shadowSizes = {
    sm: 'h-1 w-8 mt-2',
    md: 'h-1.5 w-12 mt-3',
    lg: 'h-3 w-24 mt-6',
    xl: 'h-4 w-48 mt-8'
  };

  const renderLogo = () => {
    if (hasError || !CONFIG.LOGO_URL) {
      return (
        <div className="flex flex-col items-center">
          <div className={`${sizeClasses[size]} ${className} animate-float flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-6 text-white text-center relative z-10`}>
            <div className="text-4xl font-black tracking-tighter">CIAL</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mt-1">Cloud AI Labs</div>
          </div>
          {/* Dynamic Shadow */}
          <div className={`${shadowSizes[size]} bg-slate-400/30 rounded-full blur-md animate-shadow mx-auto`}></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className={`${sizeClasses[size]} ${className} animate-float flex items-center justify-center overflow-visible relative z-10`}>
          <img 
            src={CONFIG.LOGO_URL} 
            alt="CIAL AI Cloud Logo" 
            className="w-full h-auto max-h-full object-contain filter drop-shadow-2xl select-none pointer-events-none transition-all duration-500"
            style={{ filter: 'drop-shadow(0 25px 45px rgba(59, 130, 246, 0.5))' }}
            onError={() => setHasError(true)}
          />
        </div>
        {/* Dynamic Shadow for Image */}
        <div className={`${shadowSizes[size]} bg-slate-400/20 rounded-full blur-lg animate-shadow mx-auto`}></div>
      </div>
    );
  };

  return renderLogo();
};