-- Add difficulty and room_code columns to games table
ALTER TABLE public.games
ADD COLUMN difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN room_code text UNIQUE;

-- Create index for room codes
CREATE INDEX idx_games_room_code ON public.games(room_code) WHERE room_code IS NOT NULL;

-- Update RLS policy to allow users to join games with room codes
CREATE POLICY "Users can view games they can join"
ON public.games
FOR SELECT
USING (
  auth.uid() = player_id 
  OR auth.uid() = opponent_id 
  OR (room_code IS NOT NULL AND winner IS NULL)
);

-- Allow users to update games they're part of (for multiplayer)
CREATE POLICY "Users can update their games"
ON public.games
FOR UPDATE
USING (auth.uid() = player_id OR auth.uid() = opponent_id);

-- Enable realtime for games and moves tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;