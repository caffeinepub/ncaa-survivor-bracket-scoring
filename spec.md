# NCAA Survivor Bracket Scoring

## Current State
The app has a `fetchAndSyncScores()` backend function that calls `data.ncaa.com/casablanca/scoreboard/basketball-men/d1/scoreboard.json` (no date parameter). This URL returns 404. The function returns raw JSON text but never parses it or updates team points/statuses. Team scores are never actually applied.

## Requested Changes (Diff)

### Add
- `fetchAndSyncScores(date: Text)` now accepts a date string (YYYY/MM/DD) and uses the working proxy `https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1/YYYY/MM/DD`
- New backend function `resetTeamScores()` — resets all teams to points=0 and status=#active
- New backend function `batchUpdateTeamScores(updates: [(Text, Nat, Bool)])` — accepts array of (teamShortName, totalPointsScored, isEliminated), matches by team name (case-insensitive fuzzy), updates team points and status
- Frontend sync logic: fetches all tournament dates from March 18 through today, parses each date's game JSON, accumulates per-team points from final games, then calls resetTeamScores + batchUpdateTeamScores

### Modify
- `fetchAndSyncScores` signature: now takes a `date: Text` param and returns the raw JSON for that date
- Admin sync button: now triggers multi-date fetch + parse + batch update flow

### Remove
- Old hardcoded URL with no date in `fetchAndSyncScores`

## Implementation Plan
1. Update Motoko backend: change `fetchAndSyncScores` to accept a date string, use correct URL. Add `resetTeamScores()` and `batchUpdateTeamScores(updates: [(Text, Nat, Bool)])` functions.
2. Regenerate IDL/bindings.
3. Update frontend Admin page: on Sync Scores click, loop through tournament dates (Mar 18 through today), call `fetchAndSyncScores(date)` for each, parse JSON response, accumulate team scores from final games, call `resetTeamScores` then `batchUpdateTeamScores`.
4. Match API team short names (e.g. "TCU", "Ohio St.", "Saint Mary's (CA)") to stored team names using normalized comparison.
