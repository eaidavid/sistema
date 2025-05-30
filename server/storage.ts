import {
  users,
  bettingHouses,
  affiliateLinks,
  conversions,
  payments,
  clickTracking,
  type User,
  type InsertUser,
  type BettingHouse,
  type InsertBettingHouse,
  type AffiliateLink,
  type InsertAffiliateLink,
  type Conversion,
  type InsertConversion,
  type Payment,
  type InsertPayment,
  type ClickTracking,
  type LoginData,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  authenticateUser(credentials: LoginData): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Betting house operations
  createBettingHouse(house: InsertBettingHouse): Promise<BettingHouse>;
  getAllBettingHouses(): Promise<BettingHouse[]>;
  getActiveBettingHouses(): Promise<BettingHouse[]>;
  getBettingHouseById(id: number): Promise<BettingHouse | undefined>;
  updateBettingHouse(id: number, updates: Partial<BettingHouse>): Promise<BettingHouse>;
  deleteBettingHouse(id: number): Promise<void>;
  
  // Affiliate link operations
  createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink>;
  getAffiliateLinksByUserId(userId: number): Promise<AffiliateLink[]>;
  getAffiliateLinkByUserAndHouse(userId: number, houseId: number): Promise<AffiliateLink | undefined>;
  deactivateAffiliateLink(id: number): Promise<void>;
  
  // Conversion operations
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversionsByUserId(userId: number): Promise<Conversion[]>;
  getConversionsByHouseId(houseId: number): Promise<Conversion[]>;
  
  // Click tracking operations
  trackClick(click: Omit<ClickTracking, 'id' | 'clickedAt'>): Promise<void>;
  getClicksByUserId(userId: number): Promise<ClickTracking[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<void>;
  
  // Statistics operations
  getUserStats(userId: number): Promise<{
    totalClicks: number;
    totalRegistrations: number;
    totalDeposits: number;
    totalCommission: number;
    conversionRate: number;
  }>;
  
  getAdminStats(): Promise<{
    totalAffiliates: number;
    activeHouses: number;
    totalVolume: number;
    paidCommissions: number;
  }>;
  
  getTopAffiliates(limit?: number): Promise<Array<User & { totalCommission: number }>>;
  getTopHouses(limit?: number): Promise<Array<BettingHouse & { totalVolume: number; affiliateCount: number }>>;
  
  // Additional admin operations
  getAllAffiliates(): Promise<Array<User & { affiliateHouses?: number }>>;
  updateUserStatus(id: number, isActive: boolean): Promise<void>;
  resetUserPassword(id: number): Promise<void>;
  deleteUser(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createUser(userData: InsertUser): Promise<User> {
    const { confirmPassword, password, ...otherData } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...otherData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async authenticateUser(credentials: LoginData): Promise<User | undefined> {
    // Try to find user by email first, then by username
    let user = await this.getUserByEmail(credentials.usernameOrEmail);
    if (!user) {
      user = await this.getUserByUsername(credentials.usernameOrEmail);
    }

    if (!user) {
      return undefined;
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      return undefined;
    }

    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createBettingHouse(houseData: InsertBettingHouse): Promise<BettingHouse> {
    // Gerar identificador único se não fornecido
    const identifier = houseData.identifier || 
      `${houseData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}`;
    
    // Mapeamento padrão de parâmetros se não fornecido
    const defaultParameterMapping = {
      subid: "subid",
      amount: "amount",
      customer_id: "customer_id"
    };
    
    // Inserir sem especificar securityToken para usar o valor padrão do banco
    const [house] = await db
      .insert(bettingHouses)
      .values({
        ...houseData,
        identifier,
        parameterMapping: houseData.parameterMapping || defaultParameterMapping,
        enabledPostbacks: houseData.enabledPostbacks || []
      })
      .returning();
    
    console.log(`🔐 Token de segurança gerado automaticamente para ${house.name}: ${house.securityToken}`);
    return house;
  }

  async getAllBettingHouses(): Promise<BettingHouse[]> {
    return await db.select().from(bettingHouses).orderBy(desc(bettingHouses.createdAt));
  }

  async getActiveBettingHouses(): Promise<BettingHouse[]> {
    return await db
      .select()
      .from(bettingHouses)
      .where(eq(bettingHouses.isActive, true))
      .orderBy(bettingHouses.name);
  }

  async getBettingHouseById(id: number): Promise<BettingHouse | undefined> {
    const [house] = await db.select().from(bettingHouses).where(eq(bettingHouses.id, id));
    return house;
  }

  async updateBettingHouse(id: number, updates: Partial<BettingHouse>): Promise<BettingHouse> {
    const [house] = await db
      .update(bettingHouses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bettingHouses.id, id))
      .returning();
    return house;
  }

  async deleteBettingHouse(id: number): Promise<void> {
    await db.delete(bettingHouses).where(eq(bettingHouses.id, id));
  }

  async createAffiliateLink(linkData: InsertAffiliateLink): Promise<AffiliateLink> {
    const [link] = await db
      .insert(affiliateLinks)
      .values(linkData)
      .returning();
    return link;
  }

  async getAffiliateLinksByUserId(userId: number): Promise<AffiliateLink[]> {
    console.log("Buscando links para userId:", userId, typeof userId);
    const result = await db
      .select()
      .from(affiliateLinks)
      .where(and(eq(affiliateLinks.userId, userId), eq(affiliateLinks.isActive, true)));
    console.log("Resultado da busca:", result.length, result);
    return result;
  }

  async getAffiliateLinkByUserAndHouse(userId: number, houseId: number): Promise<AffiliateLink | undefined> {
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(
        and(
          eq(affiliateLinks.userId, userId),
          eq(affiliateLinks.houseId, houseId),
          eq(affiliateLinks.isActive, true)
        )
      );
    return link;
  }

  async deactivateAffiliateLink(id: number): Promise<void> {
    await db
      .update(affiliateLinks)
      .set({ isActive: false })
      .where(eq(affiliateLinks.id, id));
  }

  async createConversion(conversionData: InsertConversion): Promise<Conversion> {
    const [conversion] = await db
      .insert(conversions)
      .values(conversionData)
      .returning();
    return conversion;
  }

  async getConversionsByUserId(userId: number): Promise<Conversion[]> {
    return await db
      .select()
      .from(conversions)
      .where(eq(conversions.userId, userId))
      .orderBy(desc(conversions.convertedAt));
  }

  async getConversionsByHouseId(houseId: number): Promise<Conversion[]> {
    return await db
      .select()
      .from(conversions)
      .where(eq(conversions.houseId, houseId))
      .orderBy(desc(conversions.convertedAt));
  }

  async trackClick(clickData: Omit<ClickTracking, 'id' | 'clickedAt'>): Promise<void> {
    await db.insert(clickTracking).values(clickData);
  }

  async getClicksByUserId(userId: number): Promise<ClickTracking[]> {
    return await db
      .select()
      .from(clickTracking)
      .where(eq(clickTracking.userId, userId))
      .orderBy(desc(clickTracking.clickedAt));
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<void> {
    const updates: any = { status };
    if (status === 'completed') {
      updates.paidAt = new Date();
    }
    if (transactionId) {
      updates.transactionId = transactionId;
    }

    await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id));
  }

  async getUserStats(userId: number): Promise<{
    totalClicks: number;
    totalRegistrations: number;
    totalDeposits: number;
    totalCommission: number;
    conversionRate: number;
  }> {
    // Get conversion stats from conversions table (onde todos os postbacks são salvos)
    const conversionStats = await db
      .select({
        type: conversions.type,
        count: count(),
        totalCommission: sql<number>`sum(CAST(${conversions.commission} AS DECIMAL))`,
      })
      .from(conversions)
      .where(eq(conversions.userId, userId))
      .groupBy(conversions.type);

    console.log(`Conversion stats for user ${userId}:`, conversionStats);

    const totalClicks = conversionStats.find(s => s.type === 'click')?.count || 0;
    const registrations = conversionStats.find(s => s.type === 'registration')?.count || 0;
    const deposits = conversionStats.filter(s => 
      s.type === 'deposit' || 
      s.type === 'first_deposit' || 
      s.type === 'recurring_deposit'
    ).reduce((sum, stat) => sum + (stat.count || 0), 0);
    
    const totalCommission = conversionStats.reduce((sum, stat) => sum + (stat.totalCommission || 0), 0);
    const conversionRate = totalClicks > 0 ? (registrations / totalClicks) * 100 : 0;

    const result = {
      totalClicks,
      totalRegistrations: registrations,
      totalDeposits: deposits,
      totalCommission,
      conversionRate,
    };

    console.log(`Final stats for user ${userId}:`, result);
    return result;
  }

  async getAdminStats(): Promise<{
    totalAffiliates: number;
    activeHouses: number;
    totalVolume: number;
    paidCommissions: number;
  }> {
    // Contar todos os usuários exceto admin para manter consistência
    const allUsers = await db.select().from(users);
    const totalAffiliates = allUsers.filter(user => user.role !== 'admin').length;

    const [housesResult] = await db
      .select({ count: count() })
      .from(bettingHouses)
      .where(eq(bettingHouses.isActive, true));

    const [volumeResult] = await db
      .select({ total: sql<number>`sum(${conversions.amount})` })
      .from(conversions);

    const [commissionsResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(eq(payments.status, 'completed'));

    return {
      totalAffiliates,
      activeHouses: housesResult.count,
      totalVolume: volumeResult?.total || 0,
      paidCommissions: commissionsResult?.total || 0,
    };
  }

  async getTopAffiliates(limit = 10): Promise<Array<User & { totalCommission: number }>> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        totalCommission: sql<number>`sum(${conversions.commission})`,
      })
      .from(users)
      .leftJoin(conversions, eq(users.id, conversions.userId))
      .where(eq(users.role, 'affiliate'))
      .groupBy(users.id, users.username, users.email, users.fullName)
      .orderBy(desc(sql`sum(${conversions.commission})`))
      .limit(limit);

    return result.map(row => ({
      ...row,
      password: '',
      cpf: '',
      birthDate: '',
      phone: null,
      city: null,
      state: null,
      country: 'BR',
      role: 'affiliate' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalCommission: row.totalCommission || 0,
    }));
  }

  async getTopHouses(limit = 10): Promise<Array<BettingHouse & { totalVolume: number; affiliateCount: number }>> {
    const result = await db
      .select({
        id: bettingHouses.id,
        name: bettingHouses.name,
        description: bettingHouses.description,
        logoUrl: bettingHouses.logoUrl,
        baseUrl: bettingHouses.baseUrl,
        primaryParam: bettingHouses.primaryParam,
        additionalParams: bettingHouses.additionalParams,
        commissionType: bettingHouses.commissionType,
        commissionValue: bettingHouses.commissionValue,
        minDeposit: bettingHouses.minDeposit,
        paymentMethods: bettingHouses.paymentMethods,
        isActive: bettingHouses.isActive,
        createdAt: bettingHouses.createdAt,
        updatedAt: bettingHouses.updatedAt,
        totalVolume: sql<number>`sum(${conversions.amount})`,
        affiliateCount: sql<number>`count(distinct ${affiliateLinks.userId})`,
      })
      .from(bettingHouses)
      .leftJoin(conversions, eq(bettingHouses.id, conversions.houseId))
      .leftJoin(affiliateLinks, eq(bettingHouses.id, affiliateLinks.houseId))
      .groupBy(
        bettingHouses.id,
        bettingHouses.name,
        bettingHouses.description,
        bettingHouses.logoUrl,
        bettingHouses.baseUrl,
        bettingHouses.primaryParam,
        bettingHouses.additionalParams,
        bettingHouses.commissionType,
        bettingHouses.commissionValue,
        bettingHouses.minDeposit,
        bettingHouses.paymentMethods,
        bettingHouses.isActive,
        bettingHouses.createdAt,
        bettingHouses.updatedAt
      )
      .orderBy(desc(sql`sum(${conversions.amount})`))
      .limit(limit);

    return result.map(row => ({
      ...row,
      totalVolume: row.totalVolume || 0,
      affiliateCount: row.affiliateCount || 0,
    }));
  }

  async getAllAffiliates(): Promise<Array<User & { affiliateHouses?: number }>> {
    console.log("Iniciando busca de afiliados...");
    
    // Buscar todos os usuários com role 'affiliate'
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, 'affiliate'));

    console.log(`Encontrados ${result.length} afiliados no banco:`, result.map(u => u.username));

    // Para cada usuário, contar suas casas afiliadas
    const affiliatesWithStats = await Promise.all(
      result.map(async (user) => {
        const [linksCount] = await db
          .select({ count: count() })
          .from(affiliateLinks)
          .where(eq(affiliateLinks.userId, user.id));
        
        return {
          ...user,
          affiliateHouses: linksCount.count,
        };
      })
    );

    console.log("Afiliados com estatísticas:", affiliatesWithStats);
    return affiliatesWithStats;
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, id));
  }

  async resetUserPassword(id: number): Promise<void> {
    // Gerar nova senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
    
    // Em uma implementação real, enviaria email com a nova senha
    console.log(`New password for user ${id}: ${tempPassword}`);
  }

  async deleteUser(id: number): Promise<void> {
    // Primeiro, excluir dados relacionados
    await db.delete(affiliateLinks).where(eq(affiliateLinks.userId, id));
    await db.delete(clickTracking).where(eq(clickTracking.userId, id));
    await db.delete(payments).where(eq(payments.userId, id));
    
    // Depois, excluir o usuário
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
