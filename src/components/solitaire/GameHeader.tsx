import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, Clock, Target, Home, Undo2 } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { formatTime } from '@/lib/formatTime';

interface GameHeaderProps {
  score: number;
  moves: number;
  time: number;
  onNewGame: () => void;
  onRestart: () => void;
  onHome: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isWon: boolean;
}

export const GameHeader = ({ score, moves, time, onNewGame, onRestart, onHome, onUndo, canUndo, isWon }: GameHeaderProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-5 pt-safe-area-inset-top mt-2 sm:mt-4">
      {/* Buttons row - above everything, aligned right */}
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        {/* Home button on left */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onHome}
          className="gap-1.5 text-sm sm:text-base px-2.5 sm:px-4"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{t.menu}</span>
        </Button>

        {/* Right side buttons */}
        <div className="flex items-center gap-1 sm:gap-3">

        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          className="hover:bg-primary hover:text-primary-foreground gap-1.5 text-sm sm:text-base px-2.5 sm:px-4"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{t.restart}</span>
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onNewGame}
          className="gap-1.5 text-sm sm:text-base px-2.5 sm:px-4"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{t.new}</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-victory-glow" />
          <span className="text-base sm:text-xl font-bold text-foreground">{score}</span>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <span className="text-base sm:text-xl font-semibold text-foreground">{moves}</span>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <span className="text-base sm:text-xl font-mono text-foreground">{formatTime(time)}</span>
        </div>
      </div>

      {isWon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl font-bold text-victory-glow animate-victory-pulse">
            {t.youWon}
          </div>
        </div>
      )}
    </div>
  );
};