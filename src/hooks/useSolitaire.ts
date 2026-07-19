import { useState, useCallback, useEffect } from 'react';
import { Card, GameState, Suit, Rank, DrawPileNode, DrawPileState } from '@/types/solitaire';
import { toast } from 'sonner';

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ---------- Linked-list helpers ----------

/** Build a linear linked list from an array. cards[0] becomes the head (top). */
const listFromArray = (cards: Card[]): DrawPileNode | null => {
  let head: DrawPileNode | null = null;
  for (let i = cards.length - 1; i >= 0; i--) {
    head = { card: cards[i], next: head };
  }
  return head;
};

/** Push a card onto the head of a linked list. */
const push = (list: DrawPileNode | null, card: Card): DrawPileNode => ({
  card,
  next: list,
});

/** Reverse a linked list (used to recycle waste back into deck). */
const reverseList = (list: DrawPileNode | null): DrawPileNode | null => {
  let prev: DrawPileNode | null = null;
  let curr = list;
  while (curr) {
    const next = curr.next;
    prev = { card: curr.card, next: prev };
    curr = next;
  }
  return prev;
};

const emptyDrawPile = (): DrawPileState => ({ deck: null, waste: null });

// ---------- Game rules ----------

const getRankValue = (rank: Rank): number => {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
};

const canMoveToFoundation = (card: Card, foundation: Card[]): boolean => {
  if (foundation.length === 0) return card.rank === 'A';
  const top = foundation[foundation.length - 1];
  return card.suit === top.suit && getRankValue(card.rank) === getRankValue(top.rank) + 1;
};

const canMoveToTableau = (card: Card, tableau: Card[]): boolean => {
  if (tableau.length === 0) return card.rank === 'K';
  const top = tableau[tableau.length - 1];
  return card.color !== top.color && getRankValue(card.rank) === getRankValue(top.rank) - 1;
};

// ---------- Hook ----------

