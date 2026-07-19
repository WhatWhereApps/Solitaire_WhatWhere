export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  color: 'red' | 'black';
}

/**
 * Linear (singly) linked-list node. Used for both the face-down deck
 * and the face-up waste. `next` points toward the bottom of the stack;
 * the list head is always the top card (next to interact with).
 */
export interface DrawPileNode {
  card: Card;
  next: DrawPileNode | null;
}

/**
 * Draw pile as two linear linked lists:
 *  - deck:  face-down cards, head = top card ready to be drawn
 *  - waste: face-up cards,   head = currently visible waste card
 * When the deck runs out, the waste is reversed back into the deck.
 */
export interface DrawPileState {
  deck: DrawPileNode | null;
  waste: DrawPileNode | null;
}

export interface GameState {
  drawPile: DrawPileState;
  foundations: Card[][];
  tableau: Card[][];
  selectedCard: Card | null;
  selectedPile: { type: string; index?: number } | null;
  cardIndex?: number;
  moves: number;
  score: number;
  time: number;
  isWon: boolean;
}

export type PileType = 'deck' | 'waste' | 'foundation' | 'tableau';
