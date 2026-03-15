import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Trophy,
  XCircle,
} from "lucide-react";
import SeedBadge from "../components/SeedBadge";
import { useEntry } from "../hooks/useQueries";
import { getTeamById } from "../lib/teamStore";

export default function EntryDetail() {
  const { entryId } = useParams({ from: "/entry/$entryId" });
  const entryIdBigInt = BigInt(entryId);

  const { data: entry, isLoading, error } = useEntry(entryIdBigInt);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-3" />
          <p className="text-white/50">Loading entry...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card className="bg-navy-card border-destructive/30">
          <CardContent className="p-10 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">
              Entry Not Found
            </h2>
            <p className="text-white/50 mb-6">
              This entry doesn't exist or could not be loaded.
            </p>
            <Button
              asChild
              className="bg-gold hover:bg-gold/90 text-navy font-black"
            >
              <Link to="/leaderboard">Back to Leaderboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPoints = Number(entry.totalPoints);
  const activeTeams = Number(entry.activeTeams);
  const eliminatedTeams = 16 - activeTeams;

  // Sort picks by seed
  const sortedPicks = [...entry.picks].sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Button
        asChild
        variant="ghost"
        className="text-white/60 hover:text-white hover:bg-white/10 mb-6 -ml-2"
      >
        <Link to="/leaderboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leaderboard
        </Link>
      </Button>

      {/* Entry Header */}
      <Card className="bg-navy-card border-gold/30 mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 border-2 border-gold/30 flex items-center justify-center shrink-0">
              <Trophy className="w-8 h-8 text-gold" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white leading-tight">
                {entry.participantName}
              </h1>
              <p className="text-white/50 text-sm mt-1">Entry #{entryId}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-gold leading-none">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-white/40 text-sm font-semibold uppercase tracking-wide mt-1">
                Total Points
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-black text-white">
                {activeTeams}
              </div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-emerald" />
                Active
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">
                {eliminatedTeams}
              </div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1 mt-0.5">
                <XCircle className="w-3 h-3 text-destructive" />
                Eliminated
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">16</div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mt-0.5">
                Total Picks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Picks Grid */}
      <Card className="bg-navy-card border-gold/20">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white font-black flex items-center gap-2">
            All 16 Picks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {sortedPicks.map(([seed, teamId]) => {
              const seedNum = Number(seed);
              const teamIdNum = Number(teamId);
              const localTeam = getTeamById(teamIdNum);
              const teamName = localTeam?.name || `Team #${teamIdNum}`;

              // We don't have per-team points from the backend, so we show what we can
              // The backend Entry type only has totalPoints, not per-pick points
              const isActive = true; // We can't determine per-team status without backend support

              return (
                <div
                  key={seedNum}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                    isActive
                      ? "bg-navy/30 border-white/10 hover:border-gold/20"
                      : "bg-white/5 border-white/5 opacity-50"
                  }`}
                >
                  <SeedBadge
                    seed={seedNum}
                    size="md"
                    variant={isActive ? "gold" : "muted"}
                  />

                  <div className="flex-1 min-w-0">
                    <span
                      className={`font-bold text-base ${isActive ? "text-white" : "text-white/40"}`}
                    >
                      {teamName}
                    </span>
                    <div className="text-white/30 text-xs mt-0.5">
                      Seed {seedNum}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <Badge className="bg-emerald/10 text-emerald border-emerald/30 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Eliminated
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
