const AnimatedLogo = () => {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-2 bg-card rounded-3xl neumorphic">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg animate-pulse-glow"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl font-bold text-primary drop-shadow-lg">
          TicTac
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;
