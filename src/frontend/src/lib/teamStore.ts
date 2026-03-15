// Local team store using localStorage to persist teams added via admin

export interface LocalTeam {
  id: number;
  name: string;
  seed: number;
}

const STORAGE_KEY = "ncaa_survivor_teams";

export function getLocalTeams(): LocalTeam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalTeam[];
  } catch {
    return [];
  }
}

export function addLocalTeam(team: LocalTeam): void {
  const teams = getLocalTeams();
  // Avoid duplicates by id
  if (!teams.find((t) => t.id === team.id)) {
    teams.push(team);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  }
}

export function setLocalTeams(teams: LocalTeam[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

export function getTeamsBySeed(seed: number): LocalTeam[] {
  return getLocalTeams().filter((t) => t.seed === seed);
}

export function getTeamById(id: number): LocalTeam | undefined {
  return getLocalTeams().find((t) => t.id === id);
}

export function clearLocalTeams(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Local game results store
export interface LocalGame {
  id: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  round: number;
  recordedAt: string;
}

const GAMES_KEY = "ncaa_survivor_games";

export function getLocalGames(): LocalGame[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalGame[];
  } catch {
    return [];
  }
}

export function addLocalGame(game: LocalGame): void {
  const games = getLocalGames();
  games.push(game);
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

// Tournament phase store
const PHASE_KEY = "ncaa_survivor_phase";

export function getLocalPhase(): string {
  return localStorage.getItem(PHASE_KEY) || "registration";
}

export function setLocalPhase(phase: string): void {
  localStorage.setItem(PHASE_KEY, phase);
}
