import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";

interface ReplayControlsProps {
  currentMove: number;
  totalMoves: number;
  isPlaying: boolean;
  onMoveChange: (move: number) => void;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

const ReplayControls = ({
  currentMove,
  totalMoves,
  isPlaying,
  onMoveChange,
  onPlayPause,
  onStepBack,
  onStepForward,
}: ReplayControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl neumorphic p-6 max-w-md mx-auto mt-6"
    >
      <h3 className="text-xl font-bold mb-4 text-center">Replay Controls</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground min-w-16">
            Move {currentMove} / {totalMoves}
          </span>
          <Slider
            value={[currentMove]}
            onValueChange={(value) => onMoveChange(value[0])}
            max={totalMoves}
            min={0}
            step={1}
            className="flex-1"
          />
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onStepBack}
            disabled={currentMove === 0}
          >
            <SkipBack size={20} />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={onPlayPause}
            disabled={totalMoves === 0}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onStepForward}
            disabled={currentMove === totalMoves}
          >
            <SkipForward size={20} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReplayControls;
