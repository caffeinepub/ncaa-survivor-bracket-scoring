import { Heart, Trophy } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(
    typeof window !== "undefined"
      ? window.location.hostname
      : "ncaa-survivor-bracket",
  );

  return (
    <footer className="bg-navy-dark border-t border-gold/20 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center">
              <Trophy className="w-4 h-4 text-navy" />
            </div>
            <span className="text-gold font-black text-sm tracking-tight">
              NCAA
            </span>
            <span className="text-white font-bold text-sm tracking-tight">
              SURVIVOR BRACKET
            </span>
          </div>

          <p className="text-white/50 text-sm text-center">
            © {year} NCAA Survivor Bracket. All rights reserved.
          </p>

          <p className="text-white/50 text-sm flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3.5 h-3.5 text-gold fill-gold inline" /> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 font-semibold transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
