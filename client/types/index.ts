// types/index.ts
export type DeclarationStatus = "nouvelle" | "en_cours" | "reglee" | "sortie";

export interface Category {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  commercial_id: string;
  commercial?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AccessoryItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface Declaration {
  id: string;
  commercial_id: string;
  commercial?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  commercial_name?: string;
  client_id: string;
  client?: Client;
  client_name?: string;
  category_id: string;
  category?: Category;
  category_name?: string;
  product_name: string;
  reference: string;
  serial_number: string;
  description: string;
  photo_url?: string;
  status: DeclarationStatus;
  technician_id?: string;
  technician?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  technician_name?: string;
  accessories?: AccessoryItem[];
  technician_remarks?: string;
  created_at: string;
  taken_at?: string;
  resolved_at?: string;
  completed_at?: string;
  completed_by?: string;
  // Nouveaux champs pour le diagnostic verre
  glass_broken?: boolean;
  glass_size?: number;
  glass_supplier?: string;
}

// Catégories
export const CATEGORIES: Category[] = [
  { id: "1", name: "Accessoires TV" },
  { id: "2", name: "Audio & Son" },
  { id: "3", name: "Caméra de surveillance" },
  { id: "4", name: "Climat" },
  { id: "5", name: "Machine à laver" },
  { id: "6", name: "Petit électroménager" },
  { id: "7", name: "Récepteur numérique" },
  { id: "8", name: "Réfrigérateur & Congélateur" },
  { id: "9", name: "Télévision" },
  { id: "10", name: "Vélos Électriques" },
  { id: "11", name: "Autres" },
];

export const DEFAULT_ACCESSORIES: string[] = [
  "Câble d'alimentation",
  "Télécommande",
  "Manuel d'utilisation",
  "Boîte d'origine",
  "Accessoires d'origine",
  "Garantie",
];

// Liste des fournisseurs pour le diagnostic verre
export const GLASS_SUPPLIERS: string[] = ["TONY", "CINDY", "OWEN"];

// Tailles disponibles pour le diagnostic verre
export const GLASS_SIZES: number[] = [24, 32, 40, 43, 50, 55, 65, 75, 85, 100];