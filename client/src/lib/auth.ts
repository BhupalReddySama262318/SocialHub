import { User, LoginData, RegisterData } from "@shared/schema";
import { apiRequest } from "./queryClient";

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'auth_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): Omit<User, 'password'> | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: Omit<User, 'password'>): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    const data = await response.json();
    
    this.setToken(data.token);
    this.setUser(data.user);
    
    return data;
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();
    
    this.setToken(data.token);
    this.setUser(data.user);
    
    return data;
  }

  static async logout(): Promise<void> {
    this.removeToken();
    localStorage.removeItem(this.USER_KEY);
  }

  static async getCurrentUser(): Promise<Omit<User, 'password'> | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.removeToken();
        return null;
      }

      const data = await response.json();
      this.setUser(data.user);
      return data.user;
    } catch (error) {
      this.removeToken();
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
