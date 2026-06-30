export type ActivePlayerLike = { id: string };

export function getActivePlayerIds<T extends ActivePlayerLike>(courtPlayers: T[], libero: T | null): string[] {
  return [...courtPlayers, ...(libero ? [libero] : [])].map((player) => player.id);
}

export function getEffectiveActivePlayerIds<T extends ActivePlayerLike>(
  courtPlayers: T[],
  libero: T | null,
  assignedSlots: (T | null)[],
): string[] {
  const liveIds = getActivePlayerIds(courtPlayers, libero);
  if (liveIds.length > 0) return liveIds;

  return assignedSlots
    .slice(0, 6)
    .filter((player): player is T => player !== null)
    .map((player) => player.id);
}

export function canRecordStatForPlayer<T extends ActivePlayerLike>(
  playerId: string,
  courtPlayers: T[],
  libero: T | null,
  assignedSlots: (T | null)[],
): boolean {
  return getEffectiveActivePlayerIds(courtPlayers, libero, assignedSlots).includes(playerId);
}

export function substitutePlayingPlayer<T extends ActivePlayerLike>(
  courtPlayers: (T & { isLibero?: boolean })[],
  libero: (T & { isLibero?: boolean }) | null,
  bench: (T & { isLibero?: boolean })[],
  playerOutId: string,
  benchPlayer: T & { isLibero?: boolean },
) {
  const courtIndex = courtPlayers.findIndex((player) => player.id === playerOutId);
  const liberoOut = libero?.id === playerOutId ? libero : null;

  if (courtIndex === -1 && !liberoOut) {
    return null;
  }

  const benchIndex = bench.findIndex((player) => player.id === benchPlayer.id);
  if (benchIndex === -1) {
    return null;
  }

  const nextCourtPlayers = [...courtPlayers];
  let nextLibero = libero;
  const playerLeavingCourt = courtIndex >= 0 ? courtPlayers[courtIndex] : liberoOut!;

  if (courtIndex >= 0 && !libero && benchPlayer.isLibero) {
    nextCourtPlayers.splice(courtIndex, 1);
    nextLibero = benchPlayer;
  } else if (courtIndex >= 0) {
    nextCourtPlayers[courtIndex] = benchPlayer;
  } else if (liberoOut && !benchPlayer.isLibero) {
    nextLibero = null;
    nextCourtPlayers.push(benchPlayer);
  } else {
    nextLibero = benchPlayer;
  }

  const nextBench = [...bench];
  nextBench[benchIndex] = playerLeavingCourt;

  return {
    courtPlayers: nextCourtPlayers,
    libero: nextLibero,
    bench: nextBench,
  };
}
