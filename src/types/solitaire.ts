export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  color: 'red' | 'black';
}

// Linked list node for draw pile
export interface DrawPileNode {
  card: Card | null; // null represents empty position (start/end)
  next: DrawPileNode | null;
}

// Draw pile state - cycles through a linked list
export interface DrawPileState {
  head: DrawPileNode; // Start of list (always empty)
  current: DrawPileNode; // Current position in the cycle
  tail: DrawPileNode; // End of list (always empty)
}

export interface GameState {
  drawPile: DrawPileState;
  foundations: Card[][];
  tableau: Card[][];
  selectedCard: Card | null;
  selectedPile: { type: string; index?: number } | null;
  cardIndex?: number; // Index of selected card within its pile
  moves: number;
  score: number;
  time: number;
  isWon: boolean;
}

export type PileType = 'deck' | 'waste' | 'foundation' | 'tableau';