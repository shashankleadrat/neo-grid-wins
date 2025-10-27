import { useEffect } from "react";

interface GameBoardProps {
  board: (string | null)[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  winningLine?: number[] | null;
}

const GameBoard = ({ board, onCellClick, disabled, winningLine }: GameBoardProps) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-card rounded-3xl neumorphic max-w-md mx-auto">
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
          className={`grid-cell ${cell?.toLowerCase() || ''} ${
            winningLine?.includes(index) ? 'bg-primary/10 border-primary' : ''
          } ${disabled || cell !== null ? 'cursor-not-allowed' : ''}`}
        >
          {cell && (
            <span className={`animate-scale-in ${
              cell === 'X' ? 'text-[hsl(var(--player-x))]' : 'text-[hsl(var(--player-o))]'
            }`}>
              {cell}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default GameBoard;
