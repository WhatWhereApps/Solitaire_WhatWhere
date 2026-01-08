import { useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onLoadingComplete, 2000);
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-800 to-emerald-950 flex flex-col items-center justify-center z-50">
      {/* Title */}
      <h1 className="text-5xl font-bold text-white mb-12 tracking-wide opacity-0 animate-fade-in [animation-fill-mode:forwards]">
        Solitaire
      </h1>

      {/* Loading Spinner */}
      <div className="mb-12 opacity-0 animate-fade-in [animation-delay:200ms] [animation-fill-mode:forwards]">
        <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>

      {/* Company Name */}
      <p className="text-emerald-300/80 text-sm font-medium tracking-widest uppercase opacity-0 animate-fade-in [animation-delay:400ms] [animation-fill-mode:forwards]">
        WhatWhereApps
      </p>
    </div>
  );
};