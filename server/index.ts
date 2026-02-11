import express from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

const supabaseUrl = "https://ousjubtwfvptzjpiaqsc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2p1YnR3ZnZwdHpqcGlhcXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTcxMjYsImV4cCI6MjA4NTc3MzEyNn0.l8Dq4qdXCoa9rc_Vyhy8JEixnbGpiK1SoZSU1a1PWzk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const port = 8080;
const JWT_SECRET = process.env.JWT_SECRET || "sav-pro-secret-key-change-in-production";
const SALT_ROUNDS = 10;

app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ================ MIDDLEWARE D'AUTHENTIFICATION ================
interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

async function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token d'authentification requis" });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      name: string;
    };
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    next();
    return;
  } catch (jwtError: any) {
    console.log(`❌ JWT invalide: ${jwtError.message}`);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

// ================ ROUTES ================

// Test
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "✅ Backend fonctionnel" });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("🔐 POST /api/auth/login");
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) {
      console.log("❌ Utilisateur non trouvé:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (user.status !== "active") {
      console.log("❌ Compte non actif:", email, "status:", user.status);
      return res.status(403).json({ message: "⏳ Compte en attente de validation" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    console.log("✅ Login réussi pour:", email);
    
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
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("📝 POST /api/auth/register");
    
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Tous les champs sont requis" 
      });
    }

    if (!["commercial", "technicien"].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Rôle invalide" 
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Cet email est déjà utilisé" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        role: role,
        status: "pending",
        password_hash: hashedPassword
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
  } catch (error: any) {
    console.error("❌ Register error:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de l'inscription" 
    });
  }
});

// ================ ROUTES ADMIN ================

app.get("/api/admin/users", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }
    
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, name, role, status, created_at")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    res.json(users || []);
  } catch (error: any) {
    console.error("❌ Get users error:", error);
    res.status(500).json({ message: "Erreur récupération utilisateurs" });
  }
});

app.get("/api/admin/users/pending", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }
    
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, name, role, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    
    res.json(users || []);
  } catch (error: any) {
    console.error("❌ Get pending users error:", error);
    res.status(500).json({ message: "Erreur récupération utilisateurs en attente" });
  }
});

app.patch("/api/admin/users/:id/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }
    
    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide. Utilisez 'active' ou 'rejected'" });
    }
    
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id, email, name, role, status, created_at")
      .single();
    
    if (error) throw error;
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.json({
      success: true,
      message: `Utilisateur ${status === "active" ? "approuvé" : "rejeté"} avec succès`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("❌ Update user status error:", error);
    res.status(500).json({ message: "Erreur mise à jour statut" });
  }
});

app.patch("/api/admin/users/:id/role", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }
    
    if (!["commercial", "technicien"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide. Utilisez 'commercial' ou 'technicien'" });
    }
    
    const { data: targetUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .single();
    
    if (targetUser?.role === "admin") {
      return res.status(400).json({ message: "Impossible de modifier le rôle d'un administrateur" });
    }
    
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id, email, name, role, status, created_at")
      .single();
    
    if (error) throw error;
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.json({
      success: true,
      message: `Rôle modifié avec succès`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("❌ Update user role error:", error);
    res.status(500).json({ message: "Erreur modification rôle" });
  }
});

app.get("/api/admin/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }
    
    const { data: users, error } = await supabase
      .from("users")
      .select("status, role");
    
    if (error) throw error;
    
    const stats = {
      total: users?.length || 0,
      pending: users?.filter(u => u.status === "pending").length || 0,
      active: users?.filter(u => u.status === "active").length || 0,
      rejected: users?.filter(u => u.status === "rejected").length || 0,
      commercials: users?.filter(u => u.role === "commercial").length || 0,
      technicians: users?.filter(u => u.role === "technicien").length || 0,
      admins: users?.filter(u => u.role === "admin").length || 0,
    };
    
    res.json(stats);
  } catch (error: any) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({ message: "Erreur récupération statistiques" });
  }
});

