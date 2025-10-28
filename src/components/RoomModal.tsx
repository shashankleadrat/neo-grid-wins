import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  roomCode?: string;
  isWaiting?: boolean;
}

const RoomModal = ({ isOpen, onClose, onCreateRoom, onJoinRoom, roomCode, isWaiting }: RoomModalProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-card p-8 rounded-3xl neumorphic max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">Multiplayer Game</h2>

            {roomCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Room Code</p>
                  <div className="flex items-center gap-2 justify-center">
                    <p className="text-4xl font-bold tracking-wider">{roomCode}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </Button>
                  </div>
                </div>
                {isWaiting && (
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-center text-muted-foreground"
                  >
                    Waiting for opponent to join...
                  </motion.p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <Button
                  onClick={onCreateRoom}
                  className="w-full"
                  size="lg"
                >
                  Create New Room
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-2xl tracking-wider"
                  />
                  <Button
                    onClick={() => {
                      if (joinCode.length === 6) {
                        onJoinRoom(joinCode);
                      }
                    }}
                    disabled={joinCode.length !== 6}
                    className="w-full"
                    size="lg"
                  >
                    Join Room
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoomModal;
