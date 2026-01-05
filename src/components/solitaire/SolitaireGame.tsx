import { useState, useCallback, useEffect } from 'react';
import { useSolitaire } from '@/hooks/useSolitaire';
import { useGameSettings } from '@/hooks/useGameSettings';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { LoadingScreen } from './LoadingScreen';
import { HomeScreen } from './HomeScreen';
import { VictoryScreen } from './VictoryScreen';
import { SettingsDialog } from './SettingsDialog';
import { Card as CardType } from '@/types/solitaire';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n';

type Screen = 'home' | 'loading' | 'game';

const LOADING_SHOWN_KEY = 'whatwhere_loading_shown';
const HAND_TIP_SHOWN_KEY = 'whatwhere_hand_tip_shown';

export const SolitaireGame = () => {
  // Check if this is the first app launch
  const hasSeenLoading = localStorage.getItem(LOADING_SHOWN_KEY) === 'true';
  const [currentScreen, setCurrentScreen] = useState<Screen>(hasSeenLoading ? 'home' : 'loading');
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedCard, setLastClickedCard] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { settings, updateSetting } = useGameSettings();
  const { t } = useLanguage();
  
  const { 
    gameState, 
    dealCards, 
    drawFromDeck, 
    moveCard, 
    selectCard, 
    restartGame 
  } = useSolitaire();

  const [dragState, setDragState] = useState({
    isDragging: false,
    dragCard: null as CardType | null,
    dragSource: null as { type: string; index?: number; cardIndex?: number } | null,
  });

  // Enhanced haptic feedback using Capacitor Haptics with settings support
  const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    // Check if vibration is enabled
    if (settings.vibrationIntensity === 'off') return;

    // Map setting intensity to haptic type
    const intensityMap: Record<string, 'light' | 'medium' | 'heavy'> = {
      light: 'light',
      medium: 'medium',
      heavy: 'heavy',
    };
    
    const effectiveType = type === 'success' || type === 'error' 
      ? type 
      : intensityMap[settings.vibrationIntensity] || type;

    try {
      if (effectiveType === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (effectiveType === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      } else {
        const styles = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        await Haptics.impact({ style: styles[effectiveType] });
      }
    } catch {
      // Fallback to navigator.vibrate for web
      if ('vibrate' in navigator) {
        const patterns = { light: [10], medium: [20], heavy: [50], success: [30, 50, 30], error: [100] };
        navigator.vibrate(patterns[effectiveType] || [10]);
      }
    }
  }, [settings.vibrationIntensity]);

  const handleLoadingComplete = () => {
    // Mark loading as shown so it won't appear again
    localStorage.setItem(LOADING_SHOWN_KEY, 'true');
    setCurrentScreen('home');
  };

  const handleNewGame = () => {
    dealCards();
    setCurrentScreen('game');
    
    // Show one-time tip about hand preference
    const hasSeenHandTip = localStorage.getItem(HAND_TIP_SHOWN_KEY) === 'true';
    if (!hasSeenHandTip) {
      localStorage.setItem(HAND_TIP_SHOWN_KEY, 'true');
      setTimeout(() => {
        toast(t.handTipTitle, {
          description: t.handTipDescription,
          duration: 5000,
        });
      }, 1000);
    }
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleCardClick = (card: CardType, pileType: string, pileIndex?: number, cardIndex?: number) => {
    const currentTime = Date.now();
    const isDoubleClick = lastClickedCard === card.id && currentTime - lastClickTime < 300;
    
    setLastClickTime(currentTime);
    setLastClickedCard(card.id);

    // Haptic feedback for card selection
    triggerHaptic('light');

    if (gameState.selectedCard) {
      // If double-clicking the same selected card, deselect it
      if (isDoubleClick && gameState.selectedCard.id === card.id) {
        selectCard(card, pileType, pileIndex, cardIndex);
        triggerHaptic('medium');
        return;
      }

      // If clicking the same card (single click), deselect
      if (gameState.selectedCard.id === card.id) {
        selectCard(card, pileType, pileIndex, cardIndex);
        return;
      }

      // Try to move selected card to clicked location
      const { selectedPile } = gameState;
      if (selectedPile) {
        const fromIndex = selectedPile.index;
        const cardIdx = (gameState as any).cardIndex;
        
        // Try to move to this pile
        if (pileType === 'foundation' && pileIndex !== undefined) {
          moveCard(selectedPile.type, fromIndex, 'foundation', pileIndex, cardIdx);
        } else if (pileType === 'tableau' && pileIndex !== undefined) {
          moveCard(selectedPile.type, fromIndex, 'tableau', pileIndex, cardIdx);
        } else {
          // Select new card instead
          selectCard(card, pileType, pileIndex, cardIndex);
          return;
        }
        
        // Success haptic for card move
        triggerHaptic('success');
      }
    } else {
      // Select card
      selectCard(card, pileType, pileIndex, cardIndex);
    }
  };

  const handleEmptyPileClick = (pileType: string, pileIndex?: number) => {
    if (gameState.selectedCard && gameState.selectedPile) {
      const { selectedPile } = gameState;
      const fromIndex = selectedPile.index;
      const cardIdx = (gameState as any).cardIndex;
      
      triggerHaptic('light');

      if (pileType === 'foundation' && pileIndex !== undefined) {
        moveCard(selectedPile.type, fromIndex, 'foundation', pileIndex, cardIdx);
      } else if (pileType === 'tableau' && pileIndex !== undefined) {
        moveCard(selectedPile.type, fromIndex, 'tableau', pileIndex, cardIdx);
      }
      
      // Success haptic for pile move
      triggerHaptic('success');
    }
  };

  const handleDragStart = (card: CardType, pileType: string, pileIndex?: number, cardIndex?: number) => {
    triggerHaptic('medium');
    setDragState({
      isDragging: true,
      dragCard: card,
      dragSource: { type: pileType, index: pileIndex, cardIndex },
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragCard: null,
      dragSource: null,
    });
  };

  const handleCardDrop = (pileType: string, pileIndex?: number) => {
    if (!dragState.dragSource || !dragState.dragCard) return;

    const { type: fromType, index: fromIndex, cardIndex } = dragState.dragSource;
    
    // Use the existing moveCard logic
    moveCard(fromType, fromIndex, pileType, pileIndex, cardIndex);
    triggerHaptic('success');
    
    // Reset drag state
    handleDragEnd();
  };

  if (currentScreen === 'home') {
    return (
      <HomeScreen 
        onNewGame={handleNewGame}
        settings={settings}
        onUpdateSetting={updateSetting}
      />
    );
  }

  if (currentScreen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="h-screen bg-game-felt p-2 sm:p-4 pt-10 sm:pt-6 flex flex-col overflow-hidden">
      <GameHeader
        score={gameState.score}
        moves={gameState.moves}
        time={gameState.time}
        onNewGame={handleNewGame}
        onRestart={restartGame}
        onHome={handleBackToHome}
        isWon={gameState.isWon}
      />
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <GameBoard
          gameState={gameState}
          onCardClick={handleCardClick}
          onEmptyPileClick={handleEmptyPileClick}
          onDeckClick={drawFromDeck}
          onCardDrop={handleCardDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          dragState={dragState}
          cardBackDesign={settings.cardBackDesign}
          handPreference={settings.handPreference}
        />
      </div>

      {gameState.isWon && (
        <VictoryScreen
          score={gameState.score}
          moves={gameState.moves}
          time={gameState.time}
          onNewGame={handleNewGame}
          onHome={handleBackToHome}
        />
      )}

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onUpdateSetting={updateSetting}
      />
    </div>
  );
};
