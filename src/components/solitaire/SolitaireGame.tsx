import { useState, useCallback, useRef, useEffect } from 'react';
import { useSolitaire } from '@/hooks/useSolitaire';
import { useGameSettings } from '@/hooks/useGameSettings';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { HomeScreen } from './HomeScreen';
import { VictoryScreen } from './VictoryScreen';
import { LoadingScreen } from './LoadingScreen';
import { Card } from './Card';
import { Card as CardType } from '@/types/solitaire';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

type Screen = 'loading' | 'home' | 'game';
const DOUBLE_TAP_WINDOW_MS = 300;
const SINGLE_TAP_DELAY_MS = 180;
const DRAG_THRESHOLD_PX = 5;

type Selection = { card: CardType; source: { type: string; index?: number; cardIndex?: number } } | null;

export const SolitaireGame = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const lastTapRef = useRef<{ cardId: string; time: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    card: CardType;
    source: { type: string; index?: number; cardIndex?: number };
    active: boolean;
    pointerId: number;
  } | null>(null);
  const [dragVisual, setDragVisual] = useState<{ card: CardType; x: number; y: number } | null>(null);
  
  const { settings, updateSetting } = useGameSettings();
  
  const { 
    gameState, 
    time,
    dealCards, 
    drawFromDeck, 
    moveCard, 
    restartGame,
    undo,
    canUndo,
    wasteCard,
    deckHasCards,
    atEnd,
    atStart,
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

  const handleNewGame = () => {
    dealCards();
    setCurrentScreen('game');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const isTopOfPile = (pileType: string, pileIndex?: number, cardIndex?: number) => {
    if (pileType === 'waste') return true;
    if (pileType === 'foundation') return false;
    if (pileType === 'tableau' && pileIndex !== undefined) {
      const pile = gameState.tableau[pileIndex];
      return cardIndex === undefined || cardIndex === pile.length - 1;
    }
    return false;
  };

  const getRankValue = (rank: string) => {
    if (rank === 'A') return 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank, 10);
  };

  const canPlayOnTableau = (card: CardType, tableauPile: CardType[]) => {
    if (tableauPile.length === 0) return card.rank === 'K';
    const top = tableauPile[tableauPile.length - 1];
    return card.color !== top.color && getRankValue(card.rank) === getRankValue(top.rank) - 1;
  };

  // Suppress the click event that fires after a completed drag
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('click', onClickCapture, true);
    return () => window.removeEventListener('click', onClickCapture, true);
  }, []);

  const tryAutoMoveToFoundation = (card: CardType, pileType: string, pileIndex?: number, cardIndex?: number): boolean => {
    if (!isTopOfPile(pileType, pileIndex, cardIndex)) return false;
    for (let f = 0; f < 4; f++) {
      const foundation = gameState.foundations[f];
      const valid = foundation.length === 0
        ? card.rank === 'A'
        : card.suit === foundation[foundation.length - 1].suit &&
          getRankValue(card.rank) === getRankValue(foundation[foundation.length - 1].rank) + 1;
      if (valid) {
        moveCard(pileType, pileIndex, 'foundation', f, cardIndex);
        triggerHaptic('success');
        return true;
      }
    }
    return false;
  };

  const tryMoveToTableau = (card: CardType, pileType: string, pileIndex?: number, cardIndex?: number): boolean => {
    for (let t = 0; t < gameState.tableau.length; t++) {
      if (pileType === 'tableau' && pileIndex === t) continue;
      if (!canPlayOnTableau(card, gameState.tableau[t])) continue;

      moveCard(pileType, pileIndex, 'tableau', t, cardIndex);
      triggerHaptic('success');
      return true;
    }

    return false;
  };

  const handleCardClick = (card: CardType, pileType: string, pileIndex?: number, cardIndex?: number) => {
    const now = Date.now();
    const previousTap = lastTapRef.current;
    const isDoubleTap = previousTap?.cardId === card.id && now - previousTap.time <= DOUBLE_TAP_WINDOW_MS;

    if (isDoubleTap) {
      lastTapRef.current = null;

      if (pileType !== 'foundation' && tryAutoMoveToFoundation(card, pileType, pileIndex, cardIndex)) {
        return;
      }
      if (pileType !== 'foundation' && tryMoveToTableau(card, pileType, pileIndex, cardIndex)) {
        return;
      }

      triggerHaptic('error');
      return;
    }

    lastTapRef.current = { cardId: card.id, time: now };
    triggerHaptic('light');
  };

  const handleEmptyPileClick = (pileType: string, pileIndex?: number) => {
    triggerHaptic('light');
  };

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragVisual(null);
    setDragState({ isDragging: false, dragCard: null, dragSource: null });
  }, []);

  const handlePointerDragStart = useCallback((
    e: React.PointerEvent,
    card: CardType,
    pileType: string,
    pileIndex?: number,
    cardIndex?: number,
  ) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const pointerId = e.pointerId;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      card,
      source: { type: pileType, index: pileIndex, cardIndex },
      active: false,
      pointerId,
    };

    // Capture the pointer to the source element so subsequent move/up events
    // reliably fire on it (critical on iOS WKWebView).
    try { target.setPointerCapture(pointerId); } catch { /* noop */ }

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;

      if (!d.active) {
        const dx = ev.clientX - d.startX;
        const dy = ev.clientY - d.startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        d.active = true;
        triggerHaptic('medium');
        setDragState({
          isDragging: true,
          dragCard: d.card,
          dragSource: d.source,
        });
      }
      setDragVisual({ card: d.card, x: ev.clientX - d.offsetX, y: ev.clientY - d.offsetY });
    };

    const cleanup = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      try { target.releasePointerCapture(pointerId); } catch { /* noop */ }
    };

    const onUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      cleanup();
      if (!d || ev.pointerId !== d.pointerId) {
        endDrag();
        return;
      }

      if (!d.active) {
        // Treat as a tap: let the native click fire naturally
        endDrag();
        return;
      }

      // Suppress the synthesized click that follows a drag
      suppressNextClickRef.current = true;
      window.setTimeout(() => { suppressNextClickRef.current = false; }, 350);

      // Hit-test the drop target using elementFromPoint
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const dropEl = el?.closest('[data-drop-type]') as HTMLElement | null;
      if (dropEl) {
        const type = dropEl.dataset.dropType!;
        const idxAttr = dropEl.dataset.dropIndex;
        const idx = idxAttr !== undefined ? parseInt(idxAttr, 10) : undefined;
        const { type: fromType, index: fromIndex, cardIndex: srcCardIndex } = d.source;
        const isSameSource = fromType === type && fromIndex === idx;
        if (!isSameSource) {
          moveCard(fromType, fromIndex, type, idx, srcCardIndex);
          triggerHaptic('success');
        }
      }
      endDrag();
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  }, [endDrag, moveCard, triggerHaptic]);

  const handleLoadingComplete = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  if (currentScreen === 'loading') {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen 
        onNewGame={handleNewGame}
        settings={settings}
        onUpdateSetting={updateSetting}
      />
    );
  }

  return (
    <div className="h-screen bg-game-felt p-2 sm:p-4 pt-10 sm:pt-6 flex flex-col overflow-hidden">
      <GameHeader
        score={gameState.score}
        moves={gameState.moves}
        time={time}

        onNewGame={handleNewGame}
        onRestart={restartGame}
        onHome={handleBackToHome}
        onUndo={() => { triggerHaptic('medium'); undo(); }}
        canUndo={canUndo}
        isWon={gameState.isWon}
      />
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <GameBoard
          gameState={gameState}
          onCardClick={handleCardClick}
          onEmptyPileClick={handleEmptyPileClick}
          onDeckClick={() => {
            triggerHaptic('light');
            drawFromDeck();
          }}
          onPointerDragStart={handlePointerDragStart}
          dragState={dragState}
          cardBackDesign={settings.cardBackDesign}
          handPreference={settings.handPreference}
          wasteCard={wasteCard}
          deckHasCards={deckHasCards}
          atEnd={atEnd}
        />
      </div>

      {dragVisual && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: dragVisual.x,
            top: dragVisual.y,
            transform: 'rotate(2deg) scale(1.05)',
          }}
        >
          <Card
            card={{ ...dragVisual.card, faceUp: true }}
            isSelectable={false}
            cardBackDesign={settings.cardBackDesign}
          />
        </div>
      )}

      {gameState.isWon && (
        <VictoryScreen
          score={gameState.score}
          moves={gameState.moves}
          time={time}
          onNewGame={handleNewGame}
          onHome={handleBackToHome}
        />
      )}

    </div>
  );
};
