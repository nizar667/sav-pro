import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createClient } from "@supabase/supabase-js";

// Configuration Supabase
const supabaseUrl = "https://ousjubtwfvptzjpiaqsc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2p1YnR3ZnZwdHpqcGlhcXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTcxMjYsImV4cCI6MjA4NTc3MzEyNn0.l8Dq4qdXCoa9rc_Vyhy8JEixnbGpiK1SoZSU1a1PWzk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function registerRoutes(app: Express): Promise<Server> {
  // ================ AUTHENTIFICATION ================
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      if (!["commercial", "technicien"].includes(role)) {
        return res.status(400).json({ message: "Rôle invalide" });
      }

      // Vérifier si l'email existe déjà
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(409).json({ message: "Cet email est déjà utilisé" });
      }

      // Créer l'utilisateur
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email: email.toLowerCase(),
          password_hash: password,
          name,
          role,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: "✅ Demande d'inscription envoyée. En attente de validation.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      // Récupérer l'utilisateur
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (error || !user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Vérifier le statut
      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "⏳ Votre compte est en attente de validation par l'administrateur.",
        });
      }

      // Vérifier le mot de passe (en clair pour la démo)
      if (user.password_hash !== password) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Générer un token simple
      const token = `jwt_${Date.now()}_${user.id}`;

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  // ================ CLIENTS ================
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Non authentifié" });

      // Pour la démo, retourner tous les clients
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) throw error;
      res.json(clients || []);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ================ CATÉGORIES ================
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      res.json(categories || []);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ================ DÉCLARATIONS ================
  app.get("/api/declarations", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Non authentifié" });

      const { data: declarations, error } = await supabase
        .from("declarations")
        .select(`
          *,
          client:clients(*),
          category:categories(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(declarations || []);
    } catch (error) {
      console.error("Get declarations error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ================ ROUTE DE TEST ================
  app.get("/api/test", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "✅ Backend SAV Pro avec Supabase fonctionnel",
      timestamp: new Date().toISOString(),
      supabase: "Connecté",
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}