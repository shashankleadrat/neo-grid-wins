import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameBoard from "@/components/GameBoard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Home, User, Users, Bot, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import VictoryModal from "@/components/VictoryModal";
import MoveLog from "@/components/MoveLog";
import RoomModal from "@/components/RoomModal";
import ReplayControls from "@/components/ReplayControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GameMode = 'single' | 'local' | 'multiplayer';

const Game = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [moves, setMoves] = useState<any[]>([]);
  const [lastMovePosition, setLastMovePosition] = useState<number | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O'>('X');
  const [replayMode, setReplayMode] = useState(false);
  const [replayMoveIndex, setReplayMoveIndex] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Realtime subscription for multiplayer
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !gameId) return;

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const move = payload.new as any;
            handleOpponentMove(move);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, gameMode]);

  // Replay auto-play
  useEffect(() => {
    if (!isReplayPlaying || replayMoveIndex >= moves.length) {
      setIsReplayPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setReplayMoveIndex(replayMoveIndex + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isReplayPlaying, replayMoveIndex, moves.length]);

  // Update board based on replay
  useEffect(() => {
    if (replayMode) {
      const replayBoard = Array(9).fill(null);
      for (let i = 0; i < replayMoveIndex; i++) {
        const move = moves[i];
        replayBoard[move.position] = move.symbol;
      }
      setBoard(replayBoard);
    }
  }, [replayMoveIndex, replayMode, moves]);

  const handleOpponentMove = (move: any) => {
    if (move.symbol === playerSymbol) return;

    const newBoard = [...board];
    newBoard[move.position] = move.symbol;
    setBoard(newBoard);
    setLastMovePosition(move.position);
    setMoves([...moves, move]);
    setIsXNext(playerSymbol === 'X');

    checkGameEnd(newBoard);
  };

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  const getAiMove = async (currentBoard: (string | null)[]) => {
    try {
      setIsAiThinking(true);
      const { data, error } = await supabase.functions.invoke('ai-move', {
        body: { board: currentBoard, difficulty }
      });

      if (error) throw error;
      return data.move;
    } catch (error: any) {
      console.error('AI move error:', error);
      const emptyIndices = currentBoard
        .map((val, idx) => val === null ? idx : -1)
        .filter(idx => idx !== -1);
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } finally {
      setIsAiThinking(false);
    }
  };

  const saveMove = async (position: number, symbol: string) => {
    if (!gameId || !user) return;

    try {
      const { data } = await supabase.from('moves').insert({
        game_id: gameId,
        move_number: moveNumber,
        position,
        symbol,
      }).select().single();
      
      if (data) {
        setMoves([...moves, data]);
      }
      setMoveNumber(moveNumber + 1);
    } catch (error: any) {
      console.error('Error saving move:', error);
    }
  };

  const saveGame = async (finalBoard: (string | null)[], gameWinner: string | null) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('games').insert({
        player_id: user.id,
        opponent_type: gameMode === 'single' ? 'ai' : gameMode === 'local' ? 'local' : 'human',
        winner: gameWinner,
        player_symbol: playerSymbol,
        board_state: finalBoard,
        difficulty: gameMode === 'single' ? difficulty : null,
        room_code: roomCode,
      }).select().single();

      if (error) throw error;
      setGameId(data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error saving game:', error);
    }
  };

  const checkGameEnd = (newBoard: (string | null)[]) => {
    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setShowVictoryModal(true);
      saveGame(newBoard, result.winner);
      return true;
    }

    if (newBoard.every(cell => cell !== null)) {
      setWinner('draw');
      setShowVictoryModal(true);
      saveGame(newBoard, 'draw');
      return true;
    }
    return false;
  };

  const handleCellClick = async (index: number) => {
    if (board[index] || winner || replayMode) return;

    if (gameMode === 'single' && (!isXNext || isAiThinking)) return;
    if (gameMode === 'multiplayer' && (isXNext ? 'X' : 'O') !== playerSymbol) return;

    const newBoard = [...board];
    const currentSymbol = isXNext ? 'X' : 'O';
    newBoard[index] = currentSymbol;
    setBoard(newBoard);
    setLastMovePosition(index);

    await saveMove(index, currentSymbol);

    if (checkGameEnd(newBoard)) return;

    // Single player AI turn
    if (gameMode === 'single') {
      setIsXNext(false);
      setTimeout(async () => {
        const aiMoveIndex = await getAiMove(newBoard);
        const aiBoard = [...newBoard];
        aiBoard[aiMoveIndex] = 'O';
        setBoard(aiBoard);
        setLastMovePosition(aiMoveIndex);

        await saveMove(aiMoveIndex, 'O');
        checkGameEnd(aiBoard);
        setIsXNext(true);
      }, 500);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setGameId(null);
    setMoveNumber(0);
    setMoves([]);
    setLastMovePosition(null);
    setRoomCode(null);
    setIsWaitingForOpponent(false);
    setReplayMode(false);
    setReplayMoveIndex(0);
    setIsReplayPlaying(false);
  };

  const createMultiplayerRoom = async () => {
    if (!user) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGameId = await saveGame(Array(9).fill(null), null);

    await supabase.from('games').update({ room_code: code }).eq('id', newGameId);

    setRoomCode(code);
    setGameId(newGameId);
    setIsWaitingForOpponent(true);
    setPlayerSymbol('X');
  };

  const joinMultiplayerRoom = async (code: string) => {
    if (!user) return;

    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', code)
      .is('opponent_id', null)
      .single();

    if (!game) {
      toast({
        title: "Error",
        description: "Room not found",
        variant: "destructive",
      });
      return;
    }

    await supabase.from('games').update({ opponent_id: user.id }).eq('id', game.id);

    setRoomCode(code);
    setGameId(game.id);
    setPlayerSymbol('O');
    setShowRoomModal(false);
  };

  const enterReplayMode = () => {
    setReplayMode(true);
    setReplayMoveIndex(0);
    setBoard(Array(9).fill(null));
  };

  const exitReplayMode = () => {
    setReplayMode(false);
    setReplayMoveIndex(moves.length);
    const finalBoard = Array(9).fill(null);
    moves.forEach(move => {
      finalBoard[move.position] = move.symbol;
    });
    setBoard(finalBoard);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Tic Tac Toe</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <Home />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <User />
            </Button>
          </div>
        </div>

        {!gameId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={gameMode === 'single' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setGameMode('single');
                resetGame();
              }}
              className="h-24"
            >
              <div className="flex flex-col items-center gap-2">
                <Bot size={32} />
                <span>vs AI</span>
              </div>
            </Button>

            <Button
              variant={gameMode === 'local' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setGameMode('local');
                resetGame();
              }}
              className="h-24"
            >
              <div className="flex flex-col items-center gap-2">
                <UserCheck size={32} />
                <span>Local 2P</span>
              </div>
            </Button>

            <Button
              variant={gameMode === 'multiplayer' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setGameMode('multiplayer');
                setShowRoomModal(true);
              }}
              className="h-24"
            >
              <div className="flex flex-col items-center gap-2">
                <Users size={32} />
                <span>Online</span>
              </div>
            </Button>
          </div>
        )}

        {gameMode === 'single' && !gameId && (
          <div className="flex justify-center">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-center space-y-2">
          {winner ? (
            <p className="text-2xl font-semibold">
              {winner === 'draw' ? "It's a Draw!" : `${winner} Wins!`}
            </p>
          ) : replayMode ? (
            <p className="text-2xl font-semibold">Replay Mode</p>
          ) : (
            <p className="text-2xl font-semibold">
              {isAiThinking ? "AI is thinking..." : 
               gameMode === 'multiplayer' ? `${isXNext ? 'X' : 'O'}'s Turn` :
               gameMode === 'local' ? `Player ${isXNext ? 'X' : 'O'}'s Turn` :
               isXNext ? "Your Turn (X)" : "AI's Turn (O)"}
            </p>
          )}
        </div>

        <GameBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={winner !== null || isAiThinking || replayMode}
          winningLine={winningLine}
          lastMovePosition={lastMovePosition}
        />

        <div className="flex justify-center gap-4">
          {!replayMode ? (
            <>
              <Button variant="hero" size="lg" onClick={resetGame}>
                <RotateCcw className="mr-2" />
                New Game
              </Button>
              {winner && moves.length > 0 && (
                <Button variant="outline" size="lg" onClick={enterReplayMode}>
                  Watch Replay
                </Button>
              )}
            </>
          ) : (
            <Button variant="hero" size="lg" onClick={exitReplayMode}>
              Exit Replay
            </Button>
          )}
        </div>

        {moves.length > 0 && <MoveLog moves={moves} />}

        {replayMode && (
          <ReplayControls
            currentMove={replayMoveIndex}
            totalMoves={moves.length}
            isPlaying={isReplayPlaying}
            onMoveChange={setReplayMoveIndex}
            onPlayPause={() => setIsReplayPlaying(!isReplayPlaying)}
            onStepBack={() => setReplayMoveIndex(Math.max(0, replayMoveIndex - 1))}
            onStepForward={() => setReplayMoveIndex(Math.min(moves.length, replayMoveIndex + 1))}
          />
        )}

        <VictoryModal
          isOpen={showVictoryModal}
          winner={winner}
          onClose={() => setShowVictoryModal(false)}
          onPlayAgain={() => {
            setShowVictoryModal(false);
            resetGame();
          }}
        />

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          onCreateRoom={createMultiplayerRoom}
          onJoinRoom={joinMultiplayerRoom}
          roomCode={roomCode || undefined}
          isWaiting={isWaitingForOpponent}
        />
      </motion.div>
    </div>
  );
};

export default Game;