// ================ CATÉGORIES ================

app.get("/api/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error("❌ Get categories error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur catégories" 
    });
  }
});

// ================ CLIENTS ================

// MODIFIÉ: Les commerciaux voient seulement leurs clients
app.get("/api/clients", authMiddleware, async (req: AuthRequest, res) => {
  try {
    let query = supabase
      .from("clients")
      .select(`
        *,
        commercial:users!clients_commercial_id_fkey(id, name, email)
      `);

    // MODIFIÉ: Filtrer par commercial_id si l'utilisateur est un commercial
    if (req.user?.role === "commercial") {
      query = query.eq("commercial_id", req.user.id);
    } else if (req.user?.role === "admin") {
      // Les admins voient tous les clients
    } else {
      return res.status(403).json({ message: "Rôle non autorisé" });
    }

    query = query.order("name");

    const { data, error } = await query;

    if (error) {
      console.error("❌ Get clients error:", error);
      throw error;
    }
    
    res.json(data || []);
  } catch (error: any) {
    console.error("❌ Get clients error complet:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur récupération clients",
      error: error.message 
    });
  }
});

// MODIFIÉ: Seulement le nom est obligatoire, email et phone optionnels
app.post("/api/clients", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // MODIFIÉ: Seulement le nom est requis
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Le nom est requis" 
      });
    }

    const clientData = {
      name: name.trim(),
      email: email?.trim().toLowerCase() || "",
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      commercial_id: req.user?.id
    };

    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select(`
        *,
        commercial:users!clients_commercial_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error("❌ Create client error:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur création client",
      error: error.message 
    });
  }
});

app.put("/api/clients/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const { data: existing } = await supabase
      .from("clients")
      .select("commercial_id")
      .eq("id", id)
      .single();

    if (!existing || existing.commercial_id !== req.user?.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const { data, error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        email: email?.trim().toLowerCase() || "",
        phone: phone?.trim() || "",
        address: address?.trim() || "",
      })
      .eq("id", id)
      .select(`
        *,
        commercial:users!clients_commercial_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("❌ Update client error:", error);
    res.status(500).json({ message: "Erreur mise à jour client" });
  }
});

app.delete("/api/clients/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from("clients")
      .select("commercial_id")
      .eq("id", id)
      .single();

    if (!existing || existing.commercial_id !== req.user?.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const { data: declarations } = await supabase
      .from("declarations")
      .select("id")
      .eq("client_id", id)
      .limit(1);

    if (declarations && declarations.length > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer un client avec des déclarations" 
      });
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Client supprimé" });
  } catch (error: any) {
    console.error("❌ Delete client error:", error);
    res.status(500).json({ message: "Erreur suppression client" });
  }
});

// ================ DÉCLARATIONS ================

app.get("/api/declarations", authMiddleware, async (req: AuthRequest, res) => {
  try {
    let query = supabase
      .from("declarations")
      .select(`
        id,
        category_id,
        client_id,
        product_name,
        reference,
        serial_number,
        description,
        photo_url,
        status,
        technician_id,
        technician_remarks,
        accessories,
        created_at,
        taken_at,
        resolved_at,
        commercial_id,
        client:clients(id, name, email, phone, address),
        category:categories(id, name),
        commercial:users!declarations_commercial_id_fkey(id, name, email, role),
        technician:users!declarations_technician_id_fkey(id, name, email, role)
      `);

    if (req.user?.role === "commercial") {
      query = query.eq("commercial_id", req.user.id);
    } else if (req.user?.role === "technicien") {
      // Pas de filtre
    } else if (req.user?.role === "admin") {
      // Pas de filtre
    } else {
      return res.status(403).json({ message: "Rôle non autorisé" });
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("❌ Declarations error:", error);
      throw error;
    }
    
    res.json(data || []);
  } catch (error: any) {
    console.error("❌ Get declarations error:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur déclarations",
      error: error.message 
    });
  }
});

app.get("/api/declarations/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const { data: declaration, error } = await supabase
      .from("declarations")
      .select(`
        id,
        category_id,
        client_id,
        product_name,
        reference,
        serial_number,
        description,
        photo_url,
        status,
        technician_id,
        technician_remarks,
        accessories,
        created_at,
        taken_at,
        resolved_at,
        commercial_id,
        client:clients(id, name, email, phone, address),
        category:categories(id, name),
        commercial:users!declarations_commercial_id_fkey(id, name, email, role),
        technician:users!declarations_technician_id_fkey(id, name, email, role)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Get declaration error:", error);
      return res.status(404).json({ message: "Déclaration non trouvée" });
    }
    
    if (!declaration) {
      return res.status(404).json({ message: "Déclaration non trouvée" });
    }
    
    res.json(declaration);
  } catch (error: any) {
    console.error("❌ Get declaration error:", error);
    res.status(500).json({ message: "Erreur récupération déclaration" });
  }
});

// ================ CREATE DECLARATION ================
// MODIFIÉ: Référence et numéro de série optionnels
app.post("/api/declarations", authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log("📋 POST /api/declarations - User:", req.user?.email);
    
    const { 
      category_id, 
      client_id, 
      product_name, 
      reference, 
      serial_number, 
      description,
      accessories 
    } = req.body;

    // MODIFIÉ: Seuls category_id, client_id et product_name sont requis
    if (!category_id || !client_id || !product_name) {
      return res.status(400).json({ 
        success: false,
        message: "Catégorie, client et nom du produit sont requis" 
      });
    }

    const declarationData = {
      category_id,
      client_id,
      product_name: product_name,
      reference: reference || "",
      serial_number: serial_number || "",
      description: description || "",
      accessories: accessories || [],
      status: "nouvelle",
      commercial_id: req.user?.id
    };

    const { data, error } = await supabase
      .from("declarations")
      .insert(declarationData)
      .select(`
        id,
        category_id,
        client_id,
        product_name,
        reference,
        serial_number,
        description,
        photo_url,
        status,
        technician_id,
        technician_remarks,
        accessories,
        created_at,
        taken_at,
        resolved_at,
        commercial_id,
        client:clients(id, name, email, phone, address),
        category:categories(id, name),
        commercial:users!declarations_commercial_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Déclaration créée avec succès!");
    console.log("ID:", data.id);
    
    res.status(201).json(data);
  } catch (error: any) {
    console.error("❌ Create declaration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur création déclaration",
      error: error.message 
    });
  }
});

app.put("/api/declarations/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      category_id, 
      client_id, 
      product_name, 
      reference, 
      serial_number, 
      description,
      accessories 
    } = req.body;

    const { data: existing } = await supabase
      .from("declarations")
      .select("commercial_id, status")
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ message: "Déclaration non trouvée" });
    }

    if (existing.commercial_id !== req.user?.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    if (existing.status !== "nouvelle") {
      return res.status(400).json({ 
        message: "Impossible de modifier une déclaration prise en charge" 
      });
    }

    const { data, error } = await supabase
      .from("declarations")
      .update({
        category_id,
        client_id,
        product_name: product_name,
        reference: reference || "",
        serial_number: serial_number || "",
        description: description || "",
        accessories: accessories || [],
      })
      .eq("id", id)
      .select(`
        *,
        client:clients(*),
        category:categories(*),
        commercial:users!declarations_commercial_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("❌ Update declaration error:", error);
    res.status(500).json({ message: "Erreur mise à jour" });
  }
});

// MODIFIÉ: Suppression possible pour tous les statuts
app.delete("/api/declarations/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from("declarations")
      .select("commercial_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ message: "Déclaration non trouvée" });
    }

    // MODIFIÉ: Vérifier seulement l'appartenance, pas le statut
    if (existing.commercial_id !== req.user?.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const { error } = await supabase
      .from("declarations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Déclaration supprimée" });
  } catch (error: any) {
    console.error("❌ Delete declaration error:", error);
    res.status(500).json({ message: "Erreur suppression" });
  }
});

app.post("/api/declarations/:id/take", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { data: declaration, error } = await supabase
      .from("declarations")
      .update({
        status: "en_cours",
        technician_id: user_id,
        taken_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("status", "nouvelle")
      .select(`
        id,
        category_id,
        client_id,
        product_name,
        reference,
        serial_number,
        description,
        photo_url,
        status,
        technician_id,
        technician_remarks,
        accessories,
        created_at,
        taken_at,
        resolved_at,
        commercial_id,
        client:clients(id, name, email, phone, address),
        category:categories(id, name),
        commercial:users!declarations_commercial_id_fkey(id, name, email),
        technician:users!declarations_technician_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;
    
    if (!declaration) {
      return res.status(404).json({ 
        success: false, 
        message: "Déclaration non trouvée ou déjà prise en charge" 
      });
    }

    res.json(declaration);
  } catch (error) {
    console.error("Take declaration error:", error);
    res.status(500).json({ message: "Erreur prise en charge" });
  }
});

