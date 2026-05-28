import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyles } from '../src/hooks/useStyles';
import { useAuth } from '../src/context/AuthContext';

export default function RegisterScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completá email y contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await register(
      email.trim().toLowerCase(),
      password,
      displayName.trim() || undefined,
    );

    if (result.success) {
      router.replace('/home');
    } else {
      setError(result.error || 'Error al registrarse');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles`flex-1 bg-main justify-center items-center px-6`}>
      
      {/* Logo y Header */}
      <View style={styles`mb-8 items-center`}>
        <Text style={[
          styles`text-brand`, 
          { fontFamily: 'Barlow Condensed', fontSize: 56, fontWeight: '700', lineHeight: 60 }
        ]}>
          V-STATS
        </Text>
        <Text style={[
          styles`text-brand`, 
          { fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }
        ]}>
          Creá tu cuenta
        </Text>
      </View>

      {/* Formulario */}
      <View style={styles`w-full max-w-sm gap-4`}>
        
        {error ? (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor="#94a3b8"
          style={styles`w-full h-12 bg-surface border border-gray rounded-lg px-4 text-main`}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!isLoading}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles`w-full h-12 bg-surface border border-gray rounded-lg px-4 text-main`}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        
        <TextInput
          placeholder="Contraseña (mín. 6 caracteres)"
          placeholderTextColor="#94a3b8"
          style={styles`w-full h-12 bg-surface border border-gray rounded-lg px-4 text-main`}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <TextInput
          placeholder="Confirmar contraseña"
          placeholderTextColor="#94a3b8"
          style={styles`w-full h-12 bg-surface border border-gray rounded-lg px-4 text-main`}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
          onSubmitEditing={handleRegister}
        />

        {/* Botón Principal */}
        <TouchableOpacity
          onPress={handleRegister}
          activeOpacity={0.8}
          disabled={isLoading}
          style={[
            styles`w-full h-12 bg-brand rounded-lg justify-center items-center`,
            isLoading && { opacity: 0.6 }
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[
              styles`text-white text-bold`, 
              { fontFamily: 'Barlow Condensed', letterSpacing: 1 }
            ]}>
              CREAR CUENTA
            </Text>
          )}
        </TouchableOpacity>

        {/* Link inferior */}
        <View style={styles`mt-4 items-center`}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles`text-muted text-sm`}>
              ¿Ya tenés cuenta? <Text style={styles`text-brand text-bold`}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
  );
}
