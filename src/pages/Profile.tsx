import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Trophy, Target, TrendingUp } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Profile
          </h1>
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <Home />
          </Button>
        </div>

        <Card className="neumorphic">
          <CardHeader>
            <CardTitle className="text-2xl">{profile.username}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-xl text-center">
              <Trophy className="mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{profile.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-xl text-center">
              <Target className="mx-auto mb-2 text-destructive" />
              <p className="text-3xl font-bold">{profile.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-xl text-center">
              <TrendingUp className="mx-auto mb-2 text-secondary" />
              <p className="text-3xl font-bold">{profile.current_streak}</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-xl text-center">
              <Trophy className="mx-auto mb-2 text-accent" />
              <p className="text-3xl font-bold">{profile.best_streak}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="hero" className="flex-1" onClick={() => navigate("/game")}>
            Play Game
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
