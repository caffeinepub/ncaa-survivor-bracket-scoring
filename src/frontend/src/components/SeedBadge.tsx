interface SeedBadgeProps {
  seed: number | bigint;
  size?: "sm" | "md" | "lg";
  variant?: "gold" | "outline" | "muted";
}

export default function SeedBadge({
  seed,
  size = "md",
  variant = "gold",
}: SeedBadgeProps) {
  const seedNum = typeof seed === "bigint" ? Number(seed) : seed;

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const variantClasses = {
    gold: "bg-gold text-navy border-gold",
    outline: "bg-transparent text-gold border-gold",
    muted: "bg-white/10 text-white/50 border-white/20",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border-2 font-black shrink-0 ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {seedNum}
    </span>
  );
}
