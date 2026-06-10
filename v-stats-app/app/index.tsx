import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useStyles } from '../src/hooks/useStyles';
import { useAuth } from '../src/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#EA4335"
      d="M12 5.04c1.67 0 3.17.58 4.35 1.71l3.25-3.25C17.65 1.62 15.02 1 12 1 7.37 1 3.4 3.65 1.48 7.51l3.89 3.02c.92-2.78 3.51-4.8 6.63-4.8z"
    />
    <Path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.14-1.97 3.74-4.86 3.74-8.49z"
    />
    <Path
      fill="#FBBC05"
      d="M5.37 14.53c-.24-.72-.37-1.49-.37-2.28s.13-1.56.37-2.28L1.48 6.95C.53 8.85 0 10.98 0 13.25s.53 4.4 1.48 6.3l3.89-3.02z"
    />
    <Path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.1.74-2.51 1.18-4.29 1.18-3.12 0-5.71-2.02-6.65-4.8L1.46 16.55C3.38 20.39 7.36 23 12 23z"
    />
  </Svg>
);

export default function LoginScreen() {
  const { styles, colors } = useStyles();
  const router = useRouter();
  const { login, loginWithGoogleToken, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completá email y contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Credenciales inválidas');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'vstats'
      });
      
      // Google Client ID (Web Client ID format for Expo / web testing)
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '1081541819582-7p6n0s5vdfu00mcrhml4j70gfe9q6k6j.apps.googleusercontent.com';

      const queryParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: Math.random().toString(36).substring(2),
      });

      const fullAuthUrl = `${authUrl}?${queryParams.toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(fullAuthUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const hash = result.url.split('#')[1] || result.url.split('?')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');
          if (idToken) {
            const res = await loginWithGoogleToken(idToken);
            if (res.success) {
              router.replace('/(tabs)');
              return;
            } else {
              setError(res.error || 'Error en la autenticación de Google');
            }
          } else {
            setError('No se pudo obtener el token de identidad de Google.');
          }
        } else {
          setError('Respuesta de autenticación de Google inválida.');
        }
      } else if (result.type === 'cancel') {
        setError('Inicio de sesión cancelado.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con Google: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles`flex-1 bg-main justify-center items-center px-6`}>
      
      {/* Logo y Header */}
      <View style={styles`mb-8 items-center`}>
        <Text style={[
          styles`text-brand`, 
          { fontFamily: 'Gotham Rounded', fontSize: 56, fontWeight: '700', lineHeight: 60 }
        ]}>
          V-STATS
        </Text>
        <Text style={[
          styles`text-brand`, 
          { fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }
        ]}>
          Datos que ganan partidos
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
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          style={styles`w-full h-12 bg-surface border border-gray rounded-lg px-4 text-main`}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          onSubmitEditing={handleLogin}
        />

        {/* Botón Principal */}
        <TouchableOpacity
          onPress={handleLogin}
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
              { fontFamily: 'Gotham Rounded', letterSpacing: 1 }
            ]}>
              INICIAR SESIÓN
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
          <Text style={{ marginHorizontal: 8, fontSize: 12, color: colors.textMuted }}>O</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
          disabled={isLoading}
          style={[
            styles`w-full h-12 bg-surface border border-gray rounded-lg justify-center items-center flex-row gap-2`,
            isLoading && { opacity: 0.6 }
          ]}
        >
          <GoogleIcon size={20} />
          <Text style={[
            styles`text-main text-bold`,
            { fontSize: 14 }
          ]}>
            CONTINUAR CON GOOGLE
          </Text>
        </TouchableOpacity>

        {/* Link inferior */}
        <View style={styles`mt-4 items-center`}>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles`text-muted text-sm`}>
              ¿No tenés cuenta? <Text style={styles`text-brand text-bold`}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
  );
}