import { useState, useCallback, useEffect } from 'react';
import { Card, GameState, Suit, Rank, DrawPileNode, DrawPileState } from '@/types/solitaire';
import { toast } from 'sonner';

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Helper to create the linked list for draw pile
const createDrawPileList = (cards: Card[]): DrawPileState => {
  // Create empty head node
  const head: DrawPileNode = { card: null, next: null };
  
  // Build the list
  let current = head;
  for (const card of cards) {
    const node: DrawPileNode = { card: { ...card, faceUp: false }, next: null };
    current.next = node;
    current = node;
  }
  
  // Create empty tail node
  const tail: DrawPileNode = { card: null, next: null };
  current.next = tail;
  
  // Make it circular: tail points back to head
  tail.next = head;
  
  return {
    head,
    current: head, // Start at head (empty - shows deck is ready)
    tail,
  };
};

// Get the visible card in the waste (the card after current position)
const getWasteCard = (drawPile: DrawPileState): Card | null => {
  if (drawPile.current === drawPile.head) {
    return null; // At start, no card drawn yet
  }
  // Current position's card is the visible waste card - always face up
  const card = drawPile.current.card;
  return card ? { ...card, faceUp: true } : null;
};

// Check if deck has cards remaining to draw
const hasDeckCards = (drawPile: DrawPileState): boolean => {
  // If we're at tail, no more cards to draw
  if (drawPile.current === drawPile.tail) {
    return false;
  }
  // Check if next node has a card
  return drawPile.current.next !== null && drawPile.current.next !== drawPile.tail;
};

// Check if we're at the end (can reset)
const isAtEnd = (drawPile: DrawPileState): boolean => {
  return drawPile.current === drawPile.tail;
};

// Check if we're at the start
const isAtStart = (drawPile: DrawPileState): boolean => {
  return drawPile.current === drawPile.head;
};

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const emptyHead: DrawPileNode = { card: null, next: null };
    const emptyTail: DrawPileNode = { card: null, next: emptyHead };
    emptyHead.next = emptyTail;
    
    return {
      drawPile: { head: emptyHead, current: emptyHead, tail: emptyTail },
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], []],
      selectedCard: null,
      selectedPile: null,
      moves: 0,
      score: 0,
      time: 0,
      isWon: false,
    };
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

    // Remaining cards go to draw pile as linked list
    const drawPile = createDrawPileList(deck);

    setGameState({
      drawPile,
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
      const { drawPile } = prev;
      
      if (isAtEnd(drawPile)) {
        // At tail (end), reset to head (start)
        return {
          ...prev,
          drawPile: {
            ...drawPile,
            current: drawPile.head,
          },
          moves: prev.moves + 1,
        };
      } else {
        // Move to next node
        const nextNode = drawPile.current.next;
        if (!nextNode) return prev;
        
        return {
          ...prev,
          drawPile: {
            ...drawPile,
            current: nextNode,
          },
          moves: prev.moves + 1,
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

  // Remove a card from the draw pile linked list
  const removeCardFromDrawPile = (drawPile: DrawPileState, cardId: string): DrawPileState => {
    // We need to rebuild the list to avoid mutation issues
    // First, collect all remaining cards
    const remainingCards: Card[] = [];
    let node = drawPile.head.next;
    let currentIndex = -1;
    let index = 0;
    
    while (node && node !== drawPile.tail) {
      if (node.card && node.card.id !== cardId) {
        remainingCards.push(node.card);
      }
      if (node === drawPile.current) {
        currentIndex = index;
      }
      if (node.card?.id === cardId && node === drawPile.current) {
        // We're removing the current card, move index back
        currentIndex = Math.max(0, index - 1);
      }
      index++;
      node = node.next;
    }
    
    // Rebuild the list
    const newHead: DrawPileNode = { card: null, next: null };
    let currentNode = newHead;
    let newCurrent = newHead;
    let nodeIndex = 0;
    
    for (const card of remainingCards) {
      const newNode: DrawPileNode = { card, next: null };
      currentNode.next = newNode;
      currentNode = newNode;
      
      // Set new current position (keeping same logical position)
      if (nodeIndex === currentIndex - 1) {
        newCurrent = newNode;
      }
      nodeIndex++;
    }
    
    const newTail: DrawPileNode = { card: null, next: null };
    currentNode.next = newTail;
    newTail.next = newHead;
    
    // If current was at head position, stay at head
    if (currentIndex <= 0) {
      newCurrent = newHead;
    }
    
    return {
      head: newHead,
      current: newCurrent,
      tail: newTail,
    };
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
        const wasteCard = getWasteCard(prev.drawPile);
        if (!wasteCard) return prev;
        cardsToMove = [wasteCard];
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
        // Remove card from the linked list
        newState.drawPile = removeCardFromDrawPile(prev.drawPile, cardsToMove[0].id);
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
    dealCards();
  }, [dealCards]);

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

  // Computed values for components to use
  const wasteCard = getWasteCard(gameState.drawPile);
  const deckHasCards = hasDeckCards(gameState.drawPile);
  const atEnd = isAtEnd(gameState.drawPile);
  const atStart = isAtStart(gameState.drawPile);

  return {
    gameState,
    dealCards,
    drawFromDeck,
    moveCard,
    selectCard,
    restartGame,
    // New helpers for draw pile
    wasteCard,
    deckHasCards,
    atEnd,
    atStart,
  };
};
