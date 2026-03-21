import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TournamentPhase, backendInterface } from "../backend";
import type { BackendWithTeams } from "../lib/backendTypes";
import { useActor } from "./useActor";

// ─── Leaderboard ────────────────────────────────────────────────────────────
export function useLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
  });
}

// ─── Single Entry ────────────────────────────────────────────────────────────
export function useEntry(entryId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["entry", entryId?.toString()],
    queryFn: async () => {
      if (!actor || entryId === null) return null;
      return actor.getEntry(entryId);
    },
    enabled: !!actor && !isFetching && entryId !== null,
  });
}

// ─── Register Entry ──────────────────────────────────────────────────────────
export function useRegisterEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantName,
      email,
      picks,
    }: {
      participantName: string;
      email: string;
      picks: Array<[bigint, bigint]>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.registerEntry(participantName, email, picks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

// ─── Confirm Payment ─────────────────────────────────────────────────────────
export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.confirmPayment(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

// ─── Unconfirm Payment ───────────────────────────────────────────────────────
export function useUnconfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.unconfirmPayment(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

// ─── Delete Entry ─────────────────────────────────────────────────────────────
export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

// ─── Add Team ────────────────────────────────────────────────────────────────
export function useAddTeam() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ name, seed }: { name: string; seed: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addTeam(name, seed);
    },
  });
}

// ─── Set Tournament Phase ────────────────────────────────────────────────────
export function useSetTournamentPhase() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (phase: TournamentPhase) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setTournamentPhase(phase);
    },
  });
}

// ─── Name normalization map for API short names -> stored names ───────────────
const NAME_MAP: Record<string, string> = {
  "South Fla.": "South Florida",
  "Saint Mary's (CA)": "Saint Mary's",
  "Saint Mary's": "Saint Mary's",
  "ND ST": "North Dakota St.",
  "North Dakota St.": "North Dakota St.",
  OHIOST: "Ohio St.",
  "Ohio St.": "Ohio St.",
  "St. John's (NY)": "St. John's",
  "St. John's": "St. John's",
  "Col. of Charleston": "Col. of Charleston",
  UCSB: "UC Santa Barbara",
  "UC Santa Barbara": "UC Santa Barbara",
  UNC: "North Carolina",
  "Fla. Atlantic": "Florida Atlantic",
  "Florida Atlantic": "Florida Atlantic",
  "Texas A&M-CC": "Texas A&M-CC",
  "SE Missouri St.": "Southeast Missouri St.",
  "SIU Edwardsville": "SIU Edwardsville",
  SIUE: "SIU Edwardsville",
  Grambling: "Grambling St.",
  "Miss. St.": "Mississippi St.",
  "Mississippi St.": "Mississippi St.",
  "Wis.": "Wisconsin",
  Wisconsin: "Wisconsin",
  "Neb.": "Nebraska",
  Nebraska: "Nebraska",
  "Ill.": "Illinois",
  Illinois: "Illinois",
  "Mich. St.": "Michigan St.",
  "Michigan St.": "Michigan St.",
  "Colo. St.": "Colorado St.",
  "Colorado St.": "Colorado St.",
  "Ore.": "Oregon",
  Oregon: "Oregon",
  "Wash. St.": "Washington St.",
  "Washington St.": "Washington St.",
  "N.C. St.": "NC State",
  "NC State": "NC State",
  Pitt: "Pittsburgh",
  Pittsburgh: "Pittsburgh",
  "W. Va.": "West Virginia",
  "West Virginia": "West Virginia",
  McNeese: "McNeese St.",
  "McNeese St.": "McNeese St.",
  "Neb. Omaha": "Nebraska Omaha",
  "Nebraska Omaha": "Nebraska Omaha",
  "Neb.-Omaha": "Nebraska Omaha",
  Akron: "Akron",
  "Am. Univ.": "American",
  American: "American",
  Bryant: "Bryant",
  FGCU: "Florida Gulf Coast",
  "Florida Gulf Coast": "Florida Gulf Coast",
  "High Point": "High Point",
  LIU: "Long Island",
  "Long Island": "Long Island",
  "Long Island Univ.": "Long Island",
  "LIU Brooklyn": "Long Island",
  Longwood: "Longwood",
  "Norfolk St.": "Norfolk St.",
  Oakland: "Oakland",
  "Queens (NC)": "Queens (N.C.)",
  Queens: "Queens (N.C.)",
  "Queens (N.C.)": "Queens (N.C.)",
  "Queens NC": "Queens (N.C.)",
  "Queens-NC": "Queens (N.C.)",
  "Queens Univ.": "Queens (N.C.)",
  "Queens University": "Queens (N.C.)",
  "Queens Univ. (NC)": "Queens (N.C.)",
  "Queens Univ. (N.C.)": "Queens (N.C.)",
  "Queens-Charlotte": "Queens (N.C.)",
  "Queens Univ. Charlotte": "Queens (N.C.)",
  UNI: "Northern Iowa",
  "N. Iowa": "Northern Iowa",
  "North. Iowa": "Northern Iowa",
  "No. Iowa": "Northern Iowa",
  "Northern Iowa": "Northern Iowa",
  "Robert Morris": "Robert Morris",
  Stetson: "Stetson",
  UMES: "Maryland-Eastern Shore",
  "UNC Asheville": "UNC Asheville",
  UNCW: "UNC Wilmington",
  "UNC Wilmington": "UNC Wilmington",
  SFA: "Stephen F. Austin",
  "Stephen F. Austin": "Stephen F. Austin",
  "Norf. St.": "Norfolk St.",
  "Mont. St.": "Montana St.",
  "Montana St.": "Montana St.",
};

