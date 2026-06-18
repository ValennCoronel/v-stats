import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyles } from '../../../hooks/useStyles';

interface RecentMatchesListProps {
  recentMatches: any[];
  activeTeam: any;
}

export function RecentMatchesList({ recentMatches, activeTeam }: RecentMatchesListProps) {
  const router = useRouter();
  const { styles, fonts, colors } = useStyles();

  return (
    <View>
      <View style={styles`flex-row items-center justify-between mb-3`}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, letterSpacing: 1 }}>
          ÚLTIMOS RESULTADOS
        </Text>
        <TouchableOpacity onPress={() => router.push(`/team/${activeTeam?.id}`)}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary, letterSpacing: 0.5 }}>
            VER TODOS
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles`rounded-2xl border bg-surface overflow-hidden`, { borderColor: colors.borderLight }]}>
        {recentMatches.length > 0 ? (
          recentMatches.map((match, idx) => {
            const isWin = match.result === 'WIN';
            const setsWon = match.setScores?.filter((s: any) => s.teamPts > s.oppPts).length || 0;
            const setsLost = match.setScores?.filter((s: any) => s.oppPts > s.teamPts).length || 0;

            return (
              <View key={match.id} style={[{ padding: 16, flexDirection: 'row', alignItems: 'center' }, idx !== recentMatches.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isWin ? colors.success : colors.danger, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: '#FFF', marginTop: 1 }}>{isWin ? 'V' : 'D'}</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMain }}>{activeTeam?.name}</Text>
                <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain, marginHorizontal: 16 }}>{setsWon} - {setsLost}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMain }} numberOfLines={1}>{match.opponentTeam?.name || match.opponent}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{new Date(match.date).toLocaleDateString('es-AR')}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted }}>No hay partidos recientes</Text>
          </View>
        )}
      </View>
    </View>
  );
}
