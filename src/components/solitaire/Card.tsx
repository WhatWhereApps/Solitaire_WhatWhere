import { memo } from 'react';
import { Card as CardType } from '@/types/solitaire';
import { cn } from '@/lib/utils';
import { CardBackDesign, cardBackDesigns } from '@/hooks/useGameSettings';


interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDragStart?: (e?: React.DragEvent | React.TouchEvent) => void;
  onDragEnd?: (e?: React.DragEvent | React.TouchEvent) => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  isDragging?: boolean;
  style?: React.CSSProperties;
  className?: string;
  cardBackDesign?: CardBackDesign;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const CardComponent = ({ 
  card, 
  onClick, 
  onDragStart,
  onDragEnd,
  isSelected = false, 
  isSelectable = false,
  isDragging = false,
  style,
  className,
  cardBackDesign = 'classic-blue'
}: CardProps) => {

  const handleDragStart = (e: React.DragEvent) => {
    if (isSelectable && onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.id);
      onDragStart(e);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const backDesign = cardBackDesigns[cardBackDesign];

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 border-border cursor-pointer touch-manipulation select-none",
          "shadow-card transition-transform duration-150",

          "flex items-center justify-center relative overflow-hidden",
          isDragging && "opacity-50 scale-105",
          isSelectable && "hover:scale-105",
          className
        )}
        onClick={onClick}
        draggable={isSelectable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          ...style,
          background: `linear-gradient(to bottom right, hsl(var(--${backDesign.cssVar})), hsl(var(--${backDesign.cssVar}-light)))`,
        }}
      >
        <div 
          className="absolute inset-2 rounded border bg-black/10"
          style={{
            borderColor: `hsl(var(--${backDesign.cssVar}-light) / 0.3)`,
          }}
        />
        <div className="text-white/60 text-sm sm:text-base font-bold z-10">♠</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-12 h-18 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-32 rounded-lg border-2 cursor-pointer",
        "bg-card text-card-foreground shadow-card relative overflow-hidden transition-transform duration-200",
        "flex flex-col justify-between p-0.5 sm:p-1",
        isSelected && "border-card-highlight shadow-card-hover ring-2 ring-card-highlight",
        !isSelected && "border-border",
        isDragging && "opacity-50 scale-105",
        isSelectable && "hover:scale-105",
        card.color === 'red' && "text-card-red",
        card.color === 'black' && "text-card-black",
        className
      )}
      onClick={onClick}
      draggable={isSelectable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={style}
    >
      {/* Top left corner */}
      <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col items-center leading-none">
        <span className="text-sm sm:text-base lg:text-lg font-bold">{card.rank}</span>
        <span className="text-base sm:text-lg lg:text-xl">{suitSymbols[card.suit]}</span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className="text-sm sm:text-base lg:text-lg font-bold">{card.rank}</span>
        <span className="text-base sm:text-lg lg:text-xl">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};
