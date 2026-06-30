import { api, setToken, removeToken } from '../api';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
};

type LoginResponse = { user: AuthUser; token: string };
type RegisterResponse = { user: AuthUser; token: string };
type MeResponse = { user: AuthUser };

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post<LoginResponse>('/api/auth/login', { email, password });
    if (res.data?.token) {
      await setToken(res.data.token);
    }
    return res;
  },

  async register(email: string, password: string, displayName?: string) {
    const res = await api.post<RegisterResponse>('/api/auth/register', { email, password, displayName });
    if (res.data?.token) {
      await setToken(res.data.token);
    }
    return res;
  },

  async loginWithGoogleToken(idToken: string) {
    const res = await api.post<LoginResponse>('/api/auth/google', { idToken });
    if (res.data?.token) {
      await setToken(res.data.token);
    }
    return res;
  },

  async getMe() {
    return api.get<MeResponse>('/api/auth/me');
  },

  async logout() {
    await removeToken();
  },
};
