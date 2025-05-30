import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - both affiliates and admins
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  cpf: text("cpf").notNull().unique(),
  birthDate: text("birth_date").notNull(),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("BR"),
  role: text("role").default("affiliate"), // 'affiliate' or 'admin'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Betting houses table
export const bettingHouses = pgTable("betting_houses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  baseUrl: text("base_url").notNull(), // Base affiliate URL with VALUE placeholder
  primaryParam: text("primary_param").notNull(), // subid, affid, etc.
  additionalParams: jsonb("additional_params"), // Optional additional parameters
  commissionType: text("commission_type").notNull(), // 'CPA', 'RevShare', or 'Hybrid'
  commissionValue: text("commission_value").notNull(), // Valor principal
  cpaValue: text("cpa_value"), // Valor específico para CPA em modelo Hybrid
  revshareValue: text("revshare_value"), // Valor específico para RevShare em modelo Hybrid
  minDeposit: text("min_deposit"),
  paymentMethods: text("payment_methods"),
  isActive: boolean("is_active").default(true),
  identifier: text("identifier").notNull().unique(), // identificador único para postbacks
  enabledPostbacks: jsonb("enabled_postbacks").default([]), // eventos habilitados: ['registration', 'deposit', etc.]
  securityToken: text("security_token").notNull(), // token de segurança para validação
  parameterMapping: jsonb("parameter_mapping").default({}), // mapeamento de parâmetros: { "subid": "subid", "valor": "amount" }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate links table
export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  houseId: integer("house_id").notNull().references(() => bettingHouses.id),
  generatedUrl: text("generated_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Click tracking table
export const clickTracking = pgTable("click_tracking", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => affiliateLinks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  houseId: integer("house_id").notNull().references(() => bettingHouses.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  clickedAt: timestamp("clicked_at").defaultNow(),
});

// Conversion tracking table (registrations, deposits, etc.)
export const conversions = pgTable("conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  houseId: integer("house_id").notNull().references(() => bettingHouses.id),
  affiliateLinkId: integer("affiliate_link_id").references(() => affiliateLinks.id),
  type: text("type").notNull(), // 'click', 'registration', 'first_deposit', 'deposit', 'profit'
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  customerId: text("customer_id"), // ID do cliente na casa de apostas
  conversionData: jsonb("conversion_data"), // Additional data from postback
  convertedAt: timestamp("converted_at").defaultNow(),
});

// Payment records table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // 'pix', 'bank_transfer'
  pixKey: text("pix_key"),
  status: text("status").default("pending"), // 'pending', 'completed', 'failed'
  transactionId: text("transaction_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  affiliateLinks: many(affiliateLinks),
  conversions: many(conversions),
  payments: many(payments),
  clicks: many(clickTracking),
}));

export const bettingHousesRelations = relations(bettingHouses, ({ many }) => ({
  affiliateLinks: many(affiliateLinks),
  conversions: many(conversions),
  clicks: many(clickTracking),
}));

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliateLinks.userId],
    references: [users.id],
  }),
  house: one(bettingHouses, {
    fields: [affiliateLinks.houseId],
    references: [bettingHouses.id],
  }),
  clicks: many(clickTracking),
  conversions: many(conversions),
}));

export const clickTrackingRelations = relations(clickTracking, ({ one }) => ({
  link: one(affiliateLinks, {
    fields: [clickTracking.linkId],
    references: [affiliateLinks.id],
  }),
  user: one(users, {
    fields: [clickTracking.userId],
    references: [users.id],
  }),
  house: one(bettingHouses, {
    fields: [clickTracking.houseId],
    references: [bettingHouses.id],
  }),
}));

export const conversionsRelations = relations(conversions, ({ one }) => ({
  user: one(users, {
    fields: [conversions.userId],
    references: [users.id],
  }),
  house: one(bettingHouses, {
    fields: [conversions.houseId],
    references: [bettingHouses.id],
  }),
  link: one(affiliateLinks, {
    fields: [conversions.affiliateLinkId],
    references: [affiliateLinks.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertBettingHouseSchema = createInsertSchema(bettingHouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  securityToken: true, // será gerado automaticamente
}).extend({
  identifier: z.string().optional(),
  enabledPostbacks: z.array(z.string()).optional(),
  parameterMapping: z.record(z.string()).optional(),
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  createdAt: true,
});

export const insertConversionSchema = createInsertSchema(conversions).omit({
  id: true,
  convertedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type BettingHouse = typeof bettingHouses.$inferSelect;
export type InsertBettingHouse = z.infer<typeof insertBettingHouseSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type Conversion = typeof conversions.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ClickTracking = typeof clickTracking.$inferSelect;

// === NOVAS TABELAS PARA SISTEMA COMPLETO DE POSTBACK ===

// Tabela de eventos
export const eventos = pgTable("eventos", {
  id: serial("id").primaryKey(),
  afiliadoId: integer("afiliado_id").notNull().references(() => users.id),
  casa: varchar("casa").notNull(),
  evento: varchar("evento").notNull(), // click, registration, deposit, revenue, profit
  valor: decimal("valor", { precision: 10, scale: 2 }).default("0"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// Tabela de comissões
export const comissoes = pgTable("comissoes", {
  id: serial("id").primaryKey(),
  afiliadoId: integer("afiliado_id").notNull().references(() => users.id),
  eventoId: integer("evento_id").notNull().references(() => eventos.id),
  tipo: varchar("tipo").notNull(), // CPA, RevShare
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  affiliate: varchar("affiliate").notNull(), // username do afiliado
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// Tabela de logs de postback
export const postbackLogs = pgTable("postback_logs", {
  id: serial("id").primaryKey(),
  casa: varchar("casa").notNull(),
  subid: varchar("subid").notNull(),
  evento: varchar("evento").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).default("0"),
  ip: varchar("ip"),
  raw: text("raw"), // query string completa recebida
  status: varchar("status").notNull(), // processando, registrado, erro_subid, erro_casa
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// Relações das novas tabelas
export const eventosRelations = relations(eventos, ({ one }) => ({
  afiliado: one(users, {
    fields: [eventos.afiliadoId],
    references: [users.id],
  }),
}));

export const comissoesRelations = relations(comissoes, ({ one }) => ({
  afiliado: one(users, {
    fields: [comissoes.afiliadoId],
    references: [users.id],
  }),
  evento: one(eventos, {
    fields: [comissoes.eventoId],
    references: [eventos.id],
  }),
}));

export const postbackLogsRelations = relations(postbackLogs, ({ one }) => ({
  // Não precisa de relação direta pois subid pode não existir
}));

// Tipos das novas tabelas
export type Evento = typeof eventos.$inferSelect;
export type InsertEvento = typeof eventos.$inferInsert;
export type Comissao = typeof comissoes.$inferSelect;
export type InsertComissao = typeof comissoes.$inferInsert;
export type PostbackLog = typeof postbackLogs.$inferSelect;
export type InsertPostbackLog = typeof postbackLogs.$inferInsert;
