import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Info } from 'lucide-react-native';
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

export default function RegisterScreen() {
  const { styles, colors } = useStyles();
  const router = useRouter();
  const { register, loginWithGoogleToken } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const getMissingRequirementsText = () => {
    const missing = [];
    if (!hasMinLength) missing.push('Mín. 8 caracteres');
    if (!hasUpperCase) missing.push('Mayúscula');
    if (!hasLowerCase) missing.push('Minúscula');
    if (!hasNumber) missing.push('Número');
    if (!hasSpecialChar) missing.push('Carácter especial');
    return missing.join(', ');
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completá email y contraseña');
      return;
    }
    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'vstats'
      });
      
      // Google Client ID (Web Client ID format for Expo / web testing)
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '464864081976-eg3nt8ll3r510hd2o477mdk9str884j7.apps.googleusercontent.com';

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
              router.replace('/home');
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
        
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#94a3b8"
            style={[styles`bg-surface border border-gray rounded-lg px-4 text-main`, { flex: 1, height: 48 }]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          <TouchableOpacity 
            onPress={() => setShowRequirements(!showRequirements)}
            activeOpacity={0.7}
            style={{ 
              width: 48, 
              height: 48, 
              backgroundColor: colors.bgSurface, 
              borderColor: colors.borderGray, 
              borderWidth: 1, 
              borderRadius: 8, 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <Info size={20} color={showRequirements ? colors.brand : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showRequirements && (
          <View style={{ 
            backgroundColor: colors.bgSurface, 
            borderColor: colors.borderGray, 
            borderWidth: 1, 
            borderRadius: 8, 
            padding: 12, 
            marginTop: -8,
            gap: 6 
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMain, marginBottom: 2 }}>
              Requisitos de la contraseña:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={12} color={hasMinLength ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, color: hasMinLength ? colors.textMain : colors.textMuted }}>Mínimo 8 caracteres</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={12} color={hasUpperCase ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, color: hasUpperCase ? colors.textMain : colors.textMuted }}>Al menos una mayúscula</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={12} color={hasLowerCase ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, color: hasLowerCase ? colors.textMain : colors.textMuted }}>Al menos una minúscula</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={12} color={hasNumber ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, color: hasNumber ? colors.textMain : colors.textMuted }}>Al menos un número</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={12} color={hasSpecialChar ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, color: hasSpecialChar ? colors.textMain : colors.textMuted }}>Al menos un carácter especial (ej: !@#$%)</Text>
            </View>
          </View>
        )}

        {password.length > 0 && !isPasswordValid && (
          <Text style={{ fontSize: 12, color: colors.danger, paddingHorizontal: 4, marginTop: -8 }}>
            Falta: {getMissingRequirementsText()}
          </Text>
        )}

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
              { fontFamily: 'Gotham Rounded', letterSpacing: 1 }
            ]}>
              CREAR CUENTA
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
          <Text style={{ marginHorizontal: 8, fontSize: 12, color: colors.textMuted }}>O</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderGray }} />
        </View>

        {/* Google Register Button */}
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
            REGISTRARSE CON GOOGLE
          </Text>
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
