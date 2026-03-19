import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import SeedBadge from "../components/SeedBadge";

const HOW_IT_WORKS = [
  {
    icon: Target,
    title: "Pick One Team Per Seed",
    description:
      "For each seed number (1 through 16), select exactly one team to represent that seed in your bracket. You must fill all 16 seed slots.",
    color: "text-gold",
  },
  {
    icon: TrendingUp,
    title: "Earn Points From Every Game",
    description:
      "Your teams earn points equal to the actual points they score in each game \u2014 win or lose. A team that scores 80 points earns you 80 points, even in a loss.",
    color: "text-emerald",
  },
  {
    icon: Trophy,
    title: "Keep Teams Alive to Keep Scoring",
    description:
      "Teams that win advance to the next round and keep scoring. Eliminated teams stop earning points. The survivor with the most total points wins!",
    color: "text-gold",
  },
];

const EXAMPLE_SEEDS = [1, 4, 8, 12, 16];

// Deadline: Thursday March 19 2026, 11:00 AM Central Time (UTC-6 in March)
const DEADLINE_MS = new Date("2026-03-19T17:00:00Z").getTime(); // 11am CT = 17:00 UTC

function calcTimeLeft() {
  const diff = DEADLINE_MS - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

function useCountdown() {
  const [time, setTime] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-navy-card border border-gold/30 rounded-xl px-4 py-3 min-w-[64px] text-center">
        <span className="text-3xl md:text-4xl font-black text-gold tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-white/50 text-xs font-bold uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const countdown = useCountdown();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-gold text-sm font-bold tracking-wide uppercase">
              NCAA Tournament 2026
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
            <span className="block mb-6">SURVIVOR</span>
            <span className="block text-gold">BRACKET</span>
          </h1>

          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Pick one team per seed. Earn points from every game they play. Keep
            your teams alive to keep scoring. The most points wins.
          </p>

          {/* Countdown */}
          {!countdown.expired ? (
            <div className="mb-10">
              <div className="flex flex-col items-center mb-4 gap-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  <span className="text-white font-black text-lg tracking-wide">
                    March 19th
                  </span>
                </div>
                <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">
                  11 am Central
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 md:gap-5">
                <CountdownUnit value={countdown.days} label="Days" />
                <span className="text-gold text-3xl font-black pb-6">:</span>
                <CountdownUnit value={countdown.hours} label="Hours" />
                <span className="text-gold text-3xl font-black pb-6">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-gold text-3xl font-black pb-6">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          ) : (
            <div className="mb-10 inline-flex items-center gap-2 bg-red-900/40 border border-red-500/40 rounded-full px-5 py-2">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-bold uppercase tracking-widest">
                Picks Are Locked
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!countdown.expired && (
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold/90 text-navy font-black text-lg px-8 py-6 rounded-xl shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-105"
              >
                <Link to="/enter">
                  Enter Now <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-navy font-black text-lg px-8 py-6 rounded-xl shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-105"
            >
              <Link to="/leaderboard">
                <Trophy className="w-5 h-5 mr-2" />
                View Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-navy py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white tracking-tight mb-3">
              HOW IT <span className="text-gold">WORKS</span>
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Simple rules, intense competition. Here's everything you need to
              know.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <Card
                key={item.title}
                className="bg-navy-card border-gold/20 hover:border-gold/50 transition-colors group"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <div className="text-gold/60 text-xs font-black tracking-widest uppercase mb-2">
                    Step {i + 1}
                  </div>
                  <h3 className="text-white font-black text-xl mb-3 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seed Picker Preview */}
      <section className="bg-navy-dark py-20 border-y border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                ALL 16 SEEDS,
                <br />
                <span className="text-gold">YOUR PICKS</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                The NCAA tournament features seeds 1 through 16. You must pick
                exactly one team for each seed slot. Higher seeds are favorites,
                but upsets happen \u2014 and every point scored counts toward
                your total.
              </p>
              <p className="text-white/60 leading-relaxed mb-8">
                A #16 seed that pulls off a massive upset and scores 75 points
                earns you just as many points as a #1 seed blowout. Strategy
                matters!
              </p>
              <Button
                asChild
                className="bg-gold hover:bg-gold/90 text-navy font-black px-6 py-5 rounded-xl"
              >
                <Link to="/enter">
                  Make Your Picks <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-navy-card border border-gold/20 rounded-2xl p-6">
              <div className="text-gold/60 text-xs font-black tracking-widest uppercase mb-4">
                Example Picks
              </div>
              <div className="space-y-3">
                {EXAMPLE_SEEDS.map((seed) => (
                  <div
                    key={seed}
                    className="flex items-center gap-3 bg-navy/50 rounded-xl px-4 py-3 border border-white/5"
                  >
                    <SeedBadge seed={seed} size="md" />
                    <div className="flex-1">
                      <div className="h-3 bg-white/10 rounded-full w-32" />
                    </div>
                    <div className="text-white/30 text-xs font-semibold">
                      Pick a team \u2192
                    </div>
                  </div>
                ))}
                <div className="text-center text-white/30 text-sm py-1">
                  ... and 11 more seeds
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Users className="w-12 h-12 text-gold mx-auto mb-5" />
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">
            READY TO <span className="text-gold">COMPETE?</span>
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Join the competition, make your picks, and climb the leaderboard.
            May the best bracket win!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-navy font-black text-lg px-8 py-6 rounded-xl shadow-xl shadow-gold/20"
            >
              <Link to="/enter">
                Enter the Tournament <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-navy font-black text-lg px-8 py-6 rounded-xl shadow-xl shadow-gold/20"
            >
              <Link to="/leaderboard">View Standings</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
