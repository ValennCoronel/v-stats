import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TeamMatchesScreen from '../app/team/[id]';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGetMatches: any = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({ id: 'team-1' }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../src/hooks/useStyles', () => ({
  useStyles: () => ({
    styles: () => [],
  }),
}));

jest.mock('../src/context/ProfileContext', () => ({
  useProfile: () => ({
    activeProfile: {
      clubName: 'Club Aurora',
      color: '#1E6FD9',
      teams: [{ id: 'team-1', name: 'Primera' }],
      players: [
        { id: 'p1', name: 'Ana', number: 1, position: 'SETTER', isActive: true },
        { id: 'p2', name: 'Belen', number: 2, position: 'SETTER', isActive: true },
        { id: 'p3', name: 'Carla', number: 3, position: 'SETTER', isActive: true },
        { id: 'p4', name: 'Delfi', number: 4, position: 'SETTER', isActive: true },
        { id: 'p5', name: 'Emma', number: 5, position: 'SETTER', isActive: true },
        { id: 'p6', name: 'Flor', number: 6, position: 'SETTER', isActive: true },
        { id: 'p7', name: 'Gabi', number: 7, position: 'SETTER', isActive: true },
      ],
    },
  }),
}));

jest.mock('../src/services/matches.service', () => ({
  matchesService: {
    getMatches: (...args: unknown[]) => mockGetMatches(...args),
  },
}));

describe('TeamMatchesScreen match creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetMatches.mockResolvedValue({ data: { matches: [] } });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('supports mark all and unmark all while enforcing a minimum of six players', async () => {
    render(<TeamMatchesScreen />);

    await waitFor(() => {
      expect(mockGetMatches).toHaveBeenCalledWith('team-1', 'finished');
    });

    fireEvent.press(screen.getByText('NUEVO PARTIDO'));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText('7 jugadores seleccionados')).toBeTruthy();

    fireEvent.press(screen.getByText('DESMARCAR TODO'));
    expect(screen.getByText('0 jugadores seleccionados')).toBeTruthy();
    expect(screen.getByText('Se necesitan al menos 6 jugadoras para comenzar.')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Nombre del rival'), 'Las Panteras');
    expect(screen.getByTestId('start-match-button').props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByText('MARCAR TODO'));
    expect(screen.getByText('7 jugadores seleccionados')).toBeTruthy();
    expect(screen.getByTestId('start-match-button').props.accessibilityState?.disabled).toBe(false);
  });

  it('keeps the start button disabled when only five players are selected', async () => {
    render(<TeamMatchesScreen />);

    await waitFor(() => {
      expect(mockGetMatches).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('NUEVO PARTIDO'));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.changeText(screen.getByPlaceholderText('Nombre del rival'), 'Las Panteras');

    fireEvent.press(screen.getByText('Gabi'));

    expect(screen.getByText('6 jugadores seleccionados')).toBeTruthy();
    expect(screen.getByTestId('start-match-button').props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(screen.getByText('Flor'));

    expect(screen.getByText('5 jugadores seleccionados')).toBeTruthy();
    expect(screen.getByTestId('start-match-button').props.accessibilityState?.disabled).toBe(true);
  });
});
