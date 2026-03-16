import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  DollarSign,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SeedBadge from "../components/SeedBadge";
import { useRegisterEntry } from "../hooks/useQueries";
import {
  type LocalTeam,
  getLocalPhase,
  getTeamsBySeed,
} from "../lib/teamStore";

const SEEDS = Array.from({ length: 16 }, (_, i) => i + 1);

const STEPS = [
  {
    num: 1,
    text: "Enter your name and email address below.",
    highlight: false,
  },
  {
    num: 2,
    text: "Pick one team per seed number (seeds 1–16).",
    highlight: false,
  },
  {
    num: 3,
    text: 'Click "Submit Entry" to lock in your picks.',
    highlight: false,
  },
  {
    num: 4,
    text: null, // rendered separately for PayPal highlight
    highlight: true,
  },
];

export default function EntryForm() {
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState("");
  const [email, setEmail] = useState("");
  const [picks, setPicks] = useState<Record<number, LocalTeam | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEntryId, setSubmittedEntryId] = useState<bigint | null>(null);
  const [teamsBySeed, setTeamsBySeed] = useState<Record<number, LocalTeam[]>>(
    {},
  );
  const [phase, setPhase] = useState("registration");

  const registerEntry = useRegisterEntry();

  useEffect(() => {
    const currentPhase = getLocalPhase();
    setPhase(currentPhase);

    const seedMap: Record<number, LocalTeam[]> = {};
    for (const seed of SEEDS) {
      seedMap[seed] = getTeamsBySeed(seed);
    }
    setTeamsBySeed(seedMap);
  }, []);

  const isRegistrationOpen = phase === "registration";
  const allPicksFilled = SEEDS.every((seed) => picks[seed] != null);
  const canSubmit =
    participantName.trim().length > 0 && allPicksFilled && isRegistrationOpen;

  const handlePickChange = (seed: number, teamId: string) => {
    const teams = teamsBySeed[seed] || [];
    const team = teams.find((t) => t.id.toString() === teamId) || null;
    setPicks((prev) => ({ ...prev, [seed]: team }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const picksArray: Array<[bigint, bigint]> = SEEDS.map((seed) => [
      BigInt(seed),
      BigInt(picks[seed]!.id),
    ]);

    try {
      const entryId = await registerEntry.mutateAsync({
        participantName: participantName.trim(),
        email: email.trim(),
        picks: picksArray,
      });
      setSubmittedEntryId(entryId);
      setSubmitted(true);
      toast.success("Entry submitted successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit entry";
      toast.error(message);
    }
  };

  if (submitted && submittedEntryId !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="bg-navy-card border-gold/30">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald/10 border-2 border-emerald flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">
              Entry Submitted!
            </h2>
            <p className="text-white/60 mb-2">
              Welcome,{" "}
              <span className="text-gold font-bold">{participantName}</span>!
            </p>
            <p className="text-white/50 text-sm mb-8">
              Entry #{submittedEntryId.toString()} has been recorded.
            </p>

            {/* PayPal reminder after submission */}
            <div className="bg-gold/10 rounded-xl border-2 border-gold/60 p-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gold" />
                <span className="text-gold font-black text-sm uppercase tracking-wider">
                  Don't forget to pay!
                </span>
              </div>
              <p className="text-white/80 text-sm">
                Send your entry fee via PayPal to{" "}
                <span className="text-gold font-bold">
                  klandrum21@gmail.com
                </span>{" "}
                to confirm your spot.
              </p>
            </div>

            <div className="bg-navy/50 rounded-xl border border-white/10 p-4 mb-8 text-left">
              <div className="text-gold/60 text-xs font-black tracking-widest uppercase mb-3">
                Your Picks
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SEEDS.map((seed) => (
                  <div key={seed} className="flex items-center gap-2 py-1">
                    <SeedBadge seed={seed} size="sm" />
                    <span className="text-white/80 text-sm font-semibold truncate">
                      {picks[seed]?.name || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate({ to: "/leaderboard" })}
                className="bg-gold hover:bg-gold/90 text-navy font-black"
              >
                View Leaderboard
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: `/entry/${submittedEntryId}` })}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                View My Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          MAKE YOUR <span className="text-gold">PICKS</span>
        </h1>
        <p className="text-white/60">
          Select one team per seed (1–16) to build your survivor bracket.
        </p>
      </div>

      {/* How to Enter Steps Card */}
      <Card
        data-ocid="entry.steps_card"
        className="bg-navy-card border-gold/30 mb-8 overflow-hidden"
      >
        <CardHeader className="pb-3 border-b border-gold/20">
          <CardTitle className="text-white font-black text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gold text-navy text-xs font-black flex items-center justify-center">
              ?
            </span>
            How to Enter
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          {/* Steps 1–3 */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-black flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-white/80 text-sm leading-relaxed pt-1">
                {STEPS[i].text}
              </p>
            </div>
          ))}

          {/* Step 4 — PayPal highlight */}
          <div className="flex items-start gap-3 rounded-xl border-2 border-gold/70 bg-gold/10 px-4 py-3 mt-1">
            <span className="w-7 h-7 rounded-full bg-gold text-navy text-sm font-black flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-gold font-black text-sm">
                  Pay Entry Fee via PayPal
                </span>
                <Badge className="bg-gold text-navy text-[10px] font-black uppercase tracking-wide px-2 py-0.5">
                  Required
                </Badge>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Send your entry fee to{" "}
                <span className="text-gold font-black">
                  klandrum21@gmail.com
                </span>{" "}
                via PayPal to confirm your spot in the contest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Warning */}
      {!isRegistrationOpen && (
        <Alert className="mb-6 bg-destructive/10 border-destructive/40">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-semibold">
            Registration is currently{" "}
            <strong>
              {phase === "inProgress"
                ? "closed (tournament in progress)"
                : "closed (tournament complete)"}
            </strong>
            . New entries are not being accepted.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Participant Info */}
        <Card className="bg-navy-card border-gold/20 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white font-black text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Your Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Name <span className="text-gold">*</span>
              </Label>
              <Input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name..."
                disabled={!isRegistrationOpen}
                className="bg-white border-white/20 text-black placeholder:text-black/40 focus:border-gold focus:ring-gold/20 text-base"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
                <span className="text-white/30 font-normal normal-case tracking-normal ml-1">
                  (optional)
                </span>
              </Label>
              <Input
                data-ocid="entry.email_input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={!isRegistrationOpen}
                className="bg-white border-white/20 text-black placeholder:text-black/40 focus:border-gold focus:ring-gold/20 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Seed Picks */}
        <Card className="bg-navy-card border-gold/20 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white font-black text-lg flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-gold" />
              Seed Picks
              <span className="ml-auto text-sm font-normal text-white/40">
                {SEEDS.filter((s) => picks[s] != null).length} / 16 selected
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SEEDS.map((seed) => {
              const teams = teamsBySeed[seed] || [];
              const hasPick = picks[seed] != null;

              return (
                <div
                  key={seed}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                    hasPick
                      ? "bg-gold/5 border-gold/30"
                      : "bg-navy/30 border-white/10"
                  }`}
                >
                  <SeedBadge
                    seed={seed}
                    size="md"
                    variant={hasPick ? "gold" : "outline"}
                  />

                  <div className="flex-1 min-w-0">
                    <Label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1 block">
                      Seed {seed}
                    </Label>
                    {teams.length === 0 ? (
                      <p className="text-white/30 text-sm italic">
                        No teams available for this seed
                      </p>
                    ) : (
                      <Select
                        value={picks[seed]?.id.toString() || ""}
                        onValueChange={(val) => handlePickChange(seed, val)}
                        disabled={!isRegistrationOpen}
                      >
                        <SelectTrigger className="bg-navy/50 border-white/20 text-white focus:border-gold h-9 text-sm">
                          <SelectValue placeholder="Select a team..." />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-card border-gold/20">
                          {teams.map((team) => (
                            <SelectItem
                              key={team.id}
                              value={team.id.toString()}
                              className="text-white focus:bg-gold/20 focus:text-white"
                            >
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {hasPick && (
                    <CheckCircle className="w-5 h-5 text-emerald shrink-0" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col items-center gap-3">
          {!allPicksFilled && participantName.trim() && (
            <p className="text-white/40 text-sm">
              Fill all 16 seed picks to submit your entry.
            </p>
          )}
          <Button
            type="submit"
            disabled={!canSubmit || registerEntry.isPending}
            size="lg"
            className="bg-gold hover:bg-gold/90 text-navy font-black text-lg px-10 py-6 rounded-xl w-full sm:w-auto disabled:opacity-40"
          >
            {registerEntry.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Entry"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
