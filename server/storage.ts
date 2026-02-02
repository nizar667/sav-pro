import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export type UserRole = "commercial" | "technicien";
export type DeclarationStatus = "nouvelle" | "en_cours" | "reglee";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
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
  created_at: string;
  taken_at?: string;
  resolved_at?: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;

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

  private async seedDemoData() {
    const hashedPassword = bcrypt.hashSync("demo123", 10);

    const commercialId = "demo-commercial-001";
    const technicianId = "demo-technicien-001";

    this.users.set(commercialId, {
      id: commercialId,
      email: "commercial@demo.com",
      password: hashedPassword,
      name: "Marie Dupont",
      role: "commercial",
    });

    this.users.set(technicianId, {
      id: technicianId,
      email: "technicien@demo.com",
      password: hashedPassword,
      name: "Pierre Martin",
      role: "technicien",
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
      status: "en_cours",
      technician_id: technicianId,
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
      status: "reglee",
      technician_id: technicianId,
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      taken_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log("Demo data seeded successfully!");
    console.log("-----------------------------------");
    console.log("COMPTES DE DÉMONSTRATION:");
    console.log("-----------------------------------");
    console.log("Commercial: commercial@demo.com / demo123");
    console.log("Technicien: technicien@demo.com / demo123");
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
