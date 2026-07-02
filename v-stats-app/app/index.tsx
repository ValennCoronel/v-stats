import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useStyles } from '../src/hooks/useStyles';
import { useAuth } from '../src/context/AuthContext';
import { GoogleIcon } from '../src/components/icons/GoogleIcon';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Divider } from '../src/components/ui/Divider';

WebBrowser.maybeCompleteAuthSession();

if (Platform.OS !== 'web') {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({
    webClientId: '443822343518-7kd3erur2pm6gfsiemcf87fh9tcjq7m5.apps.googleusercontent.com',
    offlineAccess: true,
  });
}

export default function LoginScreen() {
  const { styles, colors } = useStyles();
  const router = useRouter();
  const { login, loginWithGoogleToken, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [authLoading, isAuthenticated]);

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

      if (Platform.OS === 'web') {
        const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'vstats'
        });
        
        const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '443822343518-7kd3erur2pm6gfsiemcf87fh9tcjq7m5.apps.googleusercontent.com';

        const queryParams = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'id_token',
          scope: 'openid email profile',
          prompt: 'select_account',
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
      } else {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const idToken = userInfo.data?.idToken;
        
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

        <Input
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        
        <Input
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          onSubmitEditing={handleLogin}
        />

        {/* Botón Principal */}
        <Button
          variant="primary"
          onPress={handleLogin}
          isLoading={isLoading}
        >
          INICIAR SESIÓN
        </Button>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
          <Text style={{ marginHorizontal: 8, fontSize: 12, color: colors.textMuted }}>O</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
        </View>

        {/* Google Login Button */}
        <Button
          variant="secondary"
          onPress={handleGoogleLogin}
          isLoading={isLoading}
          leftIcon={<GoogleIcon size={20} />}
        >
          CONTINUAR CON GOOGLE
        </Button>

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