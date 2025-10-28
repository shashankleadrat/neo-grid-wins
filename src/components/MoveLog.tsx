import { motion } from "framer-motion";
import { ScrollArea } from "./ui/scroll-area";

interface Move {
  position: number;
  symbol: string;
  move_number: number;
}

interface MoveLogProps {
  moves: Move[];
}

const MoveLog = ({ moves }: MoveLogProps) => {
  const getRowCol = (position: number) => {
    const row = Math.floor(position / 3);
    const col = position % 3;
    return `(${row}, ${col})`;
  };

  return (
    <div className="bg-card rounded-3xl neumorphic p-4 max-w-md mx-auto mt-6">
      <h3 className="text-xl font-bold mb-4 text-center">Move History</h3>
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {moves.length === 0 ? (
            <p className="text-center text-muted-foreground">No moves yet</p>
          ) : (
            moves.map((move, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              >
                <span className="font-semibold">Move {move.move_number}</span>
                <span className={move.symbol === 'X' ? 'text-[hsl(var(--player-x))]' : 'text-[hsl(var(--player-o))]'}>
                  {move.symbol}
                </span>
                <span className="text-muted-foreground">{getRowCol(move.position)}</span>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoveLog;
