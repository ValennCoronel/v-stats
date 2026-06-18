import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight, BarChart3, TrendingUp, Shield, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStyles } from '../../../hooks/useStyles';

interface TeamSummaryCardProps {
  activeTeam: any;
  totalMatchesCount: number;
  winsCount: number;
  lossesCount: number;
  winRatePercent: number;
  attackEff: number;
  receptionEff: number;
  serveEff: number;
  onSelectTeam: () => void;
}

export function TeamSummaryCard({
  activeTeam,
  totalMatchesCount,
  winsCount,
  lossesCount,
  winRatePercent,
  attackEff,
  receptionEff,
  serveEff,
  onSelectTeam
}: TeamSummaryCardProps) {
  const router = useRouter();
  const { styles, fonts, colors } = useStyles();

  return (
    <View>
      <LinearGradient 
        colors={['#E0F2FE', '#BAE6FD']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 8 }}
      >
        <View style={{ padding: 16 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: '#64748B', letterSpacing: 1, marginBottom: 4 }}>
            EQUIPO ACTIVO
          </Text>
          <TouchableOpacity 
            style={styles`flex-row items-center gap-2 mb-1`}
            onPress={onSelectTeam}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: '#0D1F33', letterSpacing: 0.5 }}>
              {activeTeam?.name || 'Sin equipo'}
            </Text>
            <View style={{ backgroundColor: '#1E6FD9', borderRadius: 6, padding: 4, marginLeft: 4 }}>
              <ChevronDown size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: '#475569', marginBottom: 20 }}>
            Vóley Femenino · Primera
          </Text>

          <View style={styles`flex-row justify-between mb-4`}>
            {/* Partidos */}
            <View style={[styles`items-center`, { flex: 1 }]}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{totalMatchesCount}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>PARTIDOS</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />
            {/* Victorias */}
            <View style={[styles`items-center`, { flex: 1 }]}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{winsCount}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>VICTORIAS</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />
            {/* Derrotas */}
            <View style={[styles`items-center`, { flex: 1 }]}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{lossesCount}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>DERROTAS</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />
            {/* Efectividad */}
            <View style={[styles`items-center`, { flex: 1 }]}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{winRatePercent}%</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>EFECTIVIDAD</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/stats/general')} 
            activeOpacity={0.8}
            style={{ width: '100%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#93C5FD', backgroundColor: 'rgba(255, 255, 255, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <BarChart3 size={16} color="#1E6FD9" />
            <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: '#1E6FD9', letterSpacing: 0.5, marginTop: 2 }}>VER ANÁLISIS COMPLETO</Text>
            <View style={{ position: 'absolute', right: 16 }}>
              <ChevronRight size={18} color="#1E6FD9" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Resumen de Eficiencias */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, letterSpacing: 1, marginBottom: 12 }}>
          RESUMEN DEL EQUIPO
        </Text>
        <View style={styles`flex-row justify-between gap-2`}>
          {/* Ataque */}
          <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30, 111, 217, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <TrendingUp size={18} color="#1E6FD9" />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{attackEff}%</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>ATAQUE</Text>
          </View>

          {/* Recepcion */}
          <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(22, 163, 74, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Shield size={18} color="#16A34A" />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{receptionEff}%</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>RECEPCIÓN</Text>
          </View>

          {/* Saque */}
          <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Target size={18} color="#F59E0B" />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{serveEff}%</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>SAQUE</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