function normalizeTeamName(apiName: string): string {
  if (NAME_MAP[apiName]) return NAME_MAP[apiName];
  // Fuzzy fallback: any "Queens" variant maps to Queens (N.C.)
  if (apiName.toLowerCase().startsWith("queens")) return "Queens (N.C.)";
  return apiName;
}

interface ApiGame {
  game: {
    gameState: string;
    away: { score: string; names: { short: string }; winner: boolean };
    home: { score: string; names: { short: string }; winner: boolean };
  };
}

interface ApiResponse {
  games?: ApiGame[];
}

function getTournamentDates(): string[] {
  const dates: string[] = [];
  // Tournament starts March 18, 2026 (First Four)
  const start = new Date("2026-03-18T00:00:00Z");
  const today = new Date();
  // Cap at April 8 (championship game)
  const end = new Date(
    Math.min(today.getTime(), new Date("2026-04-08T23:59:59Z").getTime()),
  );

  const current = new Date(start);
  while (current <= end) {
    const yyyy = current.getUTCFullYear();
    const mm = String(current.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(current.getUTCDate()).padStart(2, "0");
    dates.push(`${yyyy}/${mm}/${dd}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export interface SyncProgress {
  stage: "fetching" | "updating" | "done";
  currentDate?: string;
  dateIndex?: number;
  totalDates?: number;
  teamCount?: number;
  updatedCount?: number;
}

// ─── Fetch & Sync Scores from NCAA.com ──────────────────────────────────────
export function useFetchAndSyncScores(
  onProgress?: (progress: SyncProgress) => void,
) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      updatedCount: number;
      message: string;
    }> => {
      if (!actor) throw new Error("Actor not ready");

      const dates = getTournamentDates();
      // Map: normalizedName -> { points: number, isEliminated: boolean }
      const teamScores = new Map<
        string,
        { points: number; isEliminated: boolean }
      >();

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        onProgress?.({
          stage: "fetching",
          currentDate: date,
          dateIndex: i + 1,
          totalDates: dates.length,
        });

        let jsonStr: string;
        try {
          jsonStr = await actor.fetchAndSyncScores(date);
        } catch {
          // Skip dates that fail (e.g., no games that day)
          continue;
        }

        let data: ApiResponse;
        try {
          data = JSON.parse(jsonStr) as ApiResponse;
        } catch {
          continue;
        }

        const games = data.games ?? [];
        for (const g of games) {
          const { gameState, away, home } = g.game;
          if (
            !gameState ||
            !["final", "f", "Final", "FINAL"].includes(
              gameState.toLowerCase().trim(),
            )
          )
            continue;

          const awayName = normalizeTeamName(away.names.short);
          const homeName = normalizeTeamName(home.names.short);
          const awayPoints = Number.parseInt(away.score, 10) || 0;
          const homePoints = Number.parseInt(home.score, 10) || 0;

          // Away team
          const awayPrev = teamScores.get(awayName) ?? {
            points: 0,
            isEliminated: false,
          };
          teamScores.set(awayName, {
            points: awayPrev.points + awayPoints,
            // Once eliminated, stays eliminated
            isEliminated: awayPrev.isEliminated || !away.winner,
          });

          // Home team
          const homePrev = teamScores.get(homeName) ?? {
            points: 0,
            isEliminated: false,
          };
          teamScores.set(homeName, {
            points: homePrev.points + homePoints,
            isEliminated: homePrev.isEliminated || !home.winner,
          });
        }
      }

      const updates: Array<[string, bigint, boolean]> = [];
      for (const [name, { points, isEliminated }] of teamScores.entries()) {
        updates.push([name, BigInt(points), isEliminated]);
      }

      onProgress?.({ stage: "updating", teamCount: updates.length });

      await actor.resetTeamScores();
      if (updates.length > 0) {
        await actor.batchUpdateTeamScores(updates);
      }

      return {
        updatedCount: updates.length,
        message: `Updated ${updates.length} team${updates.length !== 1 ? "s" : ""} from ${dates.length} date${dates.length !== 1 ? "s" : ""}`,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

// ─── Seed Teams from 2026 Bracket ────────────────────────────────────────────
export function useSeedTeamsFromBracket() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.seedTeamsFromBracket();
    },
  });
}

// ─── Get All Teams ────────────────────────────────────────────────────────────
export function useGetTeams() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as BackendWithTeams).getTeams();
    },
    enabled: !!actor && !isFetching,
  });
}
