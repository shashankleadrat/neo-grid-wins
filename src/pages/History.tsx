import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";

const History = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from('games').select('*').eq('player_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        setGames(data || []);
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Game History
          </h1>
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <Home />
          </Button>
        </div>

        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.id} className="p-4 neumorphic">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {game.winner === game.player_symbol ? '🏆 Win' : game.winner === 'draw' ? '🤝 Draw' : '❌ Loss'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(game.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default History;
