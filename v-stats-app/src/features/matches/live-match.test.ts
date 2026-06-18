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
  it('treats only the six assigned starters as active before the first rally is recorded', () => {
    expect(getEffectiveActivePlayerIds([], null, assigned)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
    ]);
    expect(canRecordStatForPlayer('p3', [], null, assigned)).toBe(true);
    expect(canRecordStatForPlayer('lib', [], null, assigned)).toBe(false);
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
      courtPlayers: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'bench-1' }],
      libero: null,
      bench: [{ id: 'lib' }],
    });
  });

  it('brings the libero in only after replacing a court player', () => {
    const result = substitutePlayingPlayer(
      [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }, { id: 'p6' }],
      null,
      [{ id: 'lib', isLibero: true }, { id: 'bench-1' }],
      'p6',
      { id: 'lib', isLibero: true },
    );

    expect(result).toEqual({
      courtPlayers: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }],
      libero: { id: 'lib', isLibero: true },
      bench: [{ id: 'p6' }, { id: 'bench-1' }],
    });
  });
});