const MAX_HISTORY = 50;

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    drawPile: emptyDrawPile(),
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    selectedCard: null,
    selectedPile: null,
    moves: 0,
    score: 0,
    time: 0,
    isWon: false,
  }));
  const [history, setHistory] = useState<GameState[]>([]);

  /** Snapshot current state (deep enough for undo) before a mutating action. */
  const snapshot = useCallback((s: GameState): GameState => ({
    ...s,
    drawPile: { deck: s.drawPile.deck, waste: s.drawPile.waste }, // linked lists are immutable in our flow
    foundations: s.foundations.map(f => [...f]),
    tableau: s.tableau.map(t => t.map(c => ({ ...c }))),
    selectedCard: null,
    selectedPile: null,
    cardIndex: undefined,
  }), []);

  const pushHistory = useCallback((s: GameState) => {
    setHistory(h => {
      const next = [...h, snapshot(s)];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
  }, [snapshot]);

  const createDeck = useCallback((): Card[] => {
    const deck: Card[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          faceUp: false,
          color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
        });
      });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, []);

  const dealCards = useCallback(() => {
    const deck = createDeck();
    const tableau: Card[][] = [[], [], [], [], [], [], []];

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        if (row === col) card.faceUp = true;
        tableau[col].push(card);
      }
    }

    // Remaining cards -> deck linked list (top of stack = head)
    const deckList = listFromArray(deck.map(c => ({ ...c, faceUp: false })));

    setGameState({
      drawPile: { deck: deckList, waste: null },
      foundations: [[], [], [], []],
      tableau,
      selectedCard: null,
      selectedPile: null,
      moves: 0,
      score: 0,
      time: 0,
      isWon: false,
    });
    setHistory([]);
  }, [createDeck]);

  /**
   * Draw one card from deck onto waste.
   * If deck is empty and waste has cards, recycle waste back to deck (reversed, face-down).
   */
  const drawFromDeck = useCallback(() => {
    setGameState(prev => {
      const { deck, waste } = prev.drawPile;

      if (deck) {
        pushHistory(prev);
        const drawn: Card = { ...deck.card, faceUp: true };
        return {
          ...prev,
          drawPile: {
            deck: deck.next,
            waste: push(waste, drawn),
          },
          moves: prev.moves + 1,
        };
      }

      if (waste) {
        pushHistory(prev);
        // Recycle: reverse waste back into deck, flipping each card face-down.
        // Build a new list without mutating existing nodes (history relies on immutability).
        let recycled: DrawPileNode | null = null;
        let curr: DrawPileNode | null = waste;
        while (curr) {
          recycled = { card: { ...curr.card, faceUp: false }, next: recycled };
          curr = curr.next;
        }
        return {
          ...prev,
          drawPile: { deck: recycled, waste: null },
          moves: prev.moves + 1,
        };
      }

      return prev;
    });
  }, [pushHistory]);

  const moveCard = useCallback((
    fromType: string,
    fromIndex: number | undefined,
    toType: string,
    toIndex: number | undefined,
    cardIndex?: number,
  ) => {
    setGameState(prev => {
      const newState: GameState = { ...prev };
      let cardsToMove: Card[] = [];
      let didSnapshot = false;
      const snap = () => { if (!didSnapshot) { pushHistory(prev); didSnapshot = true; } };

      // ---- Gather cards from source ----
      if (fromType === 'waste') {
        if (!prev.drawPile.waste) return prev;
        cardsToMove = [{ ...prev.drawPile.waste.card, faceUp: true }];
      } else if (fromType === 'tableau' && fromIndex !== undefined) {
        const pile = prev.tableau[fromIndex];
        if (cardIndex !== undefined) cardsToMove = pile.slice(cardIndex);
        else if (pile.length > 0) cardsToMove = [pile[pile.length - 1]];
      } else if (fromType === 'foundation' && fromIndex !== undefined) {
        const pile = prev.foundations[fromIndex];
        if (pile.length > 0) cardsToMove = [pile[pile.length - 1]];
      }
      if (cardsToMove.length === 0) return prev;

      // ---- Validate destination ----
      const firstCard = cardsToMove[0];
      let canMove = false;
      if (toType === 'foundation' && toIndex !== undefined) {
        canMove = cardsToMove.length === 1 && canMoveToFoundation(firstCard, prev.foundations[toIndex]);
      } else if (toType === 'tableau' && toIndex !== undefined) {
        canMove = canMoveToTableau(firstCard, prev.tableau[toIndex]);
      }
      if (!canMove) return prev;

      // ---- Remove from source ----
      if (fromType === 'waste' && prev.drawPile.waste) {
        // Pop waste head — next node becomes the visible waste card automatically
        newState.drawPile = {
          deck: prev.drawPile.deck,
          waste: prev.drawPile.waste.next,
        };
      } else if (fromType === 'tableau' && fromIndex !== undefined) {
        newState.tableau = [...prev.tableau];
        newState.tableau[fromIndex] = cardIndex !== undefined
          ? prev.tableau[fromIndex].slice(0, cardIndex)
          : prev.tableau[fromIndex].slice(0, -1);
        const remaining = newState.tableau[fromIndex];
        if (remaining.length > 0 && !remaining[remaining.length - 1].faceUp) {
          remaining[remaining.length - 1] = { ...remaining[remaining.length - 1], faceUp: true };
        }
      } else if (fromType === 'foundation' && fromIndex !== undefined) {
        newState.foundations = [...prev.foundations];
        newState.foundations[fromIndex] = prev.foundations[fromIndex].slice(0, -1);
      }

      // ---- Add to destination ----
      if (toType === 'foundation' && toIndex !== undefined) {
        newState.foundations = [...(newState.foundations ?? prev.foundations)];
        newState.foundations[toIndex] = [...prev.foundations[toIndex], ...cardsToMove];
        newState.score = prev.score + 10;
      } else if (toType === 'tableau' && toIndex !== undefined) {
        newState.tableau = [...(newState.tableau ?? prev.tableau)];
        newState.tableau[toIndex] = [...prev.tableau[toIndex], ...cardsToMove];
        if (fromType === 'waste') newState.score = prev.score + 5;
      }

      newState.moves = prev.moves + 1;
      newState.selectedCard = null;
      newState.selectedPile = null;

      // ---- Win check ----
      const total = newState.foundations.reduce((s, f) => s + f.length, 0);
      if (total === 52) {
        newState.isWon = true;
        newState.score = (newState.score ?? prev.score) + 1000;
        toast.success('Congratulations! You won!', {
          description: `Final score: ${newState.score} | Moves: ${newState.moves}`,
          duration: 5000,
        });
      }

      return newState;
    });
  }, []);

  const selectCard = useCallback((card: Card, pileType: string, pileIndex?: number, cardIndex?: number) => {
    setGameState(prev => {
      if (prev.selectedCard?.id === card.id) {
        return { ...prev, selectedCard: null, selectedPile: null, cardIndex: undefined };
      }
      return {
        ...prev,
        selectedCard: card,
        selectedPile: { type: pileType, index: pileIndex },
        cardIndex,
      };
    });
  }, []);

  const restartGame = useCallback(() => {
    dealCards();
  }, [dealCards]);

  // Timer
  useEffect(() => {
    if (gameState.isWon) return;
    const timer = setInterval(() => {
      setGameState(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.isWon]);

  // Initial deal
  useEffect(() => {
    dealCards();
  }, [dealCards]);

  // Derived helpers for GameBoard
  const wasteCard: Card | null = gameState.drawPile.waste
    ? { ...gameState.drawPile.waste.card, faceUp: true }
    : null;
  const deckHasCards = gameState.drawPile.deck !== null;
  const atEnd = gameState.drawPile.deck === null && gameState.drawPile.waste !== null;
  const atStart = gameState.drawPile.waste === null;

  return {
    gameState,
    dealCards,
    drawFromDeck,
    moveCard,
    selectCard,
    restartGame,
    wasteCard,
    deckHasCards,
    atEnd,
    atStart,
  };
};
