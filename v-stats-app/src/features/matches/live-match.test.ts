import { describe, expect, it } from '@jest/globals';
import {
  canRecordStatForPlayer,
  getEffectiveActivePlayerIds,
  substitutePlayingPlayer,
} from './live-match';

const assigned = [
  { id: 'p1' },
  { id: 'p2' },
  { id: 'p3' },
  { id: 'p4' },
  { id: 'p5' },
  { id: 'p6' },
  { id: 'lib' },
];

describe('live-match playing rules', () => {
  it('treats assigned starters as active before the first rally is recorded', () => {
    expect(getEffectiveActivePlayerIds([], null, assigned)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'lib',
    ]);
    expect(canRecordStatForPlayer('p3', [], null, assigned)).toBe(true);
    expect(canRecordStatForPlayer('bench-1', [], null, assigned)).toBe(false);
  });

  it('substitutes a court player with a bench player', () => {
    const result = substitutePlayingPlayer(
      [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      { id: 'lib' },
      [{ id: 'bench-1' }, { id: 'bench-2' }],
      'p2',
      { id: 'bench-1' },
    );

    expect(result).toEqual({
      courtPlayers: [{ id: 'p1' }, { id: 'bench-1' }, { id: 'p3' }],
      libero: { id: 'lib' },
      bench: [{ id: 'p2' }, { id: 'bench-2' }],
    });
  });

  it('substitutes the libero with a bench player', () => {
    const result = substitutePlayingPlayer(
      [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      { id: 'lib' },
      [{ id: 'bench-1' }],
      'lib',
      { id: 'bench-1' },
    );

    expect(result).toEqual({
      courtPlayers: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      libero: { id: 'bench-1' },
      bench: [{ id: 'lib' }],
    });
  });
});
