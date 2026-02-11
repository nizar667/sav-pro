import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = "commercial" | "technicien";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "pending" | "active" | "rejected";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearOldToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearOldToken = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      console.log("🧹 Ancien token supprimé du storage");
    } catch (error) {
      console.error("Erreur suppression token:", error);
    }
  };

  useEffect(() => {
    clearOldToken().then(() => {
      loadStoredAuth();
    });
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        console.log("📱 Token chargé depuis storage:", storedToken.substring(0, 30) + "...");
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log("📱 Aucun token trouvé dans le storage");
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const baseUrl = "http://192.168.1.87:8080";
      console.log("🔐 Tentative de connexion pour:", email);
      
      const response = await fetch(new URL("/api/auth/login", baseUrl).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Erreur login:", error.message);
        
        let userMessage = error.message;
        if (response.status === 403) {
          userMessage = "⏳ Votre compte est en attente de validation par l'administrateur.";
        } else if (response.status === 401) {
          userMessage = "Email ou mot de passe incorrect";
        } else if (response.status === 400) {
          userMessage = "Email et mot de passe requis";
        }
        
        return { success: false, message: userMessage };
      }

      const data = await response.json();
      
      console.log("✅ Connexion réussie pour:", email);
      console.log("🔐 Token reçu (début):", data.token.substring(0, 50) + "...");
      
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };

    } catch (error: any) {
      console.error("❌ Login error:", error);
      
      let userMessage = "Erreur lors de la connexion";
      if (error.message && error.message.includes("Network")) {
        userMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
      } else if (error.message && error.message.includes("fetch")) {
        userMessage = "Serveur inaccessible. Vérifiez que le backend est en cours d'exécution.";
      }
      
      return { success: false, message: userMessage };
    }
  }

  async function register(email: string, password: string, name: string, role: UserRole) {
    try {
      const baseUrl = "http://192.168.1.87:8080";
      const response = await fetch(new URL("/api/auth/register", baseUrl).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message };
      }

      const data = await response.json();
      
      return { 
        success: true, 
        message: data.message || "✅ Demande d'inscription envoyée avec succès." 
      };
      
    } catch (error: any) {
      console.error("Register error:", error);
      
      let userMessage = "Erreur lors de l'inscription";
      if (error.message && error.message.includes("Network")) {
        userMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
      }
      
      return { success: false, message: userMessage };
    }
  }

  async function logout() {
    try {
      console.log("🚨 Déconnexion en cours...");
      
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      console.log("✅ Données supprimées du storage");
      
      setToken(null);
      setUser(null);
      
      console.log("✅ Déconnexion terminée");
      
    } catch (error) {
      console.error("❌ Erreur logout:", error);
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      register, 
      logout,
      clearOldToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}