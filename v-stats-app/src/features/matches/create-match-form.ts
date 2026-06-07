export const MIN_PLAYERS_REQUIRED = 6;

export function hasMinimumPlayersSelected(selectedPlayerIds: string[]) {
  return selectedPlayerIds.length >= MIN_PLAYERS_REQUIRED;
}

export function canStartMatch(rivalName: string, selectedPlayerIds: string[]) {
  return Boolean(rivalName.trim()) && hasMinimumPlayersSelected(selectedPlayerIds);
}

export function toggleAllPlayers(currentSelectedIds: string[], rosterIds: string[]) {
  return currentSelectedIds.length === rosterIds.length ? [] : rosterIds;
}
