import { useEffect } from 'react';
import { useLanguage } from '@/i18n';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-400 to-teal-500 flex flex-col items-center justify-center z-50">
      {/* Main Title */}
      <div className="text-center space-y-8">
        <h1 className="font-fredoka text-6xl sm:text-8xl text-white drop-shadow-2xl animate-pulse">
          {t.appTitle}
        </h1>
        
        {/* Subtitle */}
        <div className="font-orbitron text-lg sm:text-xl text-white/90 font-bold tracking-[0.3em] uppercase">
          WhatWhere Apps
        </div>
        
        {/* Loading Spinner */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <div className="text-white/80 text-sm font-orbitron">
            {t.loading}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-white/20 text-4xl animate-spin">♠</div>
      <div className="absolute top-20 right-16 text-white/20 text-3xl animate-bounce">♥</div>
      <div className="absolute bottom-20 left-20 text-white/20 text-3xl animate-pulse">♦</div>
      <div className="absolute bottom-16 right-12 text-white/20 text-4xl animate-spin">♣</div>
    </div>
  );
};