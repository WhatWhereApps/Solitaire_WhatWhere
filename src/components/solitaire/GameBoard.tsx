import { Card } from './Card';
import { Card as CardType, GameState } from '@/types/solitaire';
import { cn } from '@/lib/utils';
import { CardBackDesign, HandPreference } from '@/hooks/useGameSettings';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: any, pileType: string, pileIndex?: number, cardIndex?: number) => void;
  onEmptyPileClick: (pileType: string, pileIndex?: number) => void;
  onDeckClick: () => void;
  onPointerDragStart: (e: React.PointerEvent, card: CardType, pileType: string, pileIndex?: number, cardIndex?: number) => void;
  dragState: {
    isDragging: boolean;
    dragCard: any;
    dragSource: { type: string; index?: number; cardIndex?: number } | null;
  };
  cardBackDesign?: CardBackDesign;
  handPreference?: HandPreference;
  wasteCard: CardType | null;
  deckHasCards: boolean;
  atEnd: boolean;
  selectedCardId?: string | null;
}

export const GameBoard = ({
  gameState,
  onCardClick,
  onEmptyPileClick,
  onDeckClick,
  onPointerDragStart,
  dragState,
  cardBackDesign = 'classic-blue',
  handPreference = 'right',
  wasteCard,
  deckHasCards,
  atEnd,
  selectedCardId = null,
}: GameBoardProps) => {
  const { foundations, tableau } = gameState;
  const isRightHand = handPreference === 'right';

  const FoundationsPile = () => (
    <div className={cn("flex gap-1 sm:gap-2 lg:gap-4", isRightHand ? "order-1" : "order-2 ml-4 sm:ml-6")}>
      {foundations.map((foundation, index) => (
        <div
          key={index}
          data-drop-type="foundation"
          data-drop-index={index}
          className={cn(
            "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border cursor-pointer transition-colors duration-150 relative hover:bg-muted/50",
            dragState.isDragging && "border-card-highlight bg-muted/20"
          )}
          onClick={() => onEmptyPileClick('foundation', index)}
        >
          {foundation.length > 0 ? (
            <Card
              card={foundation[foundation.length - 1]}
              onClick={() => onCardClick(foundation[foundation.length - 1], 'foundation', index)}
              onPointerDragStart={(e) => onPointerDragStart(e, foundation[foundation.length - 1], 'foundation', index)}
              isSelected={false}
              isSelectable={true}
              isDragging={dragState.isDragging && dragState.dragCard?.id === foundation[foundation.length - 1]?.id}
              cardBackDesign={cardBackDesign}
            />
          ) : (
            <div className="w-full h-full bg-game-felt-light rounded-lg flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">A</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const DeckWastePile = () => (
    <div className={cn("flex gap-1 sm:gap-2 lg:gap-4", isRightHand ? "order-2 ml-4 sm:ml-6" : "order-1")}>
      {!isRightHand && <DeckPile />}

      <div
        className="w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border relative"
      >
        {wasteCard ? (
          <Card
            card={{ ...wasteCard, faceUp: true }}
            onClick={() => onCardClick(wasteCard, 'waste')}
            onPointerDragStart={(e) => onPointerDragStart(e, wasteCard, 'waste')}
            isSelected={selectedCardId === wasteCard.id}
            isSelectable={true}
            isDragging={dragState.isDragging && dragState.dragCard?.id === wasteCard.id}
            cardBackDesign={cardBackDesign}
          />
        ) : (
          <div className="w-full h-full bg-game-felt-light rounded-lg" />
        )}
      </div>

      {isRightHand && <DeckPile />}
    </div>
  );

  const DeckPile = () => (
    <div
      className={cn(
        "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed",
        deckHasCards
          ? "border-transparent cursor-pointer"
          : "border-border bg-game-felt-light hover:bg-muted/50 cursor-pointer"
      )}
      onClick={onDeckClick}
    >
      {deckHasCards ? (
        <Card
          card={{ id: 'deck-back', suit: 'spades', rank: 'A', faceUp: false, color: 'black' }}
          isSelectable={false}
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
      <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 sm:gap-4">
        <FoundationsPile />
        <DeckWastePile />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-7 gap-px sm:gap-1 lg:gap-2 justify-center w-full">
        {tableau.map((pile, pileIndex) => (
          <div
            key={pileIndex}
            data-drop-type="tableau"
            data-drop-index={pileIndex}
            className={cn(
              "flex flex-col relative overflow-hidden rounded-lg transition-colors duration-150",
              dragState.isDragging && "bg-muted/10"
            )}
          >
            {pile.length === 0 && (
              <div
                className={cn(
                  "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50",
                  dragState.isDragging && "border-card-highlight bg-muted/20"
                )}
                onClick={() => onEmptyPileClick('tableau', pileIndex)}
              >
                <div className="w-full h-full bg-game-felt-light rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">K</span>
                  </div>
                </div>
              </div>
            )}

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
                  onPointerDragStart={canSelect ? (e) => onPointerDragStart(e, card, 'tableau', pileIndex, cardIndex) : undefined}
                  isSelected={selectedCardId === card.id}
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
