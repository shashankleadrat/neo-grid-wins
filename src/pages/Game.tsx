import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameBoard from "@/components/GameBoard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Home, User, History } from "lucide-react";

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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
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
        body: { board: currentBoard }
      });

      if (error) throw error;
      return data.move;
    } catch (error: any) {
      console.error('AI move error:', error);
      toast({
        title: "AI Error",
        description: "Failed to get AI move. Making random move.",
        variant: "destructive",
      });
      // Fallback to random move
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
      await supabase.from('moves').insert({
        game_id: gameId,
        move_number: moveNumber,
        position,
        symbol,
      });
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
        opponent_type: 'ai',
        winner: gameWinner,
        player_symbol: 'X',
        board_state: finalBoard,
      }).select().single();

      if (error) throw error;
      setGameId(data.id);
    } catch (error: any) {
      console.error('Error saving game:', error);
      toast({
        title: "Error",
        description: "Failed to save game",
        variant: "destructive",
      });
    }
  };

  const handleCellClick = async (index: number) => {
    if (board[index] || winner || isAiThinking) return;

    const newBoard = [...board];
    const currentSymbol = isXNext ? 'X' : 'O';
    newBoard[index] = currentSymbol;
    setBoard(newBoard);

    await saveMove(index, currentSymbol);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      await saveGame(newBoard, result.winner);
      toast({
        title: result.winner === 'X' ? "You Win!" : "AI Wins!",
        description: result.winner === 'X' ? "Congratulations!" : "Better luck next time!",
      });
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      setWinner('draw');
      await saveGame(newBoard, 'draw');
      toast({
        title: "Draw!",
        description: "It's a tie!",
      });
      return;
    }

    // AI's turn
    setIsXNext(false);
    setTimeout(async () => {
      const aiMoveIndex = await getAiMove(newBoard);
      const aiBoard = [...newBoard];
      aiBoard[aiMoveIndex] = 'O';
      setBoard(aiBoard);

      await saveMove(aiMoveIndex, 'O');

      const aiResult = calculateWinner(aiBoard);
      if (aiResult) {
        setWinner(aiResult.winner);
        setWinningLine(aiResult.line);
        await saveGame(aiBoard, aiResult.winner);
        toast({
          title: "AI Wins!",
          description: "Better luck next time!",
        });
        return;
      }

      if (aiBoard.every(cell => cell !== null)) {
        setWinner('draw');
        await saveGame(aiBoard, 'draw');
        toast({
          title: "Draw!",
          description: "It's a tie!",
        });
        return;
      }

      setIsXNext(true);
    }, 500);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setGameId(null);
    setMoveNumber(0);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tic Tac Toe
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <Home />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/history")}>
              <History />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/profile")}>
              <User />
            </Button>
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center space-y-2">
          {winner ? (
            <p className="text-2xl font-semibold">
              {winner === 'draw' ? "It's a Draw!" : `${winner === 'X' ? 'You Win!' : 'AI Wins!'}`}
            </p>
          ) : (
            <p className="text-2xl font-semibold">
              {isAiThinking ? "AI is thinking..." : isXNext ? "Your Turn (X)" : "AI's Turn (O)"}
            </p>
          )}
        </div>

        {/* Game Board */}
        <GameBoard
          board={board}
          onCellClick={handleCellClick}
          disabled={!isXNext || winner !== null || isAiThinking}
          winningLine={winningLine}
        />

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button variant="hero" size="lg" onClick={resetGame}>
            <RotateCcw className="mr-2" />
            New Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Game;
