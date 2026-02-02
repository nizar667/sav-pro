export type DeclarationStatus = "nouvelle" | "en_cours" | "reglee";

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

export const CATEGORIES: Category[] = [
  { id: "1", name: "Électroménager" },
  { id: "2", name: "Informatique" },
  { id: "3", name: "Téléphonie" },
  { id: "4", name: "Audio/Vidéo" },
  { id: "5", name: "Climatisation" },
  { id: "6", name: "Plomberie" },
  { id: "7", name: "Autre" },
];
