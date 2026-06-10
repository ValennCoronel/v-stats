import { describe, expect, it } from '@jest/globals';
import {
  MIN_PLAYERS_REQUIRED,
  canStartMatch,
  hasMinimumPlayersSelected,
  toggleAllPlayers,
} from './create-match-form';

describe('create-match-form helpers', () => {
  it('requires at least six selected players', () => {
    expect(hasMinimumPlayersSelected(['1', '2', '3', '4', '5'])).toBe(false);
    expect(hasMinimumPlayersSelected(['1', '2', '3', '4', '5', '6'])).toBe(true);
  });

  it('requires both a rival name and the minimum roster size', () => {
    const sixPlayers = ['1', '2', '3', '4', '5', '6'];

    expect(canStartMatch('', sixPlayers)).toBe(false);
    expect(canStartMatch('  ', sixPlayers)).toBe(false);
    expect(canStartMatch('Rival', sixPlayers.slice(0, MIN_PLAYERS_REQUIRED - 1))).toBe(false);
    expect(canStartMatch('Rival', sixPlayers)).toBe(true);
  });

  it('toggles between selecting all roster players and clearing the selection', () => {
    const rosterIds = ['1', '2', '3', '4', '5', '6', '7'];

    expect(toggleAllPlayers(['1', '2'], rosterIds)).toEqual(rosterIds);
    expect(toggleAllPlayers(rosterIds, rosterIds)).toEqual([]);
  });
});
