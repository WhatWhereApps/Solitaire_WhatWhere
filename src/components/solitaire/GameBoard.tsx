import { Card } from './Card';
import { Card as CardType, GameState } from '@/types/solitaire';
import { cn } from '@/lib/utils';
import { CardBackDesign, HandPreference } from '@/hooks/useGameSettings';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: any, pileType: string, pileIndex?: number, cardIndex?: number) => void;
  onEmptyPileClick: (pileType: string, pileIndex?: number) => void;
  onDeckClick: () => void;
  onCardDrop: (pileType: string, pileIndex?: number) => void;
  onDragStart: (card: any, pileType: string, pileIndex?: number, cardIndex?: number) => void;
  onDragEnd: () => void;
  dragState: {
    isDragging: boolean;
    dragCard: any;
    dragSource: { type: string; index?: number; cardIndex?: number } | null;
  };
  cardBackDesign?: CardBackDesign;
  handPreference?: HandPreference;
  // Draw pile state from linked list
  wasteCard: CardType | null;
  deckHasCards: boolean;
  atEnd: boolean;
}

export const GameBoard = ({ 
  gameState, 
  onCardClick, 
  onEmptyPileClick, 
  onDeckClick, 
  onCardDrop, 
  onDragStart, 
  onDragEnd, 
  dragState,
  cardBackDesign = 'classic-blue',
  handPreference = 'right',
  wasteCard,
  deckHasCards,
  atEnd,
}: GameBoardProps) => {
  const { foundations, tableau } = gameState;

  // For right-hand: foundations left, deck right
  // For left-hand: deck left, foundations right
  const isRightHand = handPreference === 'right';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, pileType: string, pileIndex?: number) => {
    console.log('GameBoard handleDrop called', { pileType, pileIndex });
    e.preventDefault();
    onCardDrop(pileType, pileIndex);
  };

  // Foundations component
  const FoundationsPile = () => (
    <div className={cn("flex gap-1 sm:gap-2 lg:gap-4", isRightHand ? "order-1" : "order-2 ml-4 sm:ml-6")}>
      {foundations.map((foundation, index) => (
        <div
          key={index}
          className={cn(
            "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border cursor-pointer transition-all duration-300 relative hover:bg-muted/50",
            dragState.isDragging && "hover:border-card-highlight hover:bg-muted/20"
          )}
          onClick={() => onEmptyPileClick('foundation', index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'foundation', index)}
        >
          {foundation.length > 0 ? (
            <Card
              card={foundation[foundation.length - 1]}
              onClick={() => onCardClick(foundation[foundation.length - 1], 'foundation', index)}
              onDragStart={(e) => onDragStart(foundation[foundation.length - 1], 'foundation', index)}
              onDragEnd={onDragEnd}
              isSelected={false}
              isSelectable={true}
              isDragging={dragState.isDragging && dragState.dragCard?.id === foundation[foundation.length - 1]?.id}
              cardBackDesign={cardBackDesign}
            />
          ) : (
            <div className="w-full h-full bg-game-felt-light rounded-lg flex items-center justify-center">
              <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">A</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Deck and Waste component
  const DeckWastePile = () => (
    <div className={cn("flex gap-1 sm:gap-2 lg:gap-4", isRightHand ? "order-2 ml-4 sm:ml-6" : "order-1")}>
      {/* Deck - on left for left-hand users */}
      {!isRightHand && <DeckPile />}
      
      {/* Waste - shows the current visible card from the linked list */}
      <div 
        className={cn(
          "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border relative transition-all duration-300",
          dragState.isDragging && "hover:border-card-highlight hover:bg-muted/20"
        )}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'waste')}
      >
        {wasteCard ? (
          <Card
            card={{ ...wasteCard, faceUp: true }}
            onClick={() => onCardClick(wasteCard, 'waste')}
            onDragStart={(e) => onDragStart(wasteCard, 'waste')}
            onDragEnd={onDragEnd}
            isSelected={false}
            isSelectable={true}
            isDragging={dragState.isDragging && dragState.dragCard?.id === wasteCard.id}
            cardBackDesign={cardBackDesign}
          />
        ) : (
          <div className="w-full h-full bg-game-felt-light rounded-lg" />
        )}
      </div>

      {/* Deck - on right for right-hand users */}
      {isRightHand && <DeckPile />}
    </div>
  );

  // Deck pile component - shows card back if cards remain, reset icon if at end
  const DeckPile = () => (
    <div
      className={cn(
        "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed transition-all duration-300",
        deckHasCards
          ? "border-transparent cursor-pointer"
          : atEnd
            ? "border-border bg-game-felt-light hover:bg-muted/50 cursor-pointer"
            : "border-border bg-game-felt-light hover:bg-muted/50 cursor-pointer"
      )}
      onClick={onDeckClick}
    >
      {deckHasCards ? (
        <Card
          card={{ id: 'deck-back', suit: 'spades', rank: 'A', faceUp: false, color: 'black' }}
          isSelectable={true}
          cardBackDesign={cardBackDesign}
        />
      ) : atEnd ? (
        <div className="w-full h-full bg-game-felt-light rounded-lg flex items-center justify-center">
          <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">↻</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-game-felt-light rounded-lg" />
      )}
    </div>
  );

  return (
    <div className="w-full h-full mx-auto flex flex-col gap-3 sm:gap-4 lg:gap-6 px-1 sm:px-2 lg:px-4">
      {/* Top Row: Layout changes based on hand preference */}
      <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 sm:gap-4">
        <FoundationsPile />
        <DeckWastePile />
      </div>

      {/* Bottom Row: Tableau */}
      <div className="flex-1 min-h-0 grid grid-cols-7 gap-px sm:gap-1 lg:gap-2 justify-center w-full">
        {tableau.map((pile, pileIndex) => (
          <div 
            key={pileIndex} 
            className={cn(
              "flex flex-col relative overflow-hidden transition-all duration-300",
              dragState.isDragging && "hover:bg-muted/10 rounded-lg"
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'tableau', pileIndex)}
          >
            {/* Empty pile placeholder */}
            {pile.length === 0 && (
              <div
                className={cn(
                  "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border cursor-pointer transition-all duration-300 hover:bg-muted/50",
                  dragState.isDragging && "hover:border-card-highlight hover:bg-muted/20"
                )}
                onClick={() => onEmptyPileClick('tableau', pileIndex)}
              >
                <div className="w-full h-full bg-game-felt-light rounded-lg flex items-center justify-center">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">K</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cards in pile */}
            {pile.map((card, cardIndex) => {
              const isLastCard = cardIndex === pile.length - 1;
              const canSelect = card.faceUp && (
                isLastCard || 
                pile.slice(cardIndex).every(c => c.faceUp)
              );
              const isDragging = dragState.isDragging && dragState.dragCard?.id === card.id;

              return (
                <Card
                  key={card.id}
                  card={card}
                  onClick={canSelect ? () => onCardClick(card, 'tableau', pileIndex, cardIndex) : undefined}
                  onDragStart={canSelect ? (e) => onDragStart(card, 'tableau', pileIndex, cardIndex) : undefined}
                  onDragEnd={onDragEnd}
                  isSelected={false}
                  isSelectable={canSelect}
                  isDragging={isDragging}
                  cardBackDesign={cardBackDesign}
                  style={{
                    marginTop: cardIndex > 0 ? '-38px' : '0',
                    zIndex: cardIndex,
                  }}
                  className={cn(
                    "relative",
                    canSelect && "hover:translate-y-[-2px]",
                    !isLastCard && card.faceUp && "hover:translate-y-[-4px]"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
