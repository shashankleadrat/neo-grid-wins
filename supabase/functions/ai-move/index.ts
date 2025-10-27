import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { board } = await req.json();

    // Simple minimax AI
    const findBestMove = (board: (string | null)[]) => {
      const checkWin = (squares: (string | null)[], player: string) => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return lines.some(([a,b,c]) => squares[a] === player && squares[b] === player && squares[c] === player);
      };

      // Try to win
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'O';
          if (checkWin(board, 'O')) {
            board[i] = null;
            return i;
          }
          board[i] = null;
        }
      }

      // Block player
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'X';
          if (checkWin(board, 'X')) {
            board[i] = null;
            return i;
          }
          board[i] = null;
        }
      }

      // Take center
      if (!board[4]) return 4;

      // Take corner
      const corners = [0, 2, 6, 8];
      const emptyCorners = corners.filter(i => !board[i]);
      if (emptyCorners.length) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];

      // Take any empty
      const empty = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
      return empty[Math.floor(Math.random() * empty.length)];
    };

    const move = findBestMove([...board]);

    return new Response(JSON.stringify({ move }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
