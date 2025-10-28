import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Trophy, Medal, Award } from "lucide-react";
import { motion } from "framer-motion";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("wins", { ascending: false })
        .limit(20);

      if (data) {
        const playersWithStats = data.map(player => ({
          ...player,
          totalGames: player.wins + player.losses + player.draws,
          winRate: player.wins + player.losses + player.draws > 0
            ? ((player.wins / (player.wins + player.losses + player.draws)) * 100).toFixed(1)
            : 0,
        })).filter(p => p.totalGames > 0);

        setPlayers(playersWithStats);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />;
      case 1:
        return <Medal className="text-gray-400" size={24} />;
      case 2:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home size={20} />
          </Button>
        </div>

        <Card className="p-6 neumorphic">
          <div className="space-y-3">
            {players.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No players yet</p>
            ) : (
              players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index < 3 ? 'bg-primary/10' : 'bg-background/50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{player.username || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.totalGames} games played
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Wins</p>
                      <p className="text-xl font-bold text-green-500">{player.wins}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-bold">{player.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Streak</p>
                      <p className="text-xl font-bold text-primary">{player.best_streak}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
