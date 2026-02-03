import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  authMiddleware,
  AuthRequest,
  generateToken,
  hashPassword,
  comparePassword,
  roleMiddleware,
} from "./auth";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });
  app.use("/uploads", require("express").static(uploadDir));

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      if (!["commercial", "technicien"].includes(role)) {
        return res.status(400).json({ message: "Rôle invalide" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Cet email est déjà utilisé" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
      });

      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const token = generateToken(user);

      res.json({
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

  app.get("/api/clients", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "commercial") {
        return res.status(403).json({ message: "Accès réservé aux commerciaux" });
      }

      const clients = await storage.getClients(req.user.id);
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des clients" });
    }
  });

  app.post("/api/clients", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "commercial") {
        return res.status(403).json({ message: "Accès réservé aux commerciaux" });
      }

      const { name, email, phone, address } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ message: "Nom, email et téléphone sont requis" });
      }

      const client = await storage.createClient({
        name,
        email,
        phone,
        address: address || "",
        commercial_id: req.user.id,
      });

      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.get("/api/categories", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  app.get("/api/declarations", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const declarations = await storage.getDeclarations(req.user!.id, req.user!.role);
      res.json(declarations);
    } catch (error) {
      console.error("Get declarations error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des déclarations" });
    }
  });

  app.get("/api/declarations/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const declaration = await storage.getDeclaration(req.params.id);
      if (!declaration) {
        return res.status(404).json({ message: "Déclaration non trouvée" });
      }
      res.json(declaration);
    } catch (error) {
      console.error("Get declaration error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la déclaration" });
    }
  });

  app.post("/api/declarations", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "commercial") {
        return res.status(403).json({ message: "Accès réservé aux commerciaux" });
      }

      const { category_id, client_id, product_name, reference, serial_number, description, photo_url, accessories } = req.body;

      if (!category_id || !client_id || !product_name || !reference || !serial_number) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }

      const declaration = await storage.createDeclaration({
        commercial_id: req.user.id,
        client_id,
        category_id,
        product_name,
        reference,
        serial_number,
        description: description || "",
        photo_url,
        accessories: accessories || [],
      });

      res.status(201).json(declaration);
    } catch (error) {
      console.error("Create declaration error:", error);
      res.status(500).json({ message: "Erreur lors de la création de la déclaration" });
    }
  });

  app.post("/api/declarations/:id/take", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "technicien") {
        return res.status(403).json({ message: "Accès réservé aux techniciens" });
      }

      const declaration = await storage.getDeclaration(req.params.id);
      if (!declaration) {
        return res.status(404).json({ message: "Déclaration non trouvée" });
      }

      if (declaration.status !== "nouvelle") {
        return res.status(400).json({ message: "Cette déclaration a déjà été prise en charge" });
      }

      const updated = await storage.updateDeclaration(req.params.id, {
        status: "en_cours",
        technician_id: req.user.id,
        taken_at: new Date().toISOString(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Take declaration error:", error);
      res.status(500).json({ message: "Erreur lors de la prise en charge" });
    }
  });

  app.post("/api/declarations/:id/resolve", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "technicien") {
        return res.status(403).json({ message: "Accès réservé aux techniciens" });
      }

      const declaration = await storage.getDeclaration(req.params.id);
      if (!declaration) {
        return res.status(404).json({ message: "Déclaration non trouvée" });
      }

      if (declaration.status !== "en_cours") {
        return res.status(400).json({ message: "Cette déclaration ne peut pas être résolue" });
      }

      if (declaration.technician_id !== req.user.id) {
        return res.status(403).json({ message: "Vous n'êtes pas en charge de cette déclaration" });
      }

      const updated = await storage.updateDeclaration(req.params.id, {
        status: "reglee",
        resolved_at: new Date().toISOString(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Resolve declaration error:", error);
      res.status(500).json({ message: "Erreur lors de la résolution" });
    }
  });

  app.patch("/api/declarations/:id/remarks", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "technicien") {
        return res.status(403).json({ message: "Accès réservé aux techniciens" });
      }

      const declaration = await storage.getDeclaration(req.params.id);
      if (!declaration) {
        return res.status(404).json({ message: "Déclaration non trouvée" });
      }

      if (declaration.technician_id !== req.user.id) {
        return res.status(403).json({ message: "Vous n'êtes pas en charge de cette déclaration" });
      }

      const { technician_remarks } = req.body;

      const updated = await storage.updateDeclaration(req.params.id, {
        technician_remarks: technician_remarks || "",
      });

      res.json(updated);
    } catch (error) {
      console.error("Update remarks error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des remarques" });
    }
  });

  app.post("/api/upload", authMiddleware, upload.single("photo"), (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier fourni" });
      }

      const protocol = req.header("x-forwarded-proto") || req.protocol || "https";
      const host = req.header("x-forwarded-host") || req.get("host");
      const url = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.json({ url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Erreur lors de l'upload" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
