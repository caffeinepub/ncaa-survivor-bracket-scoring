import type { backendInterface } from "../backend";

export interface BackendWithTeams extends backendInterface {
  getTeams(): Promise<
    Array<{
      id: bigint;
      name: string;
      seed: bigint;
      status: { active: null } | { eliminated: null };
      points: bigint;
    }>
  >;
}