app.post("/api/declarations/:id/resolve", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { data: declaration, error } = await supabase
      .from("declarations")
      .update({
        status: "reglee",
        technician_remarks: remarks,
        resolved_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("status", "en_cours")
      .eq("technician_id", user_id)
      .select(`
        id,
        category_id,
        client_id,
        product_name,
        reference,
        serial_number,
        description,
        photo_url,
        status,
        technician_id,
        technician_remarks,
        accessories,
        created_at,
        taken_at,
        resolved_at,
        commercial_id,
        client:clients(id, name, email, phone, address),
        category:categories(id, name),
        commercial:users!declarations_commercial_id_fkey(id, name, email),
        technician:users!declarations_technician_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;
    
    if (!declaration) {
      return res.status(404).json({ 
        success: false, 
        message: "Déclaration non trouvée, pas en cours, ou vous n'êtes pas le technicien assigné" 
      });
    }

    res.json(declaration);
  } catch (error) {
    console.error("Resolve declaration error:", error);
    res.status(500).json({ message: "Erreur résolution" });
  }
});

app.patch("/api/declarations/:id/remarks", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { technician_remarks } = req.body;
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { data: declaration, error } = await supabase
      .from("declarations")
      .update({ technician_remarks })
      .eq("id", id)
      .eq("technician_id", user_id)
      .eq("status", "en_cours")
      .select()
      .single();

    if (error) throw error;
    
    if (!declaration) {
      return res.status(404).json({ 
        success: false, 
        message: "Déclaration non trouvée ou vous n'avez pas les permissions" 
      });
    }

    res.json(declaration);
  } catch (error) {
    console.error("Update remarks error:", error);
    res.status(500).json({ message: "Erreur mise à jour remarques" });
  }
});

// ================ UPLOAD ================
app.post("/api/upload", authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Cette route doit gérer FormData, pas JSON
    // Pour simplifier, retournons une URL fictive
    res.json({
      success: true,
      url: "https://example.com/uploaded-photo.jpg"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Erreur upload" });
  }
});

// ================ DÉMARRAGE ================
app.listen(port, "0.0.0.0", () => {
  console.log("=".repeat(60));
  console.log("🚀 BACKEND SAV PRO - VERSION CORRIGÉE");
  console.log("=".repeat(60));
  console.log(`📍 http://192.168.1.87:${port}`);
  console.log("=".repeat(60));
  console.log("🔧 MODIFICATIONS APPLIQUÉES :");
  console.log("  • Clients: Filtrés par commercial");
  console.log("  • Déclarations: Référence et S/N optionnels");
  console.log("  • Remarques technicien: Visibles par commercial");
  console.log("=".repeat(60));
  console.log("🔐 COMPTES DISPONIBLES :");
  console.log("  Admin:      admin@sav.com      / admin123");
  console.log("  Commercial: commercial@demo.com / demo123");
  console.log("  Technicien: technicien@demo.com / demo123");
  console.log("=".repeat(60));
});