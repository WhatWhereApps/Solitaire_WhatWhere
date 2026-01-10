import { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  useEffect(() => {
    // Hide Capacitor splash screen when our custom loading screen is ready
    SplashScreen.hide().catch(() => {
      // Ignore errors on web (SplashScreen not available)
    });
    
    const timer = setTimeout(onLoadingComplete, 2000);
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-800 to-emerald-950 flex flex-col items-center justify-center z-50">
      {/* Title */}
      <h1 className="text-5xl font-bold text-white tracking-wide opacity-0 animate-fade-in [animation-fill-mode:forwards]">
        Solitaire
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Company Name */}
      <p className="text-emerald-300/80 text-sm font-medium tracking-widest uppercase mb-12 opacity-0 animate-fade-in [animation-delay:200ms] [animation-fill-mode:forwards]">
        WhatWhereApps
      </p>
    </div>
  );
};