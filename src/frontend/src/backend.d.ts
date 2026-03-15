import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Entry {
    paymentConfirmed: boolean;
    participantName: string;
    activeTeams: bigint;
    email: string;
    totalPoints: bigint;
    picks: Array<[bigint, bigint]>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Team {
    id: bigint;
    status: Variant_active_eliminated;
    name: string;
    seed: bigint;
    points: bigint;
}
export enum TournamentPhase {
    registration = "registration",
    complete = "complete",
    inProgress = "inProgress"
}
export enum Variant_active_eliminated {
    active = "active",
    eliminated = "eliminated"
}
export interface backendInterface {
    addTeam(name: string, seed: bigint): Promise<bigint>;
    confirmPayment(entryId: bigint): Promise<void>;
    fetchAndSyncScores(): Promise<string>;
    getEntry(entryId: bigint): Promise<Entry>;
    getLeaderboard(): Promise<Array<[bigint, Entry]>>;
    getTeams(): Promise<Array<Team>>;
    registerEntry(participantName: string, email: string, picks: Array<[bigint, bigint]>): Promise<bigint>;
    seedTeamsFromBracket(): Promise<bigint>;
    setTournamentPhase(phase: TournamentPhase): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unconfirmPayment(entryId: bigint): Promise<void>;
}
