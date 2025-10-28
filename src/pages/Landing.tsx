import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedLogo from "@/components/AnimatedLogo";
import { Gamepad2, TrophyIcon, History, Trophy } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Animated Logo */}
        <AnimatedLogo />

        {/* Main Heading */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tic Tac Toe
          </h1>
          <p className="text-xl text-muted-foreground">
            Challenge the AI or compete with friends. Track your stats and replay your victories!
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/game">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Gamepad2 className="mr-2" />
              Play Now
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              <Trophy className="mr-2" />
              Leaderboard
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              Login / Sign Up
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-card rounded-2xl neumorphic text-center space-y-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Gamepad2 className="text-white" />
            </div>
            <h3 className="font-semibold text-lg">Smart AI</h3>
            <p className="text-sm text-muted-foreground">
              Play against an intelligent AI opponent that learns from your moves
            </p>
          </div>

          <div className="p-6 bg-card rounded-2xl neumorphic text-center space-y-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <TrophyIcon className="text-white" />
            </div>
            <h3 className="font-semibold text-lg">Track Stats</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your wins, losses, and winning streaks with detailed statistics
            </p>
          </div>

          <div className="p-6 bg-card rounded-2xl neumorphic text-center space-y-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <History className="text-white" />
            </div>
            <h3 className="font-semibold text-lg">Game Replay</h3>
            <p className="text-sm text-muted-foreground">
              Replay any of your past games move by move to analyze your strategy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
