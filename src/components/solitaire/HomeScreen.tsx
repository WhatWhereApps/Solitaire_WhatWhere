import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Settings, Info } from 'lucide-react';
import { SettingsDialog } from './SettingsDialog';
import { HowToPlayDialog } from './HowToPlayDialog';
import { GameSettings } from '@/hooks/useGameSettings';
import { useLanguage } from '@/i18n';

interface HomeScreenProps {
  onNewGame: () => void;
  onContinue?: () => void;
  hasSavedGame?: boolean;
  settings: GameSettings;
  onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
}

export const HomeScreen = ({ 
  onNewGame, 
  onContinue, 
  hasSavedGame,
  settings,
  onUpdateSetting
}: HomeScreenProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-emerald-800 to-emerald-950 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Logo/Title */}
      <div className="mb-6 sm:mb-10 md:mb-12 text-center flex-shrink-0">
        <div className="mb-3 sm:mb-4 flex justify-center">
          <div className="w-14 h-20 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white rounded-lg shadow-2xl flex items-center justify-center border-2 border-emerald-300">
            <span className="text-2xl sm:text-3xl md:text-4xl">♠️</span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">Solitaire</h1>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full max-w-[280px] sm:max-w-xs flex-shrink-0">
        {hasSavedGame && onContinue && (
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full h-11 sm:h-12 md:h-14 text-base sm:text-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg"
          >
            <Play className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
            {t.continueGame}
          </Button>
        )}
        
        <Button
          onClick={onNewGame}
          size="lg"
          variant={hasSavedGame ? "outline" : "default"}
          className={`w-full h-11 sm:h-12 md:h-14 text-base sm:text-lg shadow-lg ${
            hasSavedGame 
              ? "border-emerald-400 text-emerald-100 hover:bg-emerald-700/50" 
              : "bg-emerald-500 hover:bg-emerald-400 text-white"
          }`}
        >
          <Play className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          {t.newGame}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full h-11 sm:h-12 md:h-14 text-base sm:text-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          {t.settings}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full h-11 sm:h-12 md:h-14 text-base sm:text-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50"
          onClick={() => setHowToPlayOpen(true)}
        >
          <Info className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          {t.howToPlay}
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-4 sm:mt-6 md:mt-8 flex-shrink-0">
        <p className="text-emerald-300/80 text-sm font-medium tracking-widest uppercase">WhatWhereApps</p>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdateSetting={onUpdateSetting}
      />

      {/* How to Play Dialog */}
      <HowToPlayDialog
        open={howToPlayOpen}
        onOpenChange={setHowToPlayOpen}
      />
    </div>
  );
};
