import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Play, LogOut, Trophy, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: gamesData } = await supabase
        .from("games")
        .select("*")
        .eq("player_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (gamesData) {
        setGames(gamesData);
        
        // Create chart data
        const data = gamesData.reverse().map((game, index) => ({
          game: index + 1,
          wins: gamesData.slice(0, index + 1).filter(g => g.winner === game.player_symbol).length,
        }));
        setChartData(data);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalGames = profile.wins + profile.losses + profile.draws;
  const winRate = totalGames > 0 ? ((profile.wins / totalGames) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen p-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home size={20} />
            </Button>
            <Button onClick={() => navigate("/game")}>
              <Play size={20} className="mr-2" />
              Play
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 neumorphic">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Wins</p>
                  <p className="text-3xl font-bold">{profile.wins}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 neumorphic">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold">{winRate}%</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 neumorphic">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold">{profile.current_streak}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 neumorphic mb-8">
            <h2 className="text-2xl font-bold mb-4">Performance Trend</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="wins" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground">No games played yet</p>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 neumorphic">
            <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
            <div className="space-y-3">
              {games.length === 0 ? (
                <p className="text-center text-muted-foreground">No games played yet</p>
              ) : (
                games.map((game) => (
                  <div
                    key={game.id}
                    className="flex justify-between items-center p-4 rounded-lg bg-background/50"
                  >
                    <span className="font-semibold">
                      {game.opponent_type === 'ai' ? 'vs AI' : 'vs Player'}
                    </span>
                    <span className={`font-bold ${
                      game.winner === game.player_symbol
                        ? 'text-green-500'
                        : game.winner === 'draw'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {game.winner === game.player_symbol ? 'Win' : game.winner === 'draw' ? 'Draw' : 'Loss'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(game.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center"
        >
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut size={20} className="mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
