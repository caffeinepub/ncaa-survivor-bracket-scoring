import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TournamentPhase } from "../backend";
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
      picks,
    }: {
      participantName: string;
      picks: Array<[bigint, bigint]>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.registerEntry(participantName, picks);
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
