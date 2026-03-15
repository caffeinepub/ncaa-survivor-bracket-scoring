import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Clock, RefreshCw, Shield, Trophy, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useLeaderboard } from "../hooks/useQueries";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shadow-md shadow-gold/30">
        <Trophy className="w-4 h-4 text-navy" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
        <span className="text-white font-black text-sm">2</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-9 h-9 rounded-full bg-amber-700/40 flex items-center justify-center">
        <span className="text-amber-400 font-black text-sm">3</span>
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
      <span className="text-white/50 font-bold text-sm">{rank}</span>
    </div>
  );
}

export default function Leaderboard() {
  const {
    data: leaderboard,
    isLoading,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useLeaderboard();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            LEADER<span className="text-gold">BOARD</span>
          </h1>
          <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last updated: {formatTime(lastRefresh)} · Auto-refreshes every 60s
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isFetching}
          variant="outline"
          className="border-gold/30 text-gold hover:bg-gold/10 font-semibold"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="bg-navy-card border-gold/20">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-gold mx-auto mb-1" />
              <div className="text-2xl font-black text-white">
                {leaderboard.length}
              </div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">
                Entries
              </div>
            </CardContent>
          </Card>
          <Card className="bg-navy-card border-gold/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
              <div className="text-2xl font-black text-white">
                {leaderboard[0]
                  ? Number(leaderboard[0][1].totalPoints).toLocaleString()
                  : 0}
              </div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">
                Top Score
              </div>
            </CardContent>
          </Card>
          <Card className="bg-navy-card border-gold/20">
            <CardContent className="p-4 text-center">
              <Zap className="w-5 h-5 text-gold mx-auto mb-1" />
              <div className="text-2xl font-black text-white">
                {
                  leaderboard.filter(([, e]) => Number(e.activeTeams) > 0)
                    .length
                }
              </div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">
                Still Active
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard List */}
      <Card className="bg-navy-card border-gold/20">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white font-black flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {["s1", "s2", "s3", "s4", "s5"].map((sk) => (
                <Skeleton
                  key={sk}
                  className="h-16 w-full bg-white/5 rounded-xl"
                />
              ))}
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 font-semibold">No entries yet.</p>
              <p className="text-white/30 text-sm mt-1">
                Be the first to enter!
              </p>
              <Button
                asChild
                className="mt-4 bg-gold hover:bg-gold/90 text-navy font-black"
              >
                <Link to="/enter">Enter Now</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map(([entryId, entry], index) => {
                const rank = index + 1;
                const isEliminated = Number(entry.activeTeams) === 0;
                const activeTeams = Number(entry.activeTeams);
                const totalPoints = Number(entry.totalPoints);
                const entryIdStr = entryId.toString();

                return (
                  <div
                    key={entryIdStr}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5 ${
                      isEliminated ? "opacity-50" : ""
                    } ${rank === 1 ? "bg-gold/5" : ""}`}
                  >
                    <RankBadge rank={rank} />

                    <div className="flex-1 min-w-0">
                      <Link
                        to="/entry/$entryId"
                        params={{ entryId: entryIdStr }}
                        className="text-white font-bold hover:text-gold transition-colors truncate block"
                      >
                        {entry.participantName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isEliminated ? (
                          <Badge
                            variant="destructive"
                            className="text-xs px-2 py-0 h-5"
                          >
                            Eliminated
                          </Badge>
                        ) : (
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald" />
                            {activeTeams} team{activeTeams !== 1 ? "s" : ""}{" "}
                            active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-2xl font-black ${rank === 1 ? "text-gold" : "text-white"}`}
                      >
                        {totalPoints.toLocaleString()}
                      </div>
                      <div className="text-white/30 text-xs font-semibold uppercase tracking-wide">
                        pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
