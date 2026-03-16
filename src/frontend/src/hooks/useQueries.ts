import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TournamentPhase, backendInterface } from "../backend";
import type { BackendWithTeams } from "../lib/backendTypes";
import { useActor } from "./useActor";

// Extended interface to include deleteEntry (added in backend but not yet in generated types)
type BackendWithDelete = backendInterface & {
  deleteEntry(entryId: bigint): Promise<void>;
};

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
      return (actor as unknown as BackendWithDelete).deleteEntry(entryId);
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

// ─── Fetch & Sync Scores from NCAA.com ──────────────────────────────────────
export function useFetchAndSyncScores() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.fetchAndSyncScores();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
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
