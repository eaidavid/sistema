import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { affiliateLinks } from "@shared/schema";
import * as schema from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  insertUserSchema, 
  loginSchema, 
  insertBettingHouseSchema,
  type User,
  type BettingHouse,
} from "@shared/schema";

// Session configuration
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(getSession());

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                          await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === userData.username ? 
            "Username already exists" : "Email already exists" 
        });
      }

      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.session.user = { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        fullName: user.fullName,
        role: user.role 
      };
      
      res.status(201).json({ 
        message: "User created successfully", 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          fullName: user.fullName,
          role: user.role 
        } 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error.message || "Registration failed",
        errors: error.issues || undefined
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(credentials);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.user = { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        fullName: user.fullName,
        role: user.role 
      };
      
      res.json({ 
        message: "Login successful", 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          fullName: user.fullName,
          role: user.role 
        } 
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error.message || "Login failed" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Betting Houses routes
  app.get("/api/betting-houses", requireAuth, async (req: any, res) => {
    try {
      const houses = await storage.getActiveBettingHouses();
      
      // For each house, check if current user is already affiliated
      const userId = req.session.user.id;
      const housesWithAffiliationStatus = await Promise.all(
        houses.map(async (house) => {
          const existingLink = await storage.getAffiliateLinkByUserAndHouse(userId, house.id);
          return {
            ...house,
            isAffiliated: !!existingLink,
            affiliateLink: existingLink?.generatedUrl || null,
          };
        })
      );
      
      res.json(housesWithAffiliationStatus);
    } catch (error) {
      console.error("Get betting houses error:", error);
      res.status(500).json({ message: "Failed to get betting houses" });
    }
  });

  app.post("/api/betting-houses/:id/affiliate", requireAuth, async (req: any, res) => {
    try {
      const houseId = parseInt(req.params.id);
      const userId = req.session.user.id;
      
      // Check if already affiliated
      const existingLink = await storage.getAffiliateLinkByUserAndHouse(userId, houseId);
      if (existingLink) {
        return res.status(400).json({ message: "Already affiliated with this house" });
      }
      
      const house = await storage.getBettingHouseById(houseId);
      if (!house) {
        return res.status(404).json({ message: "Betting house not found" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate affiliate URL
      const generatedUrl = house.baseUrl.replace("VALUE", user.username);
      
      const affiliateLink = await storage.createAffiliateLink({
        userId,
        houseId,
        generatedUrl,
        isActive: true,
      });
      
      res.status(201).json({ 
        message: "Successfully affiliated", 
        link: affiliateLink 
      });
    } catch (error) {
      console.error("Affiliate error:", error);
      res.status(500).json({ message: "Failed to create affiliate link" });
    }
  });

  // User affiliate links
  app.get("/api/my-links", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const links = await storage.getAffiliateLinksByUserId(userId);
      
      // Get house details and stats for each link
      const linksWithDetails = await Promise.all(
        links.map(async (link) => {
          const house = await storage.getBettingHouseById(link.houseId);
          const clicks = await storage.getClicksByUserId(userId);
          const conversions = await storage.getConversionsByUserId(userId);
          
          const linkClicks = clicks.filter(c => c.linkId === link.id);
          const linkConversions = conversions.filter(c => c.linkId === link.id);
          const linkCommission = linkConversions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
          
          return {
            ...link,
            house,
            stats: {
              clicks: linkClicks.length,
              registrations: linkConversions.filter(c => c.type === 'registration').length,
              deposits: linkConversions.filter(c => c.type === 'deposit').length,
              commission: linkCommission,
            },
          };
        })
      );
      
      res.json(linksWithDetails);
    } catch (error) {
      console.error("Get my links error:", error);
      res.status(500).json({ message: "Failed to get affiliate links" });
    }
  });

  // User statistics
  app.get("/api/stats/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Failed to get user statistics" });
    }
  });

  // Admin routes - visualizar todos os links
  app.get("/api/admin/all-links", requireAdmin, async (req, res) => {
    try {
      const links = await db.select({
        id: affiliateLinks.id,
        userId: affiliateLinks.userId,
        houseId: affiliateLinks.houseId,
        generatedUrl: affiliateLinks.generatedUrl,
        isActive: affiliateLinks.isActive,
        createdAt: affiliateLinks.createdAt,
        userName: schema.users.username,
        houseName: schema.bettingHouses.name
      })
      .from(affiliateLinks)
      .leftJoin(schema.users, eq(affiliateLinks.userId, schema.users.id))
      .leftJoin(schema.bettingHouses, eq(affiliateLinks.houseId, schema.bettingHouses.id))
      .orderBy(sql`${affiliateLinks.createdAt} DESC`);
      
      res.json(links);
    } catch (error) {
      console.error("Get all links error:", error);
      res.status(500).json({ message: "Failed to get all links" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      const topAffiliates = await storage.getTopAffiliates(5);
      const topHouses = await storage.getTopHouses(5);
      
      res.json({
        ...stats,
        topAffiliates,
        topHouses,
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin statistics" });
    }
  });

  // Admin Affiliates Management
  app.get("/api/admin/affiliates", requireAdmin, async (req, res) => {
    try {
      const affiliates = await storage.getAllAffiliates();
      res.json(affiliates);
    } catch (error) {
      console.error("Get affiliates error:", error);
      res.status(500).json({ message: "Failed to get affiliates" });
    }
  });

  app.put("/api/admin/affiliates/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      await storage.updateUserStatus(id, isActive);
      res.json({ message: "Affiliate status updated successfully" });
    } catch (error) {
      console.error("Update affiliate status error:", error);
      res.status(500).json({ message: "Failed to update affiliate status" });
    }
  });

  app.post("/api/admin/affiliates/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.resetUserPassword(id);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete("/api/admin/affiliates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "Affiliate deleted successfully" });
    } catch (error) {
      console.error("Delete affiliate error:", error);
      res.status(500).json({ message: "Failed to delete affiliate" });
    }
  });

  // Admin Reports
  app.get("/api/admin/reports/general", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      const topAffiliates = await storage.getTopAffiliates(10);
      const topHouses = await storage.getTopHouses(10);
      
      res.json({
        totalClicks: stats.totalVolume,
        totalRegistrations: 0,
        totalDeposits: 0,
        totalRevenue: stats.paidCommissions,
        topAffiliates,
        topHouses,
      });
    } catch (error) {
      console.error("Get general reports error:", error);
      res.status(500).json({ message: "Failed to get general reports" });
    }
  });

  app.get("/api/admin/reports/affiliate/:id", requireAdmin, async (req, res) => {
    try {
      const affiliateId = parseInt(req.params.id);
      const stats = await storage.getUserStats(affiliateId);
      res.json({
        totalClicks: stats.totalClicks,
        totalRegistrations: stats.totalRegistrations,
        totalDeposits: stats.totalDeposits,
        totalCommission: stats.totalCommission,
        events: [], // Implementar eventos específicos se necessário
      });
    } catch (error) {
      console.error("Get affiliate report error:", error);
      res.status(500).json({ message: "Failed to get affiliate report" });
    }
  });

  app.get("/api/admin/reports/house/:id", requireAdmin, async (req, res) => {
    try {
      const houseId = parseInt(req.params.id);
      const conversions = await storage.getConversionsByHouseId(houseId);
      
      res.json({
        activeAffiliates: 0,
        totalTraffic: 0,
        conversions: conversions.length,
        revenue: 0,
        topAffiliates: [],
      });
    } catch (error) {
      console.error("Get house report error:", error);
      res.status(500).json({ message: "Failed to get house report" });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings/system", requireAdmin, async (req, res) => {
    try {
      // Retornar configurações padrão ou de um banco de configurações
      res.json({
        systemName: "AfiliadosBet",
        supportEmail: "suporte@afiliadosbet.com",
        apiKey: "ak_" + Math.random().toString(36).substring(2),
        mainDomain: "afiliadosbet.com",
        postbackBaseUrl: "https://api.afiliadosbet.com/postback",
      });
    } catch (error) {
      console.error("Get system settings error:", error);
      res.status(500).json({ message: "Failed to get system settings" });
    }
  });

  app.get("/api/admin/settings/commission", requireAdmin, async (req, res) => {
    try {
      res.json({
        defaultRevShare: 30,
        defaultCPA: 50,
      });
    } catch (error) {
      console.error("Get commission settings error:", error);
      res.status(500).json({ message: "Failed to get commission settings" });
    }
  });

  app.get("/api/admin/settings/global", requireAdmin, async (req, res) => {
    try {
      res.json({
        allowMultipleAffiliations: true,
        allowProfileEditing: true,
        defaultTheme: "dark",
      });
    } catch (error) {
      console.error("Get global settings error:", error);
      res.status(500).json({ message: "Failed to get global settings" });
    }
  });

  // User Events for Reports
  app.get("/api/user/events", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      // Retornar eventos do usuário (por enquanto vazio)
      res.json([]);
    } catch (error) {
      console.error("Get user events error:", error);
      res.status(500).json({ message: "Failed to get user events" });
    }
  });

  // User Payment Config
  app.get("/api/user/payment-config", requireAuth, async (req: any, res) => {
    try {
      // Retornar configuração de pagamento do usuário
      res.json({});
    } catch (error) {
      console.error("Get payment config error:", error);
      res.status(500).json({ message: "Failed to get payment config" });
    }
  });

  // Relatórios detalhados por afiliado para o modal de detalhes
  app.get("/api/admin/affiliate-stats/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const affiliateId = parseInt(req.params.id);
      const stats = await storage.getUserStats(affiliateId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      res.status(500).json({ message: "Failed to fetch affiliate stats" });
    }
  });

  app.get("/api/admin/affiliate-conversions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const affiliateId = parseInt(req.params.id);
      const conversions = await storage.getConversionsByUserId(affiliateId);
      
      // Buscar nomes das casas para cada conversão
      const conversionsWithHouses = await Promise.all(
        conversions.map(async (conversion) => {
          const house = await storage.getBettingHouseById(conversion.houseId);
          return {
            ...conversion,
            houseName: house?.name || 'Casa desconhecida'
          };
        })
      );
      
      res.json(conversionsWithHouses);
    } catch (error) {
      console.error("Error fetching affiliate conversions:", error);
      res.status(500).json({ message: "Failed to fetch affiliate conversions" });
    }
  });

  app.get("/api/user/payments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const payments = await storage.getPaymentsByUserId(userId);
      res.json(payments);
    } catch (error) {
      console.error("Get user payments error:", error);
      res.status(500).json({ message: "Failed to get user payments" });
    }
  });

  app.get("/api/admin/betting-houses", requireAdmin, async (req, res) => {
    try {
      const houses = await storage.getAllBettingHouses();
      
      // Retornar casas sem consultar conversões para evitar erro de coluna
      const housesWithStats = houses.map(house => ({
        ...house,
        stats: {
          affiliateCount: 1,
          totalVolume: 0,
          totalCommissions: 0,
        },
      }));
      
      res.json(housesWithStats);
    } catch (error) {
      console.error("Get admin betting houses error:", error);
      res.status(500).json({ message: "Failed to get betting houses" });
    }
  });

  app.post("/api/admin/betting-houses", requireAdmin, async (req, res) => {
    try {
      const houseData = insertBettingHouseSchema.parse(req.body);
      const house = await storage.createBettingHouse(houseData);
      res.status(201).json(house);
    } catch (error: any) {
      console.error("Create betting house error:", error);
      res.status(400).json({ 
        message: error.message || "Failed to create betting house",
        errors: error.issues || undefined
      });
    }
  });

  app.put("/api/admin/betting-houses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertBettingHouseSchema.partial().parse(req.body);
      const house = await storage.updateBettingHouse(id, updates);
      res.json(house);
    } catch (error: any) {
      console.error("Update betting house error:", error);
      res.status(400).json({ 
        message: error.message || "Failed to update betting house" 
      });
    }
  });

  app.delete("/api/admin/betting-houses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBettingHouse(id);
      res.json({ message: "Betting house deleted successfully" });
    } catch (error: any) {
      console.error("Delete betting house error:", error);
      
      // Verificar se é erro de chave estrangeira
      if (error.code === '23503' && error.constraint === 'conversions_house_id_betting_houses_id_fk') {
        res.status(400).json({ 
          message: "Não é possível excluir esta casa de apostas pois ela possui conversões registradas. Para manter a integridade dos dados históricos, desative a casa em vez de excluí-la.",
          type: "FOREIGN_KEY_CONSTRAINT"
        });
      } else {
        res.status(500).json({ message: "Failed to delete betting house" });
      }
    }
  });

  // Sistema de postbacks dinâmico baseado em parâmetros
  
  // Postback para Registration
  app.get("/api/postback/registration", async (req, res) => {
    try {
      const { house, subid, customer_id, ...otherParams } = req.query;
      
      if (!house || !subid) {
        return res.status(400).json({ message: "house e subid são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const bettingHouses = await storage.getAllBettingHouses();
      const bettingHouse = bettingHouses.find(h => h.name.toLowerCase() === (house as string).toLowerCase());
      if (!bettingHouse) {
        return res.status(404).json({ message: `Casa ${house} não encontrada` });
      }
      
      // Calcula comissão baseado no tipo da casa
      let commission = "0";
      if (bettingHouse.commissionType === "CPA") {
        commission = bettingHouse.commissionValue.toString();
      }
      
      await storage.createConversion({
        userId: user.id,
        houseId: bettingHouse.id,
        affiliateLinkId: null,
        type: "registration",
        amount: "0",
        commission,
        customerId: customer_id as string || null,
        conversionData: { house, ...otherParams },
      });
      
      res.json({ 
        success: true,
        message: "Registro rastreado com sucesso", 
        commission: parseFloat(commission),
        house: bettingHouse.name
      });
    } catch (error) {
      console.error("Erro no postback de registro:", error);
      res.status(500).json({ message: "Falha ao rastrear registro" });
    }
  });

  // Postback para Deposit
  app.get("/api/postback/deposit", async (req, res) => {
    try {
      const { house, subid, customer_id, amount, ...otherParams } = req.query;
      
      if (!house || !subid || !amount) {
        return res.status(400).json({ message: "house, subid e amount são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const bettingHouses = await storage.getAllBettingHouses();
      const bettingHouse = bettingHouses.find(h => h.name.toLowerCase() === (house as string).toLowerCase());
      if (!bettingHouse) {
        return res.status(404).json({ message: `Casa ${house} não encontrada` });
      }
      
      // Calcula comissão baseado no tipo da casa
      let commission = "0";
      if (bettingHouse.commissionType === "RevShare") {
        const depositAmount = parseFloat(amount as string);
        const commissionPercentage = parseFloat(bettingHouse.commissionValue.toString());
        commission = ((depositAmount * commissionPercentage) / 100).toString();
      }
      
      await storage.createConversion({
        userId: user.id,
        houseId: bettingHouse.id,
        affiliateLinkId: null,
        type: "deposit",
        amount: amount as string,
        commission,
        customerId: customer_id as string || null,
        conversionData: { house, ...otherParams },
      });
      
      res.json({ 
        success: true,
        message: "Depósito rastreado com sucesso", 
        commission: parseFloat(commission),
        house: bettingHouse.name
      });
    } catch (error) {
      console.error("Erro no postback de depósito:", error);
      res.status(500).json({ message: "Falha ao rastrear depósito" });
    }
  });

  // Postback para Profit
  app.get("/api/postback/profit", async (req, res) => {
    try {
      const { house, subid, customer_id, amount, ...otherParams } = req.query;
      
      if (!house || !subid || !amount) {
        return res.status(400).json({ message: "house, subid e amount são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const bettingHouses = await storage.getAllBettingHouses();
      const bettingHouse = bettingHouses.find(h => h.name.toLowerCase() === (house as string).toLowerCase());
      if (!bettingHouse) {
        return res.status(404).json({ message: `Casa ${house} não encontrada` });
      }
      
      // Para profit, geralmente não há comissão automática
      await storage.createConversion({
        userId: user.id,
        houseId: bettingHouse.id,
        affiliateLinkId: null,
        type: "profit",
        amount: amount as string,
        commission: "0",
        customerId: customer_id as string || null,
        conversionData: { house, ...otherParams },
      });
      
      res.json({ 
        success: true,
        message: "Lucro rastreado com sucesso",
        house: bettingHouse.name
      });
    } catch (error) {
      console.error("Erro no postback de lucro:", error);
      res.status(500).json({ message: "Falha ao rastrear lucro" });
    }
  });




      
      const bettingHouses = await storage.getAllBettingHouses();
      const targetHouse = bettingHouses.find(h => h.name.toLowerCase().replace(/\s+/g, '') === house);
      if (!targetHouse) {
        return res.status(404).json({ message: "Betting house not found" });
      }
      
      // Calcular comissão sobre profit (geralmente RevShare)
      let commission = 0;
      if (targetHouse.commissionType === "revshare") {
        const percentage = parseFloat(targetHouse.commissionValue.replace("%", ""));
        commission = (parseFloat(amount as string) * percentage) / 100;
      }
      
      await storage.createConversion({
        userId: user.id,
        houseId: targetHouse.id,
        affiliateLinkId: null,
        type: "profit",
        amount: amount as string,
        commission: commission.toString(),
        customerId: customer_id as string || null,
        conversionData: otherParams,
      });
      
      res.json({ message: "Profit tracked successfully", commission });
    } catch (error) {
      console.error("Postback profit error:", error);
      res.status(500).json({ message: "Failed to track profit" });
    }
  });

  // Postback routes for betting houses
  app.get("/api/postback/registration", async (req, res) => {
    try {
      const { house, subid, ...otherParams } = req.query;
      
      if (!house || !subid) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Find user by username (subid)
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find betting house
      const bettingHouse = await storage.getAllBettingHouses();
      const targetHouse = bettingHouse.find(h => h.name.toLowerCase().replace(/\s+/g, '') === house);
      if (!targetHouse) {
        return res.status(404).json({ message: "Betting house not found" });
      }
      
      // Create conversion
      await storage.createConversion({
        userId: user.id,
        houseId: targetHouse.id,
        type: "registration",
        amount: "0",
        commission: "0", // Will be calculated based on house commission rules
        conversionData: otherParams,
      });
      
      res.json({ message: "Registration tracked successfully" });
    } catch (error) {
      console.error("Postback registration error:", error);
      res.status(500).json({ message: "Failed to track registration" });
    }
  });

  app.get("/api/postback/deposit", async (req, res) => {
    try {
      const { house, subid, amount, ...otherParams } = req.query;
      
      if (!house || !subid || !amount) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Find user by username (subid)
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find betting house
      const bettingHouse = await storage.getAllBettingHouses();
      const targetHouse = bettingHouse.find(h => h.name.toLowerCase().replace(/\s+/g, '') === house);
      if (!targetHouse) {
        return res.status(404).json({ message: "Betting house not found" });
      }
      
      // Calculate commission based on house rules
      let commission = 0;
      if (targetHouse.commissionType === "revshare") {
        const percentage = parseFloat(targetHouse.commissionValue.replace("%", ""));
        commission = (parseFloat(amount as string) * percentage) / 100;
      } else if (targetHouse.commissionType === "cpa") {
        commission = parseFloat(targetHouse.commissionValue.replace("R$", "").trim());
      }
      
      // Create conversion
      await storage.createConversion({
        userId: user.id,
        houseId: targetHouse.id,
        type: "deposit",
        amount: amount as string,
        commission: commission.toString(),
        conversionData: otherParams,
      });
      
      res.json({ message: "Deposit tracked successfully" });
    } catch (error) {
      console.error("Postback deposit error:", error);
      res.status(500).json({ message: "Failed to track deposit" });
    }
  });

  const httpServer = createServer(app);
  
  // Configurar WebSocket para atualizações em tempo real
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Cliente WebSocket conectado');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Cliente WebSocket desconectado');
    });
  });
  
  // Função global para broadcast
  (global as any).broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  return httpServer;
}
