import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds total
    const interval = 20; // Update every 20ms
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onLoadingComplete, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-800 to-emerald-950 flex flex-col items-center justify-center z-50 animate-fade-in [animation-fill-mode:forwards]">

      {/* Card Icon */}
      <div className="mb-6 opacity-0 animate-scale-in [animation-fill-mode:forwards]">

        <div className="w-20 h-28 bg-white rounded-xl shadow-2xl flex items-center justify-center">
          <span className="text-4xl text-emerald-600">♠</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold text-white mb-8 tracking-wide opacity-0 animate-fade-in [animation-delay:200ms] [animation-fill-mode:forwards]">

        Solitaire
      </h1>

      {/* Loading Bar Container */}
      <div className="w-64 mb-12 opacity-0 animate-fade-in [animation-delay:400ms] [animation-fill-mode:forwards]">

        <div className="h-2 bg-emerald-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Company Name */}
      <p className="text-emerald-300/80 text-sm font-medium tracking-widest uppercase opacity-0 animate-fade-in [animation-delay:600ms] [animation-fill-mode:forwards]">

        WhatWhereApps
      </p>
    </div>
  );
};