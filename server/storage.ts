import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export type UserRole = "commercial" | "technicien" | "admin";
export type DeclarationStatus = "nouvelle" | "en_cours" | "reglee";
export type UserStatus = "en_attente" | "actif" | "refuse";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  commercial_id: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface Declaration {
  id: string;
  commercial_id: string;
  commercial_name?: string;
  client_id: string;
  client_name?: string;
  category_id: string;
  category_name?: string;
  product_name: string;
  reference: string;
  serial_number: string;
  description: string;
  photo_url?: string;
  status: DeclarationStatus;
  technician_id?: string;
  technician_name?: string;
  accessories?: AccessoryItem[];
  technician_remarks?: string;
  created_at: string;
  taken_at?: string;
  resolved_at?: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: UserStatus): Promise<User | undefined>;
  
  getClients(commercialId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: Omit<Client, "id">): Promise<Client>;

  getCategories(): Promise<Category[]>;

  getDeclarations(userId: string, role: UserRole): Promise<Declaration[]>;
  getDeclaration(id: string): Promise<Declaration | undefined>;
  createDeclaration(declaration: Omit<Declaration, "id" | "created_at" | "status">): Promise<Declaration>;
  updateDeclaration(id: string, updates: Partial<Declaration>): Promise<Declaration | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private categories: Category[];
  private declarations: Map<string, Declaration>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.declarations = new Map();
    this.categories = [
      { id: "1", name: "Électroménager" },
      { id: "2", name: "Informatique" },
      { id: "3", name: "Téléphonie" },
      { id: "4", name: "Audio/Vidéo" },
      { id: "5", name: "Climatisation" },
      { id: "6", name: "Plomberie" },
      { id: "7", name: "Autre" },
    ];

    this.seedDemoData();
  }

  private seedDemoData() {
    // Mots de passe en clair TEMPORAIREMENT
    const passwordDemo123 = "demo123";
    const passwordAdmin123 = "admin123";

    // COMPTE ADMIN PAR DÉFAUT
    const adminId = "admin-001";
    this.users.set(adminId, {
      id: adminId,
      email: "admin@sav.com",
      password: passwordAdmin123, // admin123
      name: "Administrateur",
      role: "admin",
      status: "actif",
      created_at: new Date().toISOString(),
    });

    const commercialId = "demo-commercial-001";
    const technicianId = "demo-technicien-001";

    // Compte commercial (actif pour démo)
    this.users.set(commercialId, {
      id: commercialId,
      email: "commercial@demo.com",
      password: passwordDemo123, // demo123
      name: "Marie Dupont",
      role: "commercial",
      status: "actif",
      created_at: new Date().toISOString(),
    });

    // Compte technicien (actif pour démo)
    this.users.set(technicianId, {
      id: technicianId,
      email: "technicien@demo.com",
      password: passwordDemo123, // demo123
      name: "Pierre Martin",
      role: "technicien",
      status: "actif",
      created_at: new Date().toISOString(),
    });

    // Ajouter quelques comptes en attente pour démo
    const pendingCommercialId = "pending-commercial-001";
    this.users.set(pendingCommercialId, {
      id: pendingCommercialId,
      email: "pending@demo.com",
      password: passwordDemo123, // demo123
      name: "Jean En Attente",
      role: "commercial",
      status: "en_attente",
      created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
    });

    const client1Id = "demo-client-001";
    const client2Id = "demo-client-002";
    const client3Id = "demo-client-003";

    this.clients.set(client1Id, {
      id: client1Id,
      name: "Entreprise ABC",
      email: "contact@abc.fr",
      phone: "01 23 45 67 89",
      address: "123 Rue de la Paix, 75001 Paris",
      commercial_id: commercialId,
    });

    this.clients.set(client2Id, {
      id: client2Id,
      name: "Société XYZ",
      email: "info@xyz.fr",
      phone: "01 98 76 54 32",
      address: "45 Avenue des Champs, 75008 Paris",
      commercial_id: commercialId,
    });

    this.clients.set(client3Id, {
      id: client3Id,
      name: "Restaurant Le Gourmet",
      email: "contact@legourmet.fr",
      phone: "01 45 67 89 01",
      address: "8 Place de la République, 69001 Lyon",
      commercial_id: commercialId,
    });

    const declaration1Id = "demo-declaration-001";
    const declaration2Id = "demo-declaration-002";
    const declaration3Id = "demo-declaration-003";

    this.declarations.set(declaration1Id, {
      id: declaration1Id,
      commercial_id: commercialId,
      client_id: client1Id,
      category_id: "1",
      product_name: "Lave-linge Samsung",
      reference: "WW90T534DAW",
      serial_number: "SN-2024-001234",
      description: "Le lave-linge ne démarre plus. Affiche un code erreur E5.",
      accessories: [
        { id: "1", name: "Câble d'alimentation", checked: true },
        { id: "2", name: "Manuel d'utilisation", checked: true },
        { id: "3", name: "Garantie", checked: false },
      ],
      status: "nouvelle",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });

    this.declarations.set(declaration2Id, {
      id: declaration2Id,
      commercial_id: commercialId,
      client_id: client2Id,
      category_id: "2",
      product_name: "Ordinateur portable Dell",
      reference: "LATITUDE-5520",
      serial_number: "DELL-2024-567890",
      description: "L'écran clignote de manière intermittente. Problème apparu après mise à jour.",
      accessories: [
        { id: "1", name: "Câble d'alimentation", checked: true },
        { id: "2", name: "Sacoche", checked: true },
      ],
      status: "en_cours",
      technician_id: technicianId,
      technician_remarks: "Diagnostic en cours. Possible problème de carte graphique.",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      taken_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    });

    this.declarations.set(declaration3Id, {
      id: declaration3Id,
      commercial_id: commercialId,
      client_id: client3Id,
      category_id: "5",
      product_name: "Climatiseur Daikin",
      reference: "FTXM35R",
      serial_number: "DAI-2023-987654",
      description: "Fuite d'eau au niveau de l'unité intérieure.",
      accessories: [
        { id: "1", name: "Télécommande", checked: true },
        { id: "2", name: "Manuel d'utilisation", checked: true },
      ],
      status: "reglee",
      technician_id: technicianId,
      technician_remarks: "Joint d'évacuation remplacé. Fuite corrigée. Test effectué pendant 2h sans récidive.",
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      taken_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log("📊 DEMO DATA SEEDED SUCCESSFULLY!");
    console.log("-----------------------------------");
    console.log("COMPTES ADMINISTRATEUR:");
    console.log("Email: admin@sav.com");
    console.log("Mot de passe: admin123");
    console.log("-----------------------------------");
    console.log("COMPTES DE DÉMONSTRATION:");
    console.log("Commercial: commercial@demo.com / demo123");
    console.log("Technicien: technicien@demo.com / demo123");
    console.log("Compte en attente: pending@demo.com / demo123");
    console.log("-----------------------------------");
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: Omit<User, "id">): Promise<User> {
    const id = randomUUID();
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.status === "en_attente")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { ...user, status };
    this.users.set(id, updated);
    return updated;
  }

  async getClients(commercialId: string): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter((client) => client.commercial_id === commercialId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(clientData: Omit<Client, "id">): Promise<Client> {
    const id = randomUUID();
    const client: Client = { ...clientData, id };
    this.clients.set(id, client);
    return client;
  }

  async getCategories(): Promise<Category[]> {
    return this.categories;
  }

  async getDeclarations(userId: string, role: UserRole): Promise<Declaration[]> {
    const declarations = Array.from(this.declarations.values());
    
    return declarations
      .map((d) => this.enrichDeclaration(d))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getDeclaration(id: string): Promise<Declaration | undefined> {
    const declaration = this.declarations.get(id);
    if (!declaration) return undefined;
    return this.enrichDeclaration(declaration);
  }

  async createDeclaration(declarationData: Omit<Declaration, "id" | "created_at" | "status">): Promise<Declaration> {
    const id = randomUUID();
    const declaration: Declaration = {
      ...declarationData,
      id,
      status: "nouvelle",
      created_at: new Date().toISOString(),
    };
    this.declarations.set(id, declaration);
    return this.enrichDeclaration(declaration);
  }

  async updateDeclaration(id: string, updates: Partial<Declaration>): Promise<Declaration | undefined> {
    const declaration = this.declarations.get(id);
    if (!declaration) return undefined;

    const updated = { ...declaration, ...updates };
    this.declarations.set(id, updated);
    return this.enrichDeclaration(updated);
  }

  private enrichDeclaration(declaration: Declaration): Declaration {
    const client = this.clients.get(declaration.client_id);
    const commercial = this.users.get(declaration.commercial_id);
    const technician = declaration.technician_id
      ? this.users.get(declaration.technician_id)
      : undefined;
    const category = this.categories.find((c) => c.id === declaration.category_id);

    return {
      ...declaration,
      client_name: client?.name,
      commercial_name: commercial?.name,
      technician_name: technician?.name,
      category_name: category?.name,
    };
  }
}

export const storage = new MemStorage();