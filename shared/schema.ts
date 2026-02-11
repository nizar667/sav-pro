import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { enum: ["commercial", "technicien", "admin"] }).notNull(),
  status: varchar("status", { enum: ["en_attente", "actif", "refuse"] }).default("en_attente"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Table clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").default(""),
  commercial_id: varchar("commercial_id").notNull().references(() => users.id),
});

// Table categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

// Table declarations
export const declarations = pgTable("declarations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commercial_id: varchar("commercial_id").notNull().references(() => users.id),
  client_id: varchar("client_id").notNull().references(() => clients.id),
  category_id: varchar("category_id").notNull().references(() => categories.id),
  product_name: text("product_name").notNull(),
  reference: text("reference").notNull(),
  serial_number: text("serial_number").notNull(),
  description: text("description").default(""),
  photo_url: text("photo_url"),
  status: varchar("status", { enum: ["nouvelle", "en_cours", "reglee"] }).default("nouvelle"),
  technician_id: varchar("technician_id").references(() => users.id),
  technician_remarks: text("technician_remarks"),
  accessories: jsonb("accessories").default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
  taken_at: timestamp("taken_at"),
  resolved_at: timestamp("resolved_at"),
});

// Schémas d'insertion avec Zod
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  commercial_id: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export const insertDeclarationSchema = createInsertSchema(declarations).pick({
  commercial_id: true,
  client_id: true,
  category_id: true,
  product_name: true,
  reference: true,
  serial_number: true,
  description: true,
  photo_url: true,
  accessories: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Declaration = typeof declarations.$inferSelect;
export type InsertDeclaration = z.infer<typeof insertDeclarationSchema>;