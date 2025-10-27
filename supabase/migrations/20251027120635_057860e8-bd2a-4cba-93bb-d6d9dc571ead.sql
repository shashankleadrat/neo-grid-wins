-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create games table for game history
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_type TEXT NOT NULL CHECK (opponent_type IN ('ai', 'human')),
  opponent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner TEXT CHECK (winner IN ('X', 'O', 'draw')),
  player_symbol TEXT NOT NULL CHECK (player_symbol IN ('X', 'O')),
  board_state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Users can view own games"
  ON public.games FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can insert own games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Create moves table for game replay
CREATE TABLE public.moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 8),
  symbol TEXT NOT NULL CHECK (symbol IN ('X', 'O')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

-- Moves policies
CREATE POLICY "Users can view moves of their games"
  ON public.moves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = moves.game_id
      AND (games.player_id = auth.uid() OR games.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert moves for their games"
  ON public.moves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = moves.game_id
      AND games.player_id = auth.uid()
    )
  );

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile stats after game
CREATE OR REPLACE FUNCTION public.update_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update winner stats
  IF NEW.winner = NEW.player_symbol THEN
    UPDATE public.profiles
    SET 
      wins = wins + 1,
      current_streak = current_streak + 1,
      best_streak = GREATEST(best_streak, current_streak + 1),
      updated_at = NOW()
    WHERE id = NEW.player_id;
  -- Update loser stats
  ELSIF NEW.winner IS NOT NULL AND NEW.winner != 'draw' THEN
    UPDATE public.profiles
    SET 
      losses = losses + 1,
      current_streak = 0,
      updated_at = NOW()
    WHERE id = NEW.player_id;
  -- Update draw stats
  ELSIF NEW.winner = 'draw' THEN
    UPDATE public.profiles
    SET 
      draws = draws + 1,
      updated_at = NOW()
    WHERE id = NEW.player_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stats when game is created
CREATE TRIGGER on_game_completed
  AFTER INSERT ON public.games
  FOR EACH ROW
  WHEN (NEW.winner IS NOT NULL)
  EXECUTE FUNCTION public.update_player_stats();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();