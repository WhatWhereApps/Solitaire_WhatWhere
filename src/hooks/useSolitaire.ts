import { useState, useCallback, useEffect } from 'react';
import { Card, GameState, Suit, Rank } from '@/types/solitaire';
import { toast } from 'sonner';

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    selectedCard: null,
    selectedPile: null,
    moves: 0,
    score: 0,
    time: 0,
    isWon: false,
  });

  const createDeck = useCallback((): Card[] => {
    const deck: Card[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          faceUp: false,
          color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black'
        });
      });
    });
    
    // Shuffle deck only once when creating new game
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }, []);

  const dealCards = useCallback(() => {
    const deck = createDeck();
    const tableau: Card[][] = [[], [], [], [], [], [], []];
    
    // Deal cards to tableau
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        if (row === col) {
          card.faceUp = true;
        }
        tableau[col].push(card);
      }
    }

    setGameState({
      deck,
      waste: [],
      foundations: [[], [], [], []],
      tableau,
      selectedCard: null,
      selectedPile: null,
      moves: 0,
      score: 0,
      time: 0,
      isWon: false,
    });
    
    toast.success("New game started!");
  }, [createDeck]);

  const drawFromDeck = useCallback(() => {
    setGameState(prev => {
      if (prev.deck.length === 0) {
        // Reset deck from waste - move all waste cards back to deck in original order
        if (prev.waste.length === 0) return prev; // No cards to reset
        // Take waste pile (oldest first), flip all face down, put back in deck
        const newDeck = prev.waste.map(card => ({ ...card, faceUp: false }));
        return { 
          ...prev, 
          deck: newDeck, 
          waste: [],
          moves: prev.moves + 1
        };
      } else {
        // Draw from deck - take first card (not last) to maintain order
        const newCard = { ...prev.deck[0], faceUp: true };
        return {
          ...prev,
          deck: prev.deck.slice(1),
          waste: [...prev.waste, newCard],
          moves: prev.moves + 1
        };
      }
    });
  }, []);

  const getRankValue = (rank: Rank): number => {
    if (rank === 'A') return 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank);
  };

  const canMoveToFoundation = (card: Card, foundation: Card[]): boolean => {
    if (foundation.length === 0) {
      return card.rank === 'A';
    }
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
  };

  const canMoveToTableau = (card: Card, tableau: Card[]): boolean => {
    if (tableau.length === 0) {
      return card.rank === 'K';
    }
    const topCard = tableau[tableau.length - 1];
    return card.color !== topCard.color && getRankValue(card.rank) === getRankValue(topCard.rank) - 1;
  };

  const moveCard = useCallback((
    fromType: string, 
    fromIndex: number | undefined, 
    toType: string, 
    toIndex: number | undefined,
    cardIndex?: number
  ) => {
    setGameState(prev => {
      const newState = { ...prev };
      let cardsToMove: Card[] = [];
      
      // Get cards to move
      if (fromType === 'waste') {
        if (prev.waste.length === 0) return prev;
        cardsToMove = [prev.waste[prev.waste.length - 1]];
      } else if (fromType === 'tableau' && fromIndex !== undefined) {
        const pile = prev.tableau[fromIndex];
        if (cardIndex !== undefined) {
          cardsToMove = pile.slice(cardIndex);
        } else if (pile.length > 0) {
          cardsToMove = [pile[pile.length - 1]];
        }
      } else if (fromType === 'foundation' && fromIndex !== undefined) {
        const pile = prev.foundations[fromIndex];
        if (pile.length > 0) {
          cardsToMove = [pile[pile.length - 1]];
        }
      }

      if (cardsToMove.length === 0) return prev;

      // Check if move is valid
      const firstCard = cardsToMove[0];
      let canMove = false;

      if (toType === 'foundation' && toIndex !== undefined) {
        canMove = cardsToMove.length === 1 && canMoveToFoundation(firstCard, prev.foundations[toIndex]);
      } else if (toType === 'tableau' && toIndex !== undefined) {
        canMove = canMoveToTableau(firstCard, prev.tableau[toIndex]);
      }

      if (!canMove) return prev;

      // Remove cards from source
      if (fromType === 'waste') {
        newState.waste = prev.waste.slice(0, -1);
      } else if (fromType === 'tableau' && fromIndex !== undefined) {
        newState.tableau = [...prev.tableau];
        if (cardIndex !== undefined) {
          newState.tableau[fromIndex] = prev.tableau[fromIndex].slice(0, cardIndex);
        } else {
          newState.tableau[fromIndex] = prev.tableau[fromIndex].slice(0, -1);
        }
        // Flip top card if needed
        const remainingCards = newState.tableau[fromIndex];
        if (remainingCards.length > 0 && !remainingCards[remainingCards.length - 1].faceUp) {
          remainingCards[remainingCards.length - 1].faceUp = true;
        }
      } else if (fromType === 'foundation' && fromIndex !== undefined) {
        newState.foundations = [...prev.foundations];
        newState.foundations[fromIndex] = prev.foundations[fromIndex].slice(0, -1);
      }

      // Add cards to destination
      if (toType === 'foundation' && toIndex !== undefined) {
        newState.foundations = [...newState.foundations];
        newState.foundations[toIndex] = [...prev.foundations[toIndex], ...cardsToMove];
        newState.score = prev.score + 10;
      } else if (toType === 'tableau' && toIndex !== undefined) {
        newState.tableau = [...newState.tableau];
        newState.tableau[toIndex] = [...prev.tableau[toIndex], ...cardsToMove];
        if (fromType === 'waste') {
          newState.score = prev.score + 5;
        }
      }

      newState.moves = prev.moves + 1;
      newState.selectedCard = null;
      newState.selectedPile = null;

      // Check for win condition
      const totalFoundationCards = newState.foundations.reduce((sum, foundation) => sum + foundation.length, 0);
      if (totalFoundationCards === 52) {
        newState.isWon = true;
        newState.score = prev.score + 1000;
        toast.success("Congratulations! You won!", {
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
        return { ...prev, selectedCard: null, selectedPile: null };
      }
      return { 
        ...prev, 
        selectedCard: card, 
        selectedPile: { type: pileType, index: pileIndex },
        cardIndex 
      } as any;
    });
  }, []);

  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      deck: createDeck(),
      waste: [],
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], []],
      selectedCard: null,
      selectedPile: null,
      moves: 0,
      score: 0,
      time: 0,
      isWon: false,
    }));
    dealCards();
  }, [createDeck, dealCards]);

  // Timer effect
  useEffect(() => {
    if (gameState.isWon) return;
    
    const timer = setInterval(() => {
      setGameState(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isWon]);

  // Initialize game on first load
  useEffect(() => {
    dealCards();
  }, [dealCards]);

  return {
    gameState,
    dealCards,
    drawFromDeck,
    moveCard,
    selectCard,
    restartGame,
  };
};