import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  DollarSign,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Swords,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TournamentPhase } from "../backend";
import SeedBadge from "../components/SeedBadge";
import { useActor } from "../hooks/useActor";
import {
  type SyncProgress,
  useAddTeam,
  useConfirmPayment,
  useDeleteEntry,
  useFetchAndSyncScores,
  useLeaderboard,
  useSeedTeamsFromBracket,
  useSetTournamentPhase,
  useUnconfirmPayment,
} from "../hooks/useQueries";
import {
  type LocalGame,
  type LocalTeam,
  addLocalGame,
  addLocalTeam,
  getLocalGames,
  getLocalPhase,
  getLocalTeams,
  setLocalPhase,
  setLocalTeams,
} from "../lib/teamStore";

const SEEDS = Array.from({ length: 16 }, (_, i) => i + 1);

const PHASE_LABELS: Record<string, string> = {
  registration: "Registration Open",
  inProgress: "In Progress",
  complete: "Complete",
};

const PHASE_COLORS: Record<string, string> = {
  registration: "bg-emerald/10 text-emerald border-emerald/30",
  inProgress: "bg-gold/10 text-gold border-gold/30",
  complete: "bg-white/10 text-white/50 border-white/20",
};

export default function Admin() {
  const [teams, setTeams] = useState<LocalTeam[]>([]);
  const [games, setGames] = useState<LocalGame[]>([]);
  const [phase, setPhase] = useState("registration");

  // Add Team form
  const [teamName, setTeamName] = useState("");
  const [teamSeed, setTeamSeed] = useState("");

  // Record Game form
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [gameRound, setGameRound] = useState("1");
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  const { actor } = useActor();
  const addTeamMutation = useAddTeam();
  const setPhaseMutation = useSetTournamentPhase();
  const syncScoresMutation = useFetchAndSyncScores(setSyncProgress);
  const seedTeamsMutation = useSeedTeamsFromBracket();
  const confirmPaymentMutation = useConfirmPayment();
  const unconfirmPaymentMutation = useUnconfirmPayment();
  const deleteEntryMutation = useDeleteEntry();
  const leaderboardQuery = useLeaderboard();

  useEffect(() => {
    setTeams(getLocalTeams());
    setGames(getLocalGames());
    setPhase(getLocalPhase());
  }, []);

  const refreshLocalData = () => {
    setTeams(getLocalTeams());
    setGames(getLocalGames());
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamSeed) return;

    const seed = Number.parseInt(teamSeed);
    if (seed < 1 || seed > 16) {
      toast.error("Seed must be between 1 and 16");
      return;
    }

    try {
      const id = await addTeamMutation.mutateAsync({
        name: teamName.trim(),
        seed: BigInt(seed),
      });

      addLocalTeam({ id: Number(id), name: teamName.trim(), seed });
      refreshLocalData();
      setTeamName("");
      setTeamSeed("");
      toast.success(`Team "${teamName.trim()}" (Seed ${seed}) added!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add team";
      toast.error(message);
    }
  };

  const handleRecordGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !homeScore || !awayScore) return;

    const homeTeam = teams.find((t) => t.id.toString() === homeTeamId);
    const awayTeam = teams.find((t) => t.id.toString() === awayTeamId);

    if (!homeTeam || !awayTeam) {
      toast.error("Invalid team selection");
      return;
    }

    if (homeTeamId === awayTeamId) {
      toast.error("Home and away teams must be different");
      return;
    }

    const hScore = Number.parseInt(homeScore);
    const aScore = Number.parseInt(awayScore);

    const game: LocalGame = {
      id: Date.now(),
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      homeScore: hScore,
      awayScore: aScore,
      round: Number.parseInt(gameRound),
      recordedAt: new Date().toISOString(),
    };

    addLocalGame(game);
    refreshLocalData();
    setHomeTeamId("");
    setAwayTeamId("");
    setHomeScore("");
    setAwayScore("");
    toast.success("Game result recorded!");
  };

  const handlePhaseChange = async (newPhase: string) => {
    const phaseMap: Record<string, TournamentPhase> = {
      registration: TournamentPhase.registration,
      inProgress: TournamentPhase.inProgress,
      complete: TournamentPhase.complete,
    };

    try {
      await setPhaseMutation.mutateAsync(phaseMap[newPhase]);
      setLocalPhase(newPhase);
      setPhase(newPhase);
      toast.success(`Tournament phase set to: ${PHASE_LABELS[newPhase]}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update phase";
      toast.error(message);
    }
  };

  const handleSyncScores = async () => {
    setSyncProgress(null);
    try {
      const result = await syncScoresMutation.mutateAsync();
      setSyncProgress({ stage: "done", updatedCount: result.updatedCount });
      toast.success(result.message || "Scores synced successfully!");
    } catch (err: unknown) {
      setSyncProgress(null);
      const message =
        err instanceof Error ? err.message : "Failed to sync scores";
      toast.error(message);
    }
  };

  const handleSeedTeams = async () => {
    try {
      const count = await seedTeamsMutation.mutateAsync();
      const loaded = Number(count);
      if (loaded === 0) {
        toast.info("All 2026 tournament teams are already loaded.");
      } else {
        toast.success(
          `${loaded} team${loaded !== 1 ? "s" : ""} successfully loaded from the 2026 bracket!`,
        );
      }
      // After seeding, fetch all teams from backend and cache locally
      if (actor) {
        const allTeams = await actor.getTeams();
        setLocalTeams(
          allTeams.map((t) => ({
            id: Number(t.id),
            name: t.name,
            seed: Number(t.seed),
          })),
        );
        refreshLocalData();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load bracket teams";
      toast.error(message);
    }
  };

  const handleConfirmPayment = async (entryId: bigint, index: number) => {
    try {
      await confirmPaymentMutation.mutateAsync(entryId);
      toast.success(`Entry #${index} marked as paid!`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm payment";
      toast.error(message);
    }
  };

  const handleUnconfirmPayment = async (entryId: bigint, index: number) => {
    try {
      await unconfirmPaymentMutation.mutateAsync(entryId);
      toast.success(`Entry #${index} marked as unpaid.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to unconfirm payment";
      toast.error(message);
    }
  };

  const handleDeleteEntry = async (entryId: bigint, index: number) => {
    try {
      await deleteEntryMutation.mutateAsync(entryId);
      toast.success(`Entry #${index} deleted.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete entry";
      toast.error(message);
    }
  };

  // Group teams by seed
  const teamsBySeed: Record<number, LocalTeam[]> = {};
  for (const seed of SEEDS) {
    teamsBySeed[seed] = teams.filter((t) => t.seed === seed);
  }

  const leaderboardEntries = leaderboardQuery.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Settings className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            ADMIN <span className="text-gold">PANEL</span>
          </h1>
          <p className="text-white/50 text-sm">
            Manage teams, games, and tournament settings
          </p>
        </div>
        <div className="ml-auto">
          <Badge className={`border ${PHASE_COLORS[phase]} font-semibold`}>
            {PHASE_LABELS[phase] || phase}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="bg-navy-card border border-gold/20 p-1">
          <TabsTrigger
            value="teams"
            className="data-[state=active]:bg-gold data-[state=active]:text-navy font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="data-[state=active]:bg-gold data-[state=active]:text-navy font-bold"
          >
            <Swords className="w-4 h-4 mr-2" />
            Games
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-gold data-[state=active]:text-navy font-bold"
            data-ocid="admin.payments.tab"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-gold data-[state=active]:text-navy font-bold"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Teams Tab ── */}
        <TabsContent value="teams" className="space-y-6">
          {/* Load 2026 Bracket Teams */}
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Download className="w-5 h-5 text-gold" />
                Load 2026 Tournament Bracket Teams
              </CardTitle>
              <CardDescription className="text-white/50">
                Bulk-load all 68 teams from the 2026 NCAA Men's Tournament
                bracket (announced March 15). Duplicate entries are skipped
                automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={seedTeamsMutation.isPending}
                    className="bg-gold hover:bg-gold/90 text-navy font-black"
                    data-ocid="admin.load_teams.primary_button"
                  >
                    {seedTeamsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading Teams…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Load 2026 Bracket Teams
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  className="bg-navy-card border-gold/20"
                  data-ocid="admin.load_teams.dialog"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white font-black">
                      Load 2026 Tournament Teams?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      This will add all 68 teams from the 2026 NCAA Men's
                      Tournament bracket to the backend. Teams that already
                      exist (same name + seed) will be skipped. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="border-white/20 text-white/70 hover:bg-white/10"
                      data-ocid="admin.load_teams.cancel_button"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSeedTeams}
                      className="bg-gold hover:bg-gold/90 text-navy font-black"
                      data-ocid="admin.load_teams.confirm_button"
                    >
                      Yes, Load Teams
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Add Team Form */}
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                Add Team Manually
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAddTeam}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1">
                  <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Team Name
                  </Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Duke Blue Devils"
                    className="bg-navy/50 border-white/20 text-white placeholder:text-white/30 focus:border-gold"
                    data-ocid="admin.team.input"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Seed (1–16)
                  </Label>
                  <Select value={teamSeed} onValueChange={setTeamSeed}>
                    <SelectTrigger
                      className="bg-navy/50 border-white/20 text-white focus:border-gold"
                      data-ocid="admin.team.select"
                    >
                      <SelectValue placeholder="Seed" />
                    </SelectTrigger>
                    <SelectContent className="bg-navy-card border-gold/20">
                      {SEEDS.map((s) => (
                        <SelectItem
                          key={s}
                          value={s.toString()}
                          className="text-white focus:bg-gold/20"
                        >
                          Seed {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={
                      !teamName.trim() || !teamSeed || addTeamMutation.isPending
                    }
                    className="bg-gold hover:bg-gold/90 text-navy font-black w-full sm:w-auto"
                    data-ocid="admin.team.submit_button"
                  >
                    {addTeamMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Teams by Seed */}
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Teams by Seed
                <span className="ml-auto text-sm font-normal text-white/40">
                  {teams.length} total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p
                  className="text-white/30 text-center py-8"
                  data-ocid="admin.teams.empty_state"
                >
                  No teams added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {SEEDS.map((seed) => {
                    const seedTeams = teamsBySeed[seed];
                    if (seedTeams.length === 0) return null;
                    return (
                      <div
                        key={seed}
                        className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
                      >
                        <SeedBadge seed={seed} size="sm" />
                        <div className="flex flex-wrap gap-2">
                          {seedTeams.map((team) => (
                            <span
                              key={team.id}
                              className="bg-navy/50 border border-white/10 rounded-lg px-3 py-1 text-white/80 text-sm font-semibold"
                            >
                              {team.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Games Tab ── */}
        <TabsContent value="games" className="space-y-6">
          {/* Sync Scores from NCAA.com */}
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gold" />
                Sync Scores from NCAA.com
              </CardTitle>
              <CardDescription className="text-white/50">
                Pull the latest completed game results from the NCAA.com live
                scoreboard and automatically update standings. Only new games
                are processed; already-recorded results are skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                onClick={handleSyncScores}
                disabled={syncScoresMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-navy font-black"
                data-ocid="admin.sync_scores.primary_button"
              >
                {syncScoresMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {syncProgress?.stage === "updating"
                      ? `Updating ${syncProgress.teamCount ?? 0} teams…`
                      : syncProgress?.stage === "fetching"
                        ? `Fetching ${syncProgress.currentDate ?? ""}… (${syncProgress.dateIndex}/${syncProgress.totalDates})`
                        : "Syncing…"}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Scores from NCAA.com
                  </>
                )}
              </Button>

              {syncScoresMutation.isSuccess && (
                <div
                  className="flex items-center gap-2 text-emerald text-sm font-semibold"
                  data-ocid="admin.sync_scores.success_state"
                >
                  <CheckCircle className="w-4 h-4" />
                  {syncScoresMutation.data?.message || "Sync complete"}
                </div>
              )}

              {syncScoresMutation.isError && (
                <p
                  className="text-red-400 text-sm font-semibold"
                  data-ocid="admin.sync_scores.error_state"
                >
                  {syncScoresMutation.error instanceof Error
                    ? syncScoresMutation.error.message
                    : "Sync failed. Please try again."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Record Game Form */}
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Swords className="w-5 h-5 text-gold" />
                Record Game Result Manually
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length < 2 ? (
                <p className="text-white/40 text-sm">
                  Add at least 2 teams to record game results.
                </p>
              ) : (
                <form onSubmit={handleRecordGame} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                        Home Team
                      </Label>
                      <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                        <SelectTrigger className="bg-navy/50 border-white/20 text-white focus:border-gold">
                          <SelectValue placeholder="Select home team..." />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-card border-gold/20 max-h-60">
                          {teams.map((team) => (
                            <SelectItem
                              key={team.id}
                              value={team.id.toString()}
                              className="text-white focus:bg-gold/20"
                            >
                              <span className="flex items-center gap-2">
                                <SeedBadge seed={team.seed} size="sm" />
                                {team.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                        Away Team
                      </Label>
                      <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                        <SelectTrigger className="bg-navy/50 border-white/20 text-white focus:border-gold">
                          <SelectValue placeholder="Select away team..." />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-card border-gold/20 max-h-60">
                          {teams.map((team) => (
                            <SelectItem
                              key={team.id}
                              value={team.id.toString()}
                              className="text-white focus:bg-gold/20"
                            >
                              <span className="flex items-center gap-2">
                                <SeedBadge seed={team.seed} size="sm" />
                                {team.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                        Home Score
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        placeholder="0"
                        className="bg-navy/50 border-white/20 text-white placeholder:text-white/30 focus:border-gold"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                        Away Score
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        placeholder="0"
                        className="bg-navy/50 border-white/20 text-white placeholder:text-white/30 focus:border-gold"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                        Round
                      </Label>
                      <Select value={gameRound} onValueChange={setGameRound}>
                        <SelectTrigger className="bg-navy/50 border-white/20 text-white focus:border-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-card border-gold/20">
                          {[1, 2, 3, 4, 5, 6].map((r) => (
                            <SelectItem
                              key={r}
                              value={r.toString()}
                              className="text-white focus:bg-gold/20"
                            >
                              Round {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      !homeTeamId || !awayTeamId || !homeScore || !awayScore
                    }
                    className="bg-gold hover:bg-gold/90 text-navy font-black"
                    data-ocid="admin.game.submit_button"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Record Result
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          {games.length > 0 && (
            <Card className="bg-navy-card border-gold/20">
              <CardHeader>
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  Recent Games
                  <span className="ml-auto text-sm font-normal text-white/40">
                    {games.length} recorded
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...games]
                    .reverse()
                    .slice(0, 10)
                    .map((game) => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <Badge
                            variant="outline"
                            className="border-gold/30 text-gold text-xs"
                          >
                            R{game.round}
                          </Badge>
                          <span className="text-white/80 font-semibold">
                            {game.homeTeamName}
                          </span>
                          <span className="text-white/40">vs</span>
                          <span className="text-white/80 font-semibold">
                            {game.awayTeamName}
                          </span>
                        </div>
                        <div className="text-white font-black text-sm">
                          {game.homeScore} – {game.awayScore}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Payment Confirmations
                {leaderboardEntries.length > 0 && (
                  <span className="ml-auto text-sm font-normal text-white/40">
                    {
                      leaderboardEntries.filter(([, e]) => e.paymentConfirmed)
                        .length
                    }{" "}
                    / {leaderboardEntries.length} paid
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-white/50">
                Mark entries as paid once you've received their PayPal payment
                at klandrum21@gmail.com.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardQuery.isLoading ? (
                <div
                  className="flex items-center gap-3 py-8 justify-center text-white/40"
                  data-ocid="admin.payments.loading_state"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading entries…
                </div>
              ) : leaderboardEntries.length === 0 ? (
                <div
                  className="text-center py-12"
                  data-ocid="admin.payments.empty_state"
                >
                  <DollarSign className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 font-semibold">No entries yet.</p>
                  <p className="text-white/20 text-sm mt-1">
                    Entries will appear here once participants register.
                  </p>
                </div>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <div className="space-y-2" data-ocid="admin.payments.table">
                    {leaderboardEntries.map(([entryId, entry], idx) => {
                      const rowNum = idx + 1;
                      const isPaid = entry.paymentConfirmed;
                      const isPaymentBusy =
                        (confirmPaymentMutation.isPending &&
                          confirmPaymentMutation.variables === entryId) ||
                        (unconfirmPaymentMutation.isPending &&
                          unconfirmPaymentMutation.variables === entryId);
                      const isDeleteBusy =
                        deleteEntryMutation.isPending &&
                        deleteEntryMutation.variables === entryId;
                      const isBusy = isPaymentBusy || isDeleteBusy;

                      return (
                        <div
                          key={entryId.toString()}
                          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                            isPaid
                              ? "bg-emerald/5 border-emerald/20"
                              : "bg-navy/30 border-white/10"
                          }`}
                        >
                          {/* Left: info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-white/30 text-xs font-black w-6 shrink-0">
                              #{rowNum}
                            </span>
                            <div className="min-w-0">
                              <p className="text-white font-bold text-sm truncate">
                                {entry.participantName}
                              </p>
                              {entry.email && (
                                <p className="text-white/40 text-xs truncate">
                                  {entry.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: name label + badge + buttons */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-white/70 text-xs font-semibold truncate max-w-[140px]">
                              {entry.participantName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  isPaid
                                    ? "bg-emerald/20 text-emerald border border-emerald/40 font-bold"
                                    : "bg-red-500/10 text-red-400 border border-red-500/30 font-bold"
                                }
                              >
                                {isPaid ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Unpaid
                                  </>
                                )}
                              </Badge>

                              {/* Mark Paid / Mark Unpaid with tooltip + confirmation dialog */}
                              {isPaid ? (
                                <Tooltip>
                                  <AlertDialog>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={isBusy}
                                          className="border-white/20 text-white/60 hover:bg-white/10 hover:text-white text-xs font-bold"
                                          data-ocid="admin.payments.mark_unpaid.open_modal_button"
                                        >
                                          {isPaymentBusy ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            "Mark Unpaid"
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="bg-navy-card border border-white/20 text-white text-xs font-semibold px-3 py-1.5"
                                    >
                                      Mark {entry.participantName} as Unpaid
                                    </TooltipContent>
                                    <AlertDialogContent
                                      className="bg-navy-card border-white/20"
                                      data-ocid="admin.payments.mark_unpaid.dialog"
                                    >
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-black">
                                          Mark as Unpaid?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-white/60">
                                          Mark{" "}
                                          <span className="text-white font-semibold">
                                            {entry.participantName}
                                          </span>
                                          's payment as unpaid?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel
                                          className="border-white/20 text-white/70 hover:bg-white/10"
                                          data-ocid="admin.payments.mark_unpaid.cancel_button"
                                        >
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleUnconfirmPayment(
                                              entryId,
                                              rowNum,
                                            )
                                          }
                                          className="border-white/20 bg-navy/60 hover:bg-white/10 text-white font-black"
                                          data-ocid={`admin.payments.mark_unpaid.confirm_button.${rowNum}`}
                                        >
                                          Yes, Mark Unpaid
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <AlertDialog>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          disabled={isBusy}
                                          className="bg-emerald/20 hover:bg-emerald/30 text-emerald border border-emerald/40 text-xs font-bold"
                                          data-ocid="admin.payments.mark_paid.open_modal_button"
                                        >
                                          {isPaymentBusy ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            "Mark Paid"
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="bg-navy-card border border-white/20 text-white text-xs font-semibold px-3 py-1.5"
                                    >
                                      Mark {entry.participantName} as Paid
                                    </TooltipContent>
                                    <AlertDialogContent
                                      className="bg-navy-card border-emerald/30"
                                      data-ocid="admin.payments.mark_paid.dialog"
                                    >
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-black">
                                          Mark as Paid?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-white/60">
                                          Confirm that{" "}
                                          <span className="text-white font-semibold">
                                            {entry.participantName}
                                          </span>{" "}
                                          has paid.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel
                                          className="border-white/20 text-white/70 hover:bg-white/10"
                                          data-ocid="admin.payments.mark_paid.cancel_button"
                                        >
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleConfirmPayment(
                                              entryId,
                                              rowNum,
                                            )
                                          }
                                          className="bg-emerald/80 hover:bg-emerald text-navy font-black"
                                          data-ocid={`admin.payments.mark_paid.confirm_button.${rowNum}`}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Yes, Mark Paid
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Tooltip>
                              )}

                              {/* Delete Entry */}
                              <Tooltip>
                                <AlertDialog>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isBusy}
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 text-xs font-bold"
                                        data-ocid={`admin.payments.delete_button.${rowNum}`}
                                      >
                                        {isDeleteBusy ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="bg-navy-card border border-red-500/30 text-red-300 text-xs font-semibold px-3 py-1.5"
                                  >
                                    Delete {entry.participantName}
                                  </TooltipContent>
                                  <AlertDialogContent
                                    className="bg-navy-card border-red-500/30"
                                    data-ocid="admin.payments.delete.dialog"
                                  >
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white font-black">
                                        Delete Entry?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-white/60">
                                        This will permanently remove{" "}
                                        <span className="text-white font-semibold">
                                          {entry.participantName}
                                        </span>
                                        's entry. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        className="border-white/20 text-white/70 hover:bg-white/10"
                                        data-ocid="admin.payments.delete.cancel_button"
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteEntry(entryId, rowNum)
                                        }
                                        className="bg-red-500/80 hover:bg-red-500 text-white font-black"
                                        data-ocid="admin.payments.delete.confirm_button"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Entry
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-navy-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                Tournament Phase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                  Current Phase
                </Label>
                <Select
                  value={phase}
                  onValueChange={handlePhaseChange}
                  disabled={setPhaseMutation.isPending}
                >
                  <SelectTrigger
                    className="bg-navy/50 border-white/20 text-white focus:border-gold max-w-xs"
                    data-ocid="admin.phase.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-card border-gold/20">
                    <SelectItem
                      value="registration"
                      className="text-white focus:bg-gold/20"
                    >
                      Registration Open
                    </SelectItem>
                    <SelectItem
                      value="inProgress"
                      className="text-white focus:bg-gold/20"
                    >
                      In Progress
                    </SelectItem>
                    <SelectItem
                      value="complete"
                      className="text-white focus:bg-gold/20"
                    >
                      Complete
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {setPhaseMutation.isPending && (
                <div
                  className="flex items-center gap-2 text-white/50 text-sm"
                  data-ocid="admin.phase.loading_state"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating phase…
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-navy/30 p-4 space-y-2 text-sm text-white/50 max-w-md">
                <p className="font-semibold text-white/70">
                  Phase descriptions:
                </p>
                <p>
                  <span className="text-emerald font-semibold">
                    Registration Open
                  </span>{" "}
                  — Participants can submit entries.
                </p>
                <p>
                  <span className="text-gold font-semibold">In Progress</span> —
                  Tournament is live; entries are locked.
                </p>
                <p>
                  <span className="text-white/40 font-semibold">Complete</span>{" "}
                  — Tournament has ended; final standings are set.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
