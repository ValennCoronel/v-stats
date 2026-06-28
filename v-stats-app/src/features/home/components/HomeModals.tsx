import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Share } from 'lucide-react-native';
import { useStyles } from '../../../hooks/useStyles';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export function ClubSelectorModal({ visible, onClose, profiles, activeProfileId, onSelect }: any) {
  const { fonts, colors } = useStyles();

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Club</Text>
      {profiles?.map((profile: any) => (
        <TouchableOpacity
          key={profile.id}
          style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => onSelect(profile.id)}
        >
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeProfileId === profile.id ? colors.primary : colors.textMain }}>{profile.clubName}</Text>
          {activeProfileId === profile.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
        </TouchableOpacity>
      ))}
      {(!profiles || profiles.length === 0) && (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay clubes disponibles</Text>
      )}
    </Modal>
  );
}

export function TeamSelectorModal({ visible, onClose, teams, activeTeamId, onSelect }: any) {
  const { fonts, colors } = useStyles();

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Equipo</Text>
      {teams?.map((team: any) => (
        <TouchableOpacity
          key={team.id}
          style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => onSelect(team.id)}
        >
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeTeamId === team.id ? colors.primary : colors.textMain }}>{team.name}</Text>
          {activeTeamId === team.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
        </TouchableOpacity>
      ))}
      {(!teams || teams.length === 0) && (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay equipos disponibles</Text>
      )}
    </Modal>
  );
}

export function ShareStatsModal({ visible, onClose, teamName, shareUrl, isLoading, errorMessage, onShareAgain }: any) {
  const { fonts, colors } = useStyles();

  return (
    <Modal visible={visible} onClose={onClose} contentStyle={{ alignItems: 'center' }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Share size={32} color={colors.primary} />
      </View>
      <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, marginBottom: 8 }}>
        Compartir estadísticas
      </Text>

      {isLoading ? (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 14 }}>
            Generando el link público para {teamName || 'tu equipo'}...
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            Comparte este link con {teamName || 'tu equipo'} para que puedan abrir el dashboard público desde cualquier navegador.
          </Text>
          {errorMessage ? (
            <View style={{ width: '100%', borderRadius: 16, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', padding: 14, marginBottom: 12 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B91C1C' }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}
          <View style={{ width: '100%', borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.bgMain, padding: 14, marginBottom: 20 }}>
            <Text selectable style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMain }}>
              {shareUrl || 'Todavía no se generó ningún link. Tocá el botón para crearlo.'}
            </Text>
          </View>
          <View style={{ width: '100%', gap: 10 }}>
            <Button variant="primary" onPress={onShareAgain} isLoading={isLoading}>
              {shareUrl ? 'Compartir link' : 'Generar link'}
            </Button>
            <Button variant="outline" onPress={onClose}>Cerrar</Button>
          </View>
        </>
      )}
    </Modal>
  );
}

export function ActiveMatchModal({ visible, onClose, activeMatch, onResume, onDelete }: any) {
  const { fonts, colors } = useStyles();

  return (
    <Modal visible={visible} onClose={onClose} contentStyle={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>🏐</Text>
      <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 8, textAlign: 'center' }}>
        Partido en Curso
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
        Tenés un partido sin finalizar contra:
      </Text>

      {activeMatch && (
        <View style={{ backgroundColor: colors.bgMain, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.primary }}>
            {activeMatch.metadata?.rival || "Rival"}
          </Text>
          {activeMatch.metadata?.torneo ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              {activeMatch.metadata.torneo}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
              Set {activeMatch.currentSet}
            </Text>
            <Text style={{ color: colors.border }}>|</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
              Marcador: {activeMatch.homeScore} - {activeMatch.awayScore}
            </Text>
          </View>
        </View>
      )}

      <View style={{ width: '100%', gap: 10 }}>
        <Button variant="primary" onPress={onResume}>VOLVER AL PARTIDO</Button>
        <Button variant="outline" onPress={onClose}>CONTINUAR NAVEGANDO</Button>
        <Button variant="danger" onPress={onDelete} className="mt-2 bg-transparent text-red-500">
          Eliminar partido en curso
        </Button>
      </View>
    </Modal>
  );
}
