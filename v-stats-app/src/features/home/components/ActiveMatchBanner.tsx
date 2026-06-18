import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyles } from '../../../hooks/useStyles';

interface ActiveMatchBannerProps {
  activeMatch: any;
}

export function ActiveMatchBanner({ activeMatch }: ActiveMatchBannerProps) {
  const router = useRouter();
  const { fonts } = useStyles();

  if (!activeMatch) return null;

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => {
        router.push({
          pathname: '/match/new',
          params: { resume: 'true' }
        });
      }}
      style={{ 
        backgroundColor: 'rgba(30,111,217,0.08)', 
        borderColor: '#1E6FD9', 
        borderWidth: 1.5, 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 8, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(30,111,217,0.15)', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>🏐</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#1E6FD9', letterSpacing: 0.5 }}>
            PARTIDO EN CURSO
          </Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: '#0D1F33', marginTop: 2 }} numberOfLines={1}>
            vs {activeMatch.metadata?.rival || "Rival"}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: '#64748B', marginTop: 1 }}>
            Set {activeMatch.currentSet} · {activeMatch.homeScore} - {activeMatch.awayScore}
          </Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#1E6FD9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff', letterSpacing: 0.5 }}>
          REANUDAR
        </Text>
      </View>
    </TouchableOpacity>
  );
}
