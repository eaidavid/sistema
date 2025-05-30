import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { affiliateLinks } from "@shared/schema";
import * as schema from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  insertUserSchema, 
  loginSchema, 
  insertBettingHouseSchema, 
  insertAffiliateLinkSchema 
} from "@shared/schema";

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  console.log("Verificando admin access:", {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userRole: req.session?.user?.role
  });
  
  if (!req.session?.user) {
    console.log("Sem sessão/usuário");
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.session.user.role || req.session.user.role !== "admin") {
    console.log("Usuário não é admin:", req.session.user?.role || 'role undefined');
    return res.status(403).json({ message: "Admin access required" });
  }
  
  console.log("Admin access autorizado");
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Start server on correct port and host
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // ROTA DE POSTBACK SIMPLIFICADA - SEMPRE REGISTRA LOGS
  app.get("/api/postback/:casa/:evento", async (req, res) => {
    const startTime = Date.now();
    console.log(`🔔 === POSTBACK RECEBIDO === ${new Date().toISOString()}`);
    console.log(`URL completa: ${req.url}`);
    console.log(`Parâmetros: casa=${req.params.casa}, evento=${req.params.evento}`);
    console.log(`Query: ${JSON.stringify(req.query)}`);
    console.log(`IP: ${req.ip}`);
    
    try {
      const { casa, evento } = req.params;
      const { subid, amount, customer_id } = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      // SEMPRE registrar o log primeiro, independentemente de validações
      const logData = {
        casa: casa as string,
        evento: evento as string,
        subid: (subid as string) || 'unknown',
        valor: amount ? parseFloat(amount as string) : 0,
        ip,
        raw: req.url,
        status: 'PROCESSING'
      };
      
      console.log(`📝 Registrando log inicial:`, logData);
      const logEntry = await db.insert(schema.postbackLogs).values(logData).returning();
      console.log(`✅ Log criado com ID: ${logEntry[0].id}`);
      
      // Verificar se a casa existe
      const houses = await db.select()
        .from(schema.bettingHouses)
        .where(eq(schema.bettingHouses.identifier, casa));
      
      if (houses.length === 0) {
        console.log(`❌ Casa não encontrada: ${casa}`);
        await db.update(schema.postbackLogs)
          .set({ status: 'ERROR_HOUSE_NOT_FOUND' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        return res.status(404).json({ error: "Casa de apostas não encontrada", logId: logEntry[0].id });
      }
      
      const house = houses[0];
      console.log(`✅ Casa encontrada: ${house.name}`);
      
      // Verificar se o afiliado existe
      const affiliates = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string));
      
      if (affiliates.length === 0) {
        console.log(`❌ Afiliado não encontrado: ${subid}`);
        await db.update(schema.postbackLogs)
          .set({ status: 'ERROR_AFFILIATE_NOT_FOUND' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        return res.status(404).json({ error: "Afiliado não encontrado", logId: logEntry[0].id });
      }
      
      const affiliate = affiliates[0];
      console.log(`✅ Afiliado encontrado: ${affiliate.username}`);
      
      // Registrar evento
      console.log(`📊 Registrando evento...`);
      const eventoData = await db.insert(schema.eventos).values({
        afiliadoId: affiliate.id,
        casa: house.identifier,
        evento,
        valor: amount ? (amount as string) : null
      }).returning();
      console.log(`✅ Evento registrado com ID: ${eventoData[0].id}`);
      
      // Calcular comissão
      let commissionValue = 0;
      let tipo = 'CPA';
      
      if (house.commissionType === 'CPA' && (evento === 'registration' || evento === 'first_deposit')) {
        commissionValue = parseFloat(house.commissionValue);
        tipo = 'CPA';
      } else if (house.commissionType === 'RevShare' && amount && (evento === 'deposit' || evento === 'profit')) {
        const percentage = parseFloat(house.commissionValue) / 100;
        commissionValue = parseFloat(amount as string) * percentage;
        tipo = 'RevShare';
      }
      
      // Salvar comissão se houver
      if (commissionValue > 0) {
        console.log(`💰 Calculando comissão ${tipo}: R$ ${commissionValue}`);
        await db.insert(schema.comissoes).values({
          afiliadoId: affiliate.id,
          eventoId: eventoData[0].id,
          tipo,
          valor: commissionValue.toString()
        });
        console.log(`✅ Comissão salva: R$ ${commissionValue} para ${affiliate.username}`);
      }
      
      // Atualizar log como sucesso
      await db.update(schema.postbackLogs)
        .set({ status: 'SUCCESS' })
        .where(eq(schema.postbackLogs.id, logEntry[0].id));
      
      const processTime = Date.now() - startTime;
      console.log(`🎉 Postback processado com sucesso em ${processTime}ms`);
      console.log(`=== FIM DO POSTBACK ===`);
      
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue,
        type: tipo,
        affiliate: affiliate.username,
        house: house.name,
        event: evento,
        logId: logEntry[0].id,
        processTime: `${processTime}ms`
      });
      
    } catch (error) {
      console.error("❌ ERRO CRÍTICO no postback:", error);
      res.status(500).json({ 
        error: "Erro interno no processamento", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POSTBACK ROUTE - Must be first to avoid being caught by other routes
  app.get("/postback/:casa/:evento/:token", async (req, res) => {
    try {
      const { casa, evento, token } = req.params;
      const { subid, amount, customer_id } = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      console.log(`📩 Postback recebido: casa=${casa}, evento=${evento}, token=${token}, subid=${subid}`);
      
      // Verificar se a casa existe pelo identificador
      const house = await db.select()
        .from(schema.bettingHouses)
        .where(eq(schema.bettingHouses.identifier, casa))
        .limit(1);
      
      if (house.length === 0) {
        console.log(`❌ Casa não encontrada: ${casa}`);
        return res.status(404).json({ error: "Casa de apostas não encontrada" });
      }
      
      // Verificar token de segurança
      if (house[0].securityToken !== token) {
        console.log(`❌ Token inválido: esperado ${house[0].securityToken}, recebido ${token}`);
        return res.status(401).json({ error: "Token de segurança inválido" });
      }
      
      // Buscar afiliado pelo subid
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (affiliate.length === 0) {
        console.log(`❌ Afiliado não encontrado: ${subid}`);
        return res.status(404).json({ error: "Afiliado não encontrado" });
      }
      
      // Criar log do postback
      const logData = await db.insert(schema.postbackLogs).values({
        casa,
        evento,
        subid: subid as string,
        valor: amount ? parseFloat(amount as string) : 0,
        ip,
        raw: req.url,
        status: 'SUCCESS'
      }).returning();
      
      // Registrar evento
      const eventoData = await db.insert(schema.eventos).values({
        afiliadoId: affiliate[0].id,
        casa,
        evento,
        valor: amount ? (amount as string) : null
      }).returning();
      
      // Calcular comissão baseada no tipo da casa
      let commissionValue = 0;
      let tipo = 'CPA';
      
      if (house[0].commissionType === 'CPA') {
        commissionValue = parseFloat(house[0].commissionValue);
        tipo = 'CPA';
      } else if (house[0].commissionType === 'RevShare' && amount) {
        const percentage = parseFloat(house[0].commissionValue) / 100;
        commissionValue = parseFloat(amount as string) * percentage;
        tipo = 'RevShare';
      }
      
      // Salvar comissão se houver
      if (commissionValue > 0) {
        await db.insert(schema.comissoes).values({
          afiliadoId: affiliate[0].id,
          eventoId: eventoData[0].id,
          tipo,
          valor: commissionValue.toString()
        });
        
        console.log(`💰 Comissão ${tipo}: R$ ${commissionValue} para ${affiliate[0].username} (${house[0].name})`);
      }
      
      console.log(`✅ Postback processado com sucesso`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue,
        type: tipo,
        affiliate: affiliate[0].username,
        house: house[0].name
      });
      
    } catch (error) {
      console.error("❌ Erro no processamento do postback:", error);
      res.status(500).json({ error: "Erro interno no processamento", status: "ERROR" });
    }
  });

  
  // === NOVO SISTEMA DE POSTBACKS CONFORME ESPECIFICAÇÃO ===
  // Rota dinâmica: /postback/:casa/:evento/:token
  app.get("/postback/:casa/:evento/:token", async (req, res) => {
    try {
      const { casa, evento, token } = req.params;
      const queryParams = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      console.log(`📩 Postback recebido: casa=${casa}, evento=${evento}, token=${token}`);
      console.log(`📊 Parâmetros:`, queryParams);
      
      // 1. Buscar a casa pelo slug/identifier
      const houseRecord = await db.select()
        .from(schema.bettingHouses)
        .where(eq(schema.bettingHouses.identifier, casa))
        .limit(1);
      
      if (!houseRecord.length) {
        console.log(`❌ Casa não encontrada: ${casa}`);
        await db.insert(schema.postbackLogs).values({
          casa,
          evento,
          subid: queryParams.subid as string || 'unknown',
          status: 'ERROR',
          erro: 'Casa não encontrada',
          parametrosRecebidos: queryParams,
          ip,
          userAgent
        });
        return res.status(400).json({ error: "Casa não encontrada", casa });
      }
      
      const house = houseRecord[0];
      
      // 2. Validar token de segurança
      if (house.securityToken !== token) {
        console.log(`❌ Token inválido para casa ${casa}. Esperado: ${house.securityToken}, Recebido: ${token}`);
        await db.insert(schema.postbackLogs).values({
          casa,
          evento,
          subid: queryParams.subid as string || 'unknown',
          status: 'ERROR',
          erro: 'Token de segurança inválido',
          parametrosRecebidos: queryParams,
          ip,
          userAgent
        });
        return res.status(401).json({ error: "Token de segurança inválido" });
      }
      
      // 3. Normalizar parâmetros usando o mapeamento da casa
      const paramMapping = house.parameterMapping as Record<string, string> || {};
      const normalizedParams = {
        subid: queryParams[paramMapping.subid || 'subid'] as string,
        amount: queryParams[paramMapping.amount || 'amount'] as string,
        customer_id: queryParams[paramMapping.customer_id || 'customer_id'] as string
      };
      
      console.log(`🔄 Parâmetros normalizados:`, normalizedParams);
      
      if (!normalizedParams.subid) {
        console.log(`❌ SubID não encontrado nos parâmetros`);
        await db.insert(schema.postbackLogs).values({
          casa,
          evento,
          subid: 'unknown',
          status: 'ERROR',
          erro: 'SubID não encontrado',
          parametrosRecebidos: queryParams,
          ip,
          userAgent
        });
        return res.status(400).json({ error: "SubID não encontrado" });
      }
      
      // 4. Buscar afiliado pelo subid (username)
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, normalizedParams.subid))
        .limit(1);
      
      if (!affiliate.length) {
        console.log(`❌ Afiliado não encontrado: ${normalizedParams.subid}`);
        await db.insert(schema.postbackLogs).values({
          casa,
          evento,
          subid: normalizedParams.subid,
          status: 'ERROR',
          erro: 'Afiliado não encontrado',
          parametrosRecebidos: queryParams,
          ip,
          userAgent
        });
        return res.status(400).json({ error: "Afiliado não encontrado", subid: normalizedParams.subid });
      }
      
      const affiliateUser = affiliate[0];
      
      // 5. Registrar o evento
      await db.insert(schema.eventos).values({
        afiliadoId: affiliateUser.id,
        casa: house.name,
        evento,
        valor: normalizedParams.amount ? parseFloat(normalizedParams.amount) : null,
        customerId: normalizedParams.customer_id,
        parametros: queryParams,
        ip
      });
      
      // 6. Calcular e registrar comissão se aplicável
      if (normalizedParams.amount && (evento === 'deposit' || evento === 'deposito' || evento === 'first_deposit')) {
        const amount = parseFloat(normalizedParams.amount);
        let commissionValue = 0;
        
        if (house.commissionType === 'RevShare') {
          const percentage = parseFloat(house.commissionValue.replace('%', ''));
          commissionValue = (amount * percentage) / 100;
        } else if (house.commissionType === 'CPA') {
          commissionValue = parseFloat(house.commissionValue.replace('R$', '').replace(',', '.'));
        }
        
        if (commissionValue > 0) {
          await db.insert(schema.comissoes).values({
            afiliadoId: affiliateUser.id,
            tipo: house.commissionType,
            valor: commissionValue,
            eventoId: null // Vamos buscar o último evento inserido se necessário
          });
          
          console.log(`💰 Comissão calculada: R$ ${commissionValue.toFixed(2)} para ${affiliateUser.username}`);
        }
      }
      
      // 7. Registrar log de sucesso
      await db.insert(schema.postbackLogs).values({
        casa,
        evento,
        subid: normalizedParams.subid,
        status: 'SUCCESS',
        erro: null,
        parametrosRecebidos: queryParams,
        ip,
        userAgent
      });
      
      console.log(`✅ Postback processado com sucesso para ${normalizedParams.subid}`);
      
      return res.json({ 
        status: "success", 
        message: "Postback processado com sucesso",
        subid: normalizedParams.subid,
        evento,
        casa 
      });
      
    } catch (error) {
      console.error("❌ Erro no processamento do postback:", error);
      
      // Registrar erro no log
      try {
        await db.insert(schema.postbackLogs).values({
          casa: req.params.casa || 'unknown',
          evento: req.params.evento || 'unknown',
          subid: req.query.subid as string || 'unknown',
          status: 'ERROR',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          parametrosRecebidos: req.query,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        });
      } catch (logError) {
        console.error("Erro ao registrar log:", logError);
      }
      
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // === SISTEMA LEGADO DE POSTBACK (manter compatibilidade) ===
  // Rota de API para postback que funciona corretamente
  app.get("/api/postback/:casa", async (req, res) => {
    try {
      const casa = req.params.casa;
      const { subid, event, amount } = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const rawQuery = req.url;
      
      console.log(`📩 Postback recebido: casa=${casa}, subid=${subid}, event=${event}, amount=${amount}`);
      
      // Validar se subid existe
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (!affiliate.length) {
        console.log(`❌ SubID não encontrado: ${subid}`);
        return res.status(400).json({ error: "SubID não encontrado", subid });
      }
      
      // Buscar configurações da casa para calcular comissão correta
      const houseRecord = await db.select()
        .from(schema.bettingHouses)
        .where(sql`LOWER(${schema.bettingHouses.name}) = ${casa.toLowerCase()}`)
        .limit(1);
      
      if (!houseRecord.length) {
        console.log(`❌ Casa não encontrada: ${casa}`);
        return res.status(400).json({ error: "Casa não encontrada", casa });
      }
      
      const house = houseRecord[0];
      
      // Calcular comissão baseada nas configurações definidas pelo admin
      let commissionValue = 0;
      let tipo = '';
      const depositAmount = parseFloat(amount as string) || 0;
      
      if (event === 'registration' && house.commissionType === 'CPA') {
        commissionValue = house.commissionValue; // CPA configurado pelo admin
        tipo = 'CPA';
        console.log(`💰 CPA calculado: R$ ${commissionValue} (configurado para ${house.name})`);
      } else if (['deposit', 'revenue', 'profit'].includes(event as string) && house.commissionType === 'RevShare') {
        commissionValue = (depositAmount * house.commissionValue) / 100; // RevShare configurado pelo admin
        tipo = 'RevShare';
        console.log(`💰 RevShare calculado: R$ ${commissionValue} (${house.commissionValue}% de R$ ${depositAmount})`);
      }
      
      // Criar pagamento se houver comissão
      if (commissionValue > 0) {
        await storage.createPayment({
          userId: affiliate[0].id,
          amount: commissionValue,
          status: 'pending',
          description: `${tipo} ${event} - ${casa} (${house.commissionValue}${tipo === 'RevShare' ? '%' : ''})`,
          conversionId: null
        });
        
        console.log(`💰 Comissão ${tipo}: R$ ${commissionValue} para ${affiliate[0].username} (${house.name})`);
      }
      
      console.log(`✅ Postback processado com sucesso`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue,
        type: tipo,
        affiliate: affiliate[0].username,
        house: house.name,
        houseCommission: house.commissionValue
      });
      
    } catch (error) {
      console.error("Erro no postback:", error);
      res.status(500).json({ error: "Erro interno no processamento" });
    }
  });
  
  // Rota principal de postback GET /postback/:casa
  app.get("/postback/:casa", async (req, res) => {
    try {
      const casa = req.params.casa;
      const { subid, event, amount } = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const rawQuery = req.url;
      
      console.log(`📩 Postback recebido: casa=${casa}, subid=${subid}, event=${event}, amount=${amount}`);
      
      // Log inicial do postback
      const logEntry = await db.insert(schema.postbackLogs).values({
        casa,
        subid: subid as string,
        evento: event as string,
        valor: parseFloat(amount as string) || 0,
        ip,
        raw: rawQuery,
        status: 'processando',
        criadoEm: new Date()
      }).returning();
      
      // Validar se subid existe
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (!affiliate.length) {
        await db.update(schema.postbackLogs)
          .set({ status: 'erro_subid' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        
        console.log(`❌ SubID não encontrado: ${subid}`);
        return res.status(400).json({ error: "SubID não encontrado" });
      }
      
      // Buscar casa
      const houseRecord = await db.select()
        .from(schema.bettingHouses)
        .where(sql`LOWER(${schema.bettingHouses.name}) = ${casa.toLowerCase()}`)
        .limit(1);
      
      if (!houseRecord.length) {
        await db.update(schema.postbackLogs)
          .set({ status: 'erro_casa' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        
        console.log(`❌ Casa não encontrada: ${casa}`);
        return res.status(400).json({ error: "Casa não encontrada" });
      }
      
      // Registrar evento
      const evento = await db.insert(schema.eventos).values({
        afiliadoId: affiliate[0].id,
        casa,
        evento: event as string,
        valor: parseFloat(amount as string) || 0,
        criadoEm: new Date()
      }).returning();
      
      // Calcular comissão
      let commissionValue = 0;
      let tipo = '';
      const depositAmount = parseFloat(amount as string) || 0;
      
      if (event === 'registration') {
        commissionValue = 50; // CPA fixa R$50
        tipo = 'CPA';
      } else if (['deposit', 'revenue', 'profit'].includes(event as string)) {
        commissionValue = (depositAmount * 20) / 100; // RevShare 20%
        tipo = 'RevShare';
      }
      
      // Salvar comissão se houver
      if (commissionValue > 0) {
        await db.insert(schema.comissoes).values({
          afiliadoId: affiliate[0].id,
          eventoId: evento[0].id,
          tipo,
          valor: commissionValue,
          criadoEm: new Date()
        });
        
        // Criar pagamento
        await storage.createPayment({
          userId: affiliate[0].id,
          amount: commissionValue,
          status: 'pending',
          description: `${tipo} ${event} - ${casa}`,
          conversionId: evento[0].id
        });
        
        console.log(`💰 Comissão ${tipo}: R$ ${commissionValue} para ${affiliate[0].username}`);
      }
      
      // Atualizar log como registrado
      await db.update(schema.postbackLogs)
        .set({ status: 'registrado' })
        .where(eq(schema.postbackLogs.id, logEntry[0].id));
      
      console.log(`✅ Postback processado com sucesso`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue,
        type: tipo
      });
      
    } catch (error) {
      console.error("Erro no postback:", error);
      res.status(500).json({ error: "Erro interno no processamento" });
    }
  });

  app.use(getSession());

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("=== LOGIN DEBUG ===");
      console.log("Request body:", req.body);
      console.log("Body type:", typeof req.body);
      console.log("Body keys:", Object.keys(req.body || {}));
      
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Schema validation failed:", result.error);
        return res.status(400).json({ message: "Invalid credentials format", errors: result.error.issues });
      }
      
      const user = await storage.authenticateUser(result.data);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.user = user;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      
      // Verificar se já existe usuário com mesmo username
      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }
      
      // Verificar se já existe usuário com mesmo email
      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Verificar se já existe usuário com mesmo CPF
      const users = await storage.getAllAffiliates();
      const existingCpf = users.find(user => user.cpf === result.data.cpf);
      if (existingCpf) {
        return res.status(400).json({ message: "CPF já está em uso" });
      }
      
      const user = await storage.createUser(result.data);
      req.session.user = user;
      res.json(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Verificar se é erro de constraint unique do banco
      if (error.code === '23505') { // PostgreSQL unique constraint error code
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Nome de usuário já está em uso" });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email já está em uso" });
        }
        if (error.constraint === 'users_cpf_unique') {
          return res.status(400).json({ message: "CPF já está em uso" });
        }
      }
      
      // Fallback para mensagens genéricas
      if (error.message && error.message.includes('unique')) {
        if (error.message.includes('username')) {
          return res.status(400).json({ message: "Nome de usuário já está em uso" });
        }
        if (error.message.includes('email')) {
          return res.status(400).json({ message: "Email já está em uso" });
        }
        if (error.message.includes('cpf')) {
          return res.status(400).json({ message: "CPF já está em uso" });
        }
      }
      
      res.status(500).json({ message: "Falha no registro" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    res.json(req.session.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });



  // Sistema de postbacks dinâmico - baseado na sua imagem
  
  // 1. Postback para Cliques
  app.post("/api/postback/click", async (req, res) => {
    try {
      const { house, subid, customer_id, ...otherParams } = req.body;
      
      if (!house || !subid) {
        return res.status(400).json({ message: "house e subid são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const bettingHouses = await storage.getAllBettingHouses();
      const bettingHouse = bettingHouses.find(h => 
        h.name.toLowerCase() === (house as string).toLowerCase()
      );
      if (!bettingHouse) {
        return res.status(404).json({ message: `Casa ${house} não encontrada` });
      }
      
      // Buscar o link de afiliação específico
      const affiliateLink = await storage.getAffiliateLinkByUserAndHouse(user.id, bettingHouse.id);
      if (!affiliateLink) {
        return res.status(404).json({ message: "Link de afiliação não encontrado" });
      }
      
      // Registra o clique VINCULADO ao link correto
      await storage.createConversion({
        userId: user.id,
        houseId: bettingHouse.id,
        affiliateLinkId: affiliateLink.id,
        type: "click",
        amount: "0",
        commission: "0",
        customerId: customer_id as string || null,
        conversionData: { house, ...otherParams },
      });
      
      res.json({ 
        success: true,
        message: "Clique rastreado com sucesso",
        house: bettingHouse.name
      });
    } catch (error) {
      console.error("Erro no postback de clique:", error);
      res.status(500).json({ message: "Falha ao rastrear clique" });
    }
  });

  // 2. Postback para Registros
  app.post("/api/postback/registration", async (req, res) => {
    try {
      const { house, subid, customer_id, ...otherParams } = req.body;
      
      if (!house || !subid) {
        return res.status(400).json({ message: "house e subid são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(subid as string);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const bettingHouses = await storage.getAllBettingHouses();
      const bettingHouse = bettingHouses.find(h => 
        h.name.toLowerCase() === (house as string).toLowerCase()
      );
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

  // 3. Postback para Primeiro Depósito
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
      const bettingHouse = bettingHouses.find(h => 
        h.name.toLowerCase() === (house as string).toLowerCase()
      );
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

  // 4. Postback para Depósitos Recorrentes
  app.get("/api/postback/recurring-deposit", async (req, res) => {
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
      const bettingHouse = bettingHouses.find(h => 
        h.name.toLowerCase() === (house as string).toLowerCase()
      );
      if (!bettingHouse) {
        return res.status(404).json({ message: `Casa ${house} não encontrada` });
      }
      
      // Calcula comissão para depósitos recorrentes (geralmente RevShare)
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
        type: "recurring_deposit",
        amount: amount as string,
        commission,
        customerId: customer_id as string || null,
        conversionData: { house, ...otherParams },
      });
      
      res.json({ 
        success: true,
        message: "Depósito recorrente rastreado com sucesso", 
        commission: parseFloat(commission),
        house: bettingHouse.name
      });
    } catch (error) {
      console.error("Erro no postback de depósito recorrente:", error);
      res.status(500).json({ message: "Falha ao rastrear depósito recorrente" });
    }
  });

  // 5. Postback para Profit/Lucro
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
      const bettingHouse = bettingHouses.find(h => 
        h.name.toLowerCase() === (house as string).toLowerCase()
      );
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

  // ✅ API para casas DISPONÍVEIS para afiliamento (NÃO afiliadas ainda)
  app.get("/api/betting-houses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      
      // Buscar todas as casas ativas
      const allHouses = await storage.getActiveBettingHouses();
      
      // Buscar casas às quais o usuário já está afiliado
      const userAffiliations = await storage.getAffiliateLinksByUserId(userId);
      const affiliatedHouseIds = userAffiliations.map(link => link.houseId);
      
      // Retornar apenas casas NÃO afiliadas (disponíveis para afiliamento)
      const availableHouses = allHouses.filter(house => 
        !affiliatedHouseIds.includes(house.id)
      );
      
      console.log(`Casas disponíveis para afiliamento (usuário ${userId}):`, availableHouses.length);
      res.json(availableHouses);
    } catch (error) {
      console.error("Erro ao buscar casas disponíveis:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ✅ Nova API para AFILIAÇÕES ATIVAS do usuário
  app.get("/api/my-affiliations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      
      // Buscar links de afiliação do usuário com dados da casa
      const affiliateLinks = await storage.getAffiliateLinksByUserId(userId);
      
      const affiliationsWithHouses = await Promise.all(
        affiliateLinks.map(async (link) => {
          const house = await storage.getBettingHouseById(link.houseId);
          return {
            id: link.id,
            house: house,
            personalizedUrl: link.generatedUrl,
            isActive: link.isActive,
            affiliatedAt: link.createdAt
          };
        })
      );

      console.log(`Afiliações ativas (usuário ${userId}):`, affiliationsWithHouses.length);
      res.json(affiliationsWithHouses);
    } catch (error) {
      console.error("Erro ao buscar afiliações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Nova rota melhorada para afiliação
  app.post("/api/affiliate/:houseId", requireAuth, async (req: any, res) => {
    try {
      const houseId = parseInt(req.params.houseId);
      const userId = req.session.user.id;
      
      // Verificar se a casa existe e está ativa
      const house = await storage.getBettingHouseById(houseId);
      if (!house) {
        return res.status(404).json({ message: "Casa de apostas não encontrada" });
      }
      
      if (!house.isActive) {
        return res.status(400).json({ message: "Casa de apostas não está ativa" });
      }
      
      // Verificar se já está afiliado
      const existingLink = await storage.getAffiliateLinkByUserAndHouse(userId, houseId);
      if (existingLink) {
        return res.status(400).json({ message: "Você já é afiliado desta casa" });
      }
      
      // Buscar dados do usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Gerar URL único baseado no template da casa + username do usuário
      const generatedUrl = house.baseUrl.replace("VALUE", user.username);
      
      // Criar link de afiliação
      const affiliateLink = await storage.createAffiliateLink({
        userId,
        houseId,
        generatedUrl,
        isActive: true,
      });
      
      res.json({ 
        success: true,
        message: "Afiliação realizada com sucesso!",
        link: affiliateLink
      });
    } catch (error) {
      console.error("Erro na afiliação:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor" 
      });
    }
  });

  app.get("/api/stats/user", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.session.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Failed to get user statistics" });
    }
  });

  // Nova rota para buscar links de afiliação do usuário
  app.get("/api/my-links", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
      console.log("Buscando links para usuário:", userId, "tipo:", typeof userId);
      const links = await storage.getAffiliateLinksByUserId(userId);
      console.log("Links encontrados:", links.length);
      
      // Adicionar detalhes da casa para cada link com validação
      const linksWithDetails = await Promise.all(
        links.map(async (link) => {
          try {
            const house = await storage.getBettingHouseById(link.houseId);
            return {
              id: link.id || 0,
              userId: link.userId || 0,
              houseId: link.houseId || 0,
              generatedUrl: link.generatedUrl || "",
              isActive: link.isActive || false,
              createdAt: link.createdAt || new Date(),
              house: house ? {
                id: house.id || 0,
                name: house.name || "",
                description: house.description || "",
                logoUrl: house.logoUrl || "",
                commissionType: house.commissionType || "revshare",
                commissionValue: house.commissionValue || "0",
              } : null,
              stats: {
                clicks: 0,
                registrations: 0,
                deposits: 0,
                commission: 0,
              },
            };
          } catch (error) {
            console.error("Error processing link:", error);
            return null;
          }
        })
      );
      
      // Filtrar links nulos e enviar resposta
      const validLinks = linksWithDetails.filter(link => link !== null);
      res.json(validLinks);
    } catch (error) {
      console.error("Erro ao buscar links:", error);
      res.status(500).json({ message: "Erro ao buscar links de afiliação" });
    }
  });

  // Rota para eventos do usuário
  app.get("/api/user/events", requireAuth, async (req: any, res) => {
    try {
      const conversions = await storage.getConversionsByUserId(req.session.user.id);
      res.json(conversions);
    } catch (error) {
      console.error("Get user events error:", error);
      res.status(500).json({ message: "Failed to get user events" });
    }
  });

  // Relatórios detalhados para admin
  app.get("/api/admin/reports/general", requireAdmin, async (req, res) => {
    try {
      const conversions = await db.select({
        id: schema.conversions.id,
        type: schema.conversions.type,
        amount: schema.conversions.amount,
        commission: schema.conversions.commission,
        convertedAt: schema.conversions.convertedAt,
        userName: schema.users.username,
        houseName: schema.bettingHouses.name,
        customerId: schema.conversions.customerId
      })
      .from(schema.conversions)
      .leftJoin(schema.users, eq(schema.conversions.userId, schema.users.id))
      .leftJoin(schema.bettingHouses, eq(schema.conversions.houseId, schema.bettingHouses.id))
      .orderBy(sql`${schema.conversions.convertedAt} DESC`);

      // Estatísticas agregadas
      const totalClicks = conversions.filter(c => c.type === 'click').length;
      const totalRegistrations = conversions.filter(c => c.type === 'registration').length;
      const totalDeposits = conversions.filter(c => c.type === 'deposit').length;
      const totalRecurringDeposits = conversions.filter(c => c.type === 'recurring_deposit').length;
      const totalProfits = conversions.filter(c => c.type === 'profit').length;
      
      const totalCommission = conversions
        .filter(c => c.commission && parseFloat(c.commission) > 0)
        .reduce((sum, c) => sum + parseFloat(c.commission || '0'), 0);

      const totalVolume = conversions
        .filter(c => c.amount && parseFloat(c.amount) > 0)
        .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

      res.json({
        totalClicks,
        totalRegistrations,
        totalDeposits,
        totalRecurringDeposits,
        totalProfits,
        totalCommission,
        totalVolume,
        conversions: conversions.slice(0, 100) // Últimas 100 conversões
      });
    } catch (error) {
      console.error("Erro nos relatórios gerais:", error);
      res.status(500).json({ message: "Falha ao obter relatórios gerais" });
    }
  });

  app.get("/api/admin/reports/affiliate/:id", requireAdmin, async (req, res) => {
    try {
      const affiliateId = parseInt(req.params.id);
      
      const conversions = await db.select({
        id: schema.conversions.id,
        type: schema.conversions.type,
        amount: schema.conversions.amount,
        commission: schema.conversions.commission,
        convertedAt: schema.conversions.convertedAt,
        houseName: schema.bettingHouses.name,
        customerId: schema.conversions.customerId,
        conversionData: schema.conversions.conversionData
      })
      .from(schema.conversions)
      .leftJoin(schema.bettingHouses, eq(schema.conversions.houseId, schema.bettingHouses.id))
      .where(eq(schema.conversions.userId, affiliateId))
      .orderBy(sql`${schema.conversions.convertedAt} DESC`);

      // Estatísticas detalhadas por afiliado
      const totalClicks = conversions.filter(c => c.type === 'click').length;
      const totalRegistrations = conversions.filter(c => c.type === 'registration').length;
      const totalDeposits = conversions.filter(c => c.type === 'deposit').length;
      const totalRecurringDeposits = conversions.filter(c => c.type === 'recurring_deposit').length;
      const totalProfits = conversions.filter(c => c.type === 'profit').length;
      
      const totalCommission = conversions
        .filter(c => c.commission && parseFloat(c.commission) > 0)
        .reduce((sum, c) => sum + parseFloat(c.commission || '0'), 0);

      const totalVolume = conversions
        .filter(c => c.amount && parseFloat(c.amount) > 0)
        .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

      // Conversão por casa de apostas
      const conversionsByHouse = conversions.reduce((acc, conv) => {
        const house = conv.houseName || 'Desconhecido';
        if (!acc[house]) {
          acc[house] = {
            clicks: 0,
            registrations: 0,
            deposits: 0,
            recurringDeposits: 0,
            profits: 0,
            totalCommission: 0,
            totalVolume: 0
          };
        }
        
        acc[house][conv.type === 'click' ? 'clicks' : 
                  conv.type === 'registration' ? 'registrations' :
                  conv.type === 'deposit' ? 'deposits' :
                  conv.type === 'recurring_deposit' ? 'recurringDeposits' : 'profits']++;
        
        if (conv.commission) acc[house].totalCommission += parseFloat(conv.commission);
        if (conv.amount) acc[house].totalVolume += parseFloat(conv.amount);
        
        return acc;
      }, {} as any);

      res.json({
        totalClicks,
        totalRegistrations,
        totalDeposits,
        totalRecurringDeposits,
        totalProfits,
        totalCommission,
        totalVolume,
        conversionsByHouse,
        conversions
      });
    } catch (error) {
      console.error("Erro no relatório do afiliado:", error);
      res.status(500).json({ message: "Falha ao obter relatório do afiliado" });
    }
  });

  app.get("/api/admin/reports/house/:id", requireAdmin, async (req, res) => {
    try {
      const houseId = parseInt(req.params.id);
      
      const conversions = await db.select({
        id: schema.conversions.id,
        type: schema.conversions.type,
        amount: schema.conversions.amount,
        commission: schema.conversions.commission,
        convertedAt: schema.conversions.convertedAt,
        userName: schema.users.username,
        customerId: schema.conversions.customerId
      })
      .from(schema.conversions)
      .leftJoin(schema.users, eq(schema.conversions.userId, schema.users.id))
      .where(eq(schema.conversions.houseId, houseId))
      .orderBy(sql`${schema.conversions.convertedAt} DESC`);

      // Estatísticas por casa
      const totalClicks = conversions.filter(c => c.type === 'click').length;
      const totalRegistrations = conversions.filter(c => c.type === 'registration').length;
      const totalDeposits = conversions.filter(c => c.type === 'deposit').length;
      const totalRecurringDeposits = conversions.filter(c => c.type === 'recurring_deposit').length;
      const totalProfits = conversions.filter(c => c.type === 'profit').length;
      
      const totalCommission = conversions
        .filter(c => c.commission && parseFloat(c.commission) > 0)
        .reduce((sum, c) => sum + parseFloat(c.commission || '0'), 0);

      const totalVolume = conversions
        .filter(c => c.amount && parseFloat(c.amount) > 0)
        .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

      res.json({
        totalClicks,
        totalRegistrations,
        totalDeposits,
        totalRecurringDeposits,
        totalProfits,
        totalCommission,
        totalVolume,
        conversions
      });
    } catch (error) {
      console.error("Erro no relatório da casa:", error);
      res.status(500).json({ message: "Falha ao obter relatório da casa" });
    }
  });

  // Admin routes - Gestão completa de afiliados
  app.get("/api/admin/affiliates", async (req, res) => {
    try {
      console.log("=== API ADMIN AFFILIATES ===");
      console.log("Session:", req.session);
      console.log("User:", req.session?.user);
      
      const affiliates = await storage.getAllAffiliates();
      console.log("Affiliates encontrados:", affiliates.length);
      console.log("Dados:", affiliates);
      
      res.json(affiliates);
    } catch (error) {
      console.error("Erro ao buscar afiliados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/affiliates/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateUserStatus(id, isActive);
      res.json({ success: true });
    } catch (error) {
      console.error("Update affiliate status error:", error);
      res.status(500).json({ message: "Failed to update affiliate status" });
    }
  });
  app.get("/api/admin/betting-houses", requireAdmin, async (req, res) => {
    try {
      const houses = await storage.getAllBettingHouses();
      res.json(houses);
    } catch (error) {
      console.error("Get admin betting houses error:", error);
      res.status(500).json({ message: "Failed to get betting houses" });
    }
  });

  app.post("/api/admin/betting-houses", requireAdmin, async (req, res) => {
    try {
      console.log("🏠 Admin criando nova casa de apostas...");
      const result = insertBettingHouseSchema.safeParse(req.body);
      if (!result.success) {
        console.log("❌ Validação falhou:", result.error);
        return res.status(400).json({ 
          message: "Dados inválidos da casa de apostas",
          errors: result.error.errors 
        });
      }
      
      console.log("✅ Dados validados, criando casa:", result.data);
      const house = await storage.createBettingHouse(result.data);
      
      console.log("✅ Casa criada com sucesso, ID:", house.id);
      
      // 🎯 CRIAR LINKS AUTOMATICAMENTE PARA TODOS OS AFILIADOS ATIVOS
      try {
        const activeAffiliates = await db
          .select()
          .from(schema.users)
          .where(and(
            eq(schema.users.role, 'affiliate'),
            eq(schema.users.isActive, true)
          ));
        
        console.log(`🎯 Criando links automáticos para ${activeAffiliates.length} afiliados ativos da casa ${house.name}`);
        
        let linksCreated = 0;
        for (const affiliate of activeAffiliates) {
          // Verificar se já existe link para este afiliado e casa
          const existingLink = await storage.getAffiliateLinkByUserAndHouse(affiliate.id, house.id);
          
          if (!existingLink) {
            // Gerar URL do afiliado baseada na URL base da casa
            const affiliateUrl = house.baseUrl.replace('VALUE', affiliate.username);
            
            const linkData = {
              userId: affiliate.id,
              houseId: house.id,
              generatedUrl: affiliateUrl,
              isActive: true
            };
            
            await storage.createAffiliateLink(linkData);
            linksCreated++;
            console.log(`✅ Link criado automaticamente: ${affiliate.username} -> ${house.name}`);
          }
        }
        
        console.log(`🎉 ${linksCreated} links automáticos criados para a casa ${house.name}`);
      } catch (linkError) {
        console.error("⚠️ Erro ao criar links automáticos:", linkError);
        // Não falha a criação da casa se houver erro nos links
      }
      
      res.json(house);
    } catch (error) {
      console.error("❌ Erro ao criar casa:", error);
      res.status(500).json({ message: "Falha ao criar casa de apostas" });
    }
  });

  // Nova rota de afiliação compatível com o componente seguro
  app.post("/api/affiliate", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { houseId } = req.body;
      
      console.log("🔗 Nova afiliação solicitada:", { userId, houseId });
      
      if (!userId || !houseId) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      
      // Verificar se a casa existe e está ativa
      const house = await storage.getBettingHouseById(houseId);
      if (!house || !house.isActive) {
        return res.status(404).json({ message: "Casa não encontrada ou inativa" });
      }
      
      // Verificar se já está afiliado (ignorar links com VALUE)
      const existingLink = await storage.getAffiliateLinkByUserAndHouse(userId, houseId);
      if (existingLink && existingLink.generatedUrl && !existingLink.generatedUrl.includes('VALUE')) {
        return res.status(400).json({ message: "Você já está afiliado a esta casa" });
      }
      
      // Buscar dados do usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Gerar URL personalizada (substitui VALUE pelo username)
      const generatedUrl = house.baseUrl.replace("VALUE", user.username);
      
      console.log("✅ Criando afiliação:", { generatedUrl, username: user.username });
      
      // Remover link antigo com VALUE se existir
      if (existingLink && existingLink.generatedUrl && existingLink.generatedUrl.includes('VALUE')) {
        await storage.deactivateAffiliateLink(existingLink.id);
      }
      
      // Criar nova afiliação
      const affiliateLink = await storage.createAffiliateLink({
        userId,
        houseId,
        generatedUrl,
        isActive: true,
      });
      
      console.log("✅ Afiliação criada com sucesso:", affiliateLink);
      
      res.json({ 
        success: true,
        message: "Afiliação realizada com sucesso!",
        link: affiliateLink
      });
    } catch (error) {
      console.error("❌ Erro na afiliação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota para admin visualizar todos os links
  app.get("/api/admin/affiliate-links", requireAdmin, async (req, res) => {
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
      console.error("Get admin affiliate links error:", error);
      res.status(500).json({ message: "Failed to get affiliate links" });
    }
  });

  // Rota para admin visualizar postback URLs de uma casa específica
  app.get("/api/admin/betting-houses/:id/postbacks", requireAdmin, async (req, res) => {
    try {
      const houseId = parseInt(req.params.id);
      const house = await storage.getBettingHouseById(houseId);
      
      if (!house) {
        return res.status(404).json({ message: "Casa de apostas não encontrada" });
      }

      const postbackUrls = {
        registration: `/api/postback/registration?house=${house.name.toLowerCase()}&subid={subid}&customer_id={customer_id}`,
        deposit: `/api/postback/deposit?house=${house.name.toLowerCase()}&subid={subid}&amount={amount}&customer_id={customer_id}`,
        profit: `/api/postback/profit?house=${house.name.toLowerCase()}&subid={subid}&amount={amount}&customer_id={customer_id}`
      };

      res.json({
        house: house.name,
        postbackUrls
      });
    } catch (error) {
      console.error("Get postback URLs error:", error);
      res.status(500).json({ message: "Failed to get postback URLs" });
    }
  });

  // WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // === INTEGRAÇÃO BIDIRECIONAL ADMIN ⇄ USUÁRIO ===
  
  // Admin - Atualizar status do usuário (afeta painel do usuário)
  app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateUserStatus(userId, isActive);
      
      // Se bloqueado, desativa todos os links do usuário
      if (!isActive) {
        const userLinks = await storage.getAffiliateLinksByUserId(userId);
        for (const link of userLinks) {
          await storage.deactivateAffiliateLink(link.id);
        }
      }
      
      res.json({ 
        message: isActive ? "Usuário desbloqueado com sucesso" : "Usuário bloqueado e links desativados",
        affectedUser: await storage.getUserById(userId),
        affectedLinks: !isActive ? await storage.getAffiliateLinksByUserId(userId) : []
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Admin - Forçar geração de link para usuário específico
  app.post("/api/admin/users/:userId/generate-link", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { houseId } = req.body;
      
      const user = await storage.getUserById(userId);
      const house = await storage.getBettingHouseById(houseId);
      
      if (!user || !house) {
        return res.status(404).json({ message: "Usuário ou casa não encontrados" });
      }

      // Verifica se já existe link
      const existingLink = await storage.getAffiliateLinkByUserAndHouse(userId, houseId);
      if (existingLink) {
        return res.status(400).json({ message: "Link já existe para este usuário e casa" });
      }

      // Gera novo link
      const newLink = await storage.createAffiliateLink({
        userId,
        houseId,
        generatedUrl: house.baseUrl.replace('{subid}', user.username),
        isActive: true
      });

      res.json({ 
        message: "Link gerado com sucesso pelo admin",
        link: newLink,
        user: user.username,
        house: house.name
      });
    } catch (error) {
      console.error("Admin generate link error:", error);
      res.status(500).json({ message: "Failed to generate link" });
    }
  });

  // Admin - Visualizar dados específicos de um usuário (para relatórios)
  app.get("/api/admin/users/:id/detailed-stats", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const stats = await storage.getUserStats(userId);
      const links = await storage.getAffiliateLinksByUserId(userId);
      const conversions = await storage.getConversionsByUserId(userId);
      const clicks = await storage.getClicksByUserId(userId);
      const payments = await storage.getPaymentsByUserId(userId);

      res.json({
        user,
        stats,
        links: links.length,
        activeLinks: links.filter(l => l.isActive).length,
        conversions: conversions.length,
        clicks: clicks.length,
        payments,
        totalEarnings: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      });
    } catch (error) {
      console.error("Get user detailed stats error:", error);
      res.status(500).json({ message: "Failed to get user detailed stats" });
    }
  });

  // Admin - Aprovar/rejeitar pagamento (afeta painel do usuário)
  app.patch("/api/admin/payments/:id/status", requireAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status, transactionId } = req.body;
      
      await storage.updatePaymentStatus(paymentId, status, transactionId);
      
      const payment = await db.select()
        .from(schema.payments)
        .where(eq(schema.payments.id, paymentId))
        .limit(1);

      res.json({ 
        message: `Pagamento ${status === 'paid' ? 'aprovado' : 'rejeitado'} com sucesso`,
        payment: payment[0]
      });
    } catch (error) {
      console.error("Update payment status error:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Admin - Editar valor de comissão manualmente
  app.patch("/api/admin/commissions/:id", requireAdmin, async (req, res) => {
    try {
      const conversionId = parseInt(req.params.id);
      const { amount, status } = req.body;
      
      await db.update(schema.conversions)
        .set({ 
          commission: parseFloat(amount),
          status: status || 'confirmed'
        })
        .where(eq(schema.conversions.id, conversionId));

      res.json({ 
        message: "Comissão atualizada com sucesso",
        conversionId,
        newAmount: amount
      });
    } catch (error) {
      console.error("Update commission error:", error);
      res.status(500).json({ message: "Failed to update commission" });
    }
  });

  // Admin - Criar evento/conversão manual
  app.post("/api/admin/manual-conversion", requireAdmin, async (req, res) => {
    try {
      const { userId, houseId, type, amount, commission, description } = req.body;
      
      const conversion = await storage.createConversion({
        userId: parseInt(userId),
        houseId: parseInt(houseId),
        type,
        amount: parseFloat(amount) || 0,
        customerId: `manual_${Date.now()}`,
        status: 'confirmed'
      });

      // Cria pagamento se houver comissão
      if (commission > 0) {
        await storage.createPayment({
          userId: parseInt(userId),
          amount: parseFloat(commission),
          status: 'pending',
          description: description || `Conversão manual ${type}`,
          conversionId: conversion.id
        });
      }

      res.json({ 
        message: "Conversão manual criada com sucesso",
        conversion,
        commission
      });
    } catch (error) {
      console.error("Create manual conversion error:", error);
      res.status(500).json({ message: "Failed to create manual conversion" });
    }
  });

  // Admin - Obter todas as conversões/eventos
  app.get("/api/admin/all-conversions", requireAdmin, async (req, res) => {
    try {
      const conversions = await db.select({
        id: schema.conversions.id,
        userId: schema.conversions.userId,
        houseId: schema.conversions.houseId,
        type: schema.conversions.type,
        amount: schema.conversions.amount,
        commission: schema.conversions.commission,
        status: schema.conversions.status,
        convertedAt: schema.conversions.convertedAt,
        customerId: schema.conversions.customerId,
        userName: schema.users.username,
        userEmail: schema.users.email,
        houseName: schema.bettingHouses.name
      })
      .from(schema.conversions)
      .leftJoin(schema.users, eq(schema.conversions.userId, schema.users.id))
      .leftJoin(schema.bettingHouses, eq(schema.conversions.houseId, schema.bettingHouses.id))
      .orderBy(sql`${schema.conversions.convertedAt} DESC`);
      
      res.json(conversions);
    } catch (error) {
      console.error("Get all conversions error:", error);
      res.status(500).json({ message: "Failed to get conversions" });
    }
  });

  // Usuário - Verificar se conta está ativa (afetado por ações do admin)
  app.get("/api/user/account-status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const activeLinks = await storage.getAffiliateLinksByUserId(userId);
      const stats = await storage.getUserStats(userId);

      res.json({
        isActive: user.isActive,
        username: user.username,
        totalLinks: activeLinks.length,
        activeLinksCount: activeLinks.filter(l => l.isActive).length,
        stats
      });
    } catch (error) {
      console.error("Get account status error:", error);
      res.status(500).json({ message: "Failed to get account status" });
    }
  });

  // === SISTEMA DE RASTREAMENTO COMPLETO ===
  
  // Endpoint para rastreamento de cliques (/go/casa?ref=123)
  app.get("/go/:casa", async (req, res) => {
    try {
      const casaName = req.params.casa.toLowerCase();
      const refId = req.query.ref || req.query.subid;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      console.log(`🔗 Clique rastreado: casa=${casaName}, ref=${refId}, ip=${ip}`);
      
      // Busca a casa de apostas
      const house = await db.select()
        .from(schema.bettingHouses)
        .where(sql`LOWER(${schema.bettingHouses.name}) = ${casaName}`)
        .limit(1);
      
      if (!house.length) {
        console.log(`❌ Casa não encontrada: ${casaName}`);
        return res.status(404).send("Casa de apostas não encontrada");
      }
      
      // Busca o afiliado pelo username (ref/subid)
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, refId))
        .limit(1);
      
      if (!affiliate.length) {
        console.log(`❌ Afiliado não encontrado: ${refId}`);
        return res.status(404).send("Afiliado não encontrado");
      }
      
      // Registra o clique
      await storage.trackClick({
        userId: affiliate[0].id,
        houseId: house[0].id,
        ipAddress: ip,
        userAgent: userAgent,
        referrer: req.get('Referer') || null
      });
      
      console.log(`✅ Clique registrado: userId=${affiliate[0].id}, houseId=${house[0].id}`);
      
      // Redireciona para o link da casa
      res.redirect(house[0].baseUrl.replace('{subid}', refId));
      
    } catch (error) {
      console.error("Erro no rastreamento de clique:", error);
      res.status(500).send("Erro interno");
    }
  });

  // === SISTEMA COMPLETO DE POSTBACK ===
  
  // Rota principal de postback GET /postback/:casa
  app.get("/postback/:casa", async (req, res) => {
    try {
      const casa = req.params.casa;
      const { subid, event, amount } = req.query;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const rawQuery = req.url;
      
      console.log(`📩 Postback recebido: casa=${casa}, subid=${subid}, event=${event}, amount=${amount}`);
      
      // Log inicial do postback
      const logEntry = await db.insert(schema.postbackLogs).values({
        casa,
        subid: subid as string,
        evento: event as string,
        valor: parseFloat(amount as string) || 0,
        ip,
        raw: rawQuery,
        status: 'processando',
        criadoEm: new Date()
      }).returning();
      
      // Validar se subid existe
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (!affiliate.length) {
        await db.update(schema.postbackLogs)
          .set({ status: 'erro_subid' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        
        console.log(`❌ SubID não encontrado: ${subid}`);
        return res.status(400).json({ error: "SubID não encontrado" });
      }
      
      // Buscar casa
      const houseRecord = await db.select()
        .from(schema.bettingHouses)
        .where(sql`LOWER(${schema.bettingHouses.name}) = ${casa.toLowerCase()}`)
        .limit(1);
      
      if (!houseRecord.length) {
        await db.update(schema.postbackLogs)
          .set({ status: 'erro_casa' })
          .where(eq(schema.postbackLogs.id, logEntry[0].id));
        
        console.log(`❌ Casa não encontrada: ${casa}`);
        return res.status(400).json({ error: "Casa não encontrada" });
      }
      
      // Registrar evento
      const evento = await db.insert(schema.eventos).values({
        afiliadoId: affiliate[0].id,
        casa,
        evento: event as string,
        valor: parseFloat(amount as string) || 0,
        criadoEm: new Date()
      }).returning();
      
      // Calcular comissão
      let commissionValue = 0;
      let tipo = '';
      const depositAmount = parseFloat(amount as string) || 0;
      
      if (event === 'registration') {
        commissionValue = 50; // CPA fixa R$50
        tipo = 'CPA';
      } else if (['deposit', 'revenue', 'profit'].includes(event as string)) {
        commissionValue = (depositAmount * 20) / 100; // RevShare 20%
        tipo = 'RevShare';
      }
      
      // Salvar comissão se houver
      if (commissionValue > 0) {
        await db.insert(schema.comissoes).values({
          afiliadoId: affiliate[0].id,
          eventoId: evento[0].id,
          tipo,
          valor: commissionValue,
          criadoEm: new Date()
        });
        
        // Criar pagamento
        await storage.createPayment({
          userId: affiliate[0].id,
          amount: commissionValue,
          status: 'pending',
          description: `${tipo} ${event} - ${casa}`,
          conversionId: evento[0].id
        });
        
        console.log(`💰 Comissão ${tipo}: R$ ${commissionValue} para ${affiliate[0].username}`);
      }
      
      // Atualizar log como registrado
      await db.update(schema.postbackLogs)
        .set({ status: 'registrado' })
        .where(eq(schema.postbackLogs.id, logEntry[0].id));
      
      console.log(`✅ Postback processado com sucesso`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue,
        type: tipo
      });
      
    } catch (error) {
      console.error("Erro no postback:", error);
      res.status(500).json({ error: "Erro interno no processamento" });
    }
  });

  // Endpoint MELHORADO para postbacks com processamento de comissões (POST)
  app.post("/api/postback", async (req, res) => {
    try {
      const { event, ref, subid, amount, house, customer_id } = req.body;
      const userRef = ref || subid;
      
      console.log(`📩 Postback recebido: event=${event}, ref=${userRef}, amount=${amount}, house=${house}`);
      
      // Busca o afiliado
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, userRef))
        .limit(1);
      
      if (!affiliate.length) {
        console.log(`❌ Afiliado não encontrado no postback: ${userRef}`);
        return res.status(400).json({ error: "Afiliado não encontrado" });
      }
      
      // Busca a casa
      const houseRecord = await db.select()
        .from(schema.bettingHouses)
        .where(sql`LOWER(${schema.bettingHouses.name}) = ${house.toLowerCase()}`)
        .limit(1);
      
      if (!houseRecord.length) {
        console.log(`❌ Casa não encontrada no postback: ${house}`);
        return res.status(400).json({ error: "Casa não encontrada" });
      }
      
      // Registra a conversão
      const conversion = await storage.createConversion({
        userId: affiliate[0].id,
        houseId: houseRecord[0].id,
        type: event,
        amount: parseFloat(amount) || 0,
        customerId: customer_id || null,
        status: 'confirmed'
      });
      
      // Calcula comissão baseada no tipo da casa
      let commissionValue = 0;
      const depositAmount = parseFloat(amount) || 0;
      
      if (event === 'registration' && houseRecord[0].commissionType === 'CPA') {
        commissionValue = houseRecord[0].commissionValue || 50; // CPA fixo
      } else if ((event === 'deposit' || event === 'recurring-deposit') && houseRecord[0].commissionType === 'RevShare') {
        commissionValue = (depositAmount * (houseRecord[0].commissionValue || 30)) / 100; // RevShare %
      }
      
      // Cria pagamento se houver comissão
      if (commissionValue > 0) {
        await storage.createPayment({
          userId: affiliate[0].id,
          amount: commissionValue,
          status: 'pending',
          description: `Comissão ${event} - ${houseRecord[0].name}`,
          conversionId: conversion.id
        });
        
        console.log(`💰 Comissão criada: R$ ${commissionValue} para ${affiliate[0].username}`);
      }
      
      console.log(`✅ Postback processado com sucesso`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        commission: commissionValue
      });
      
    } catch (error) {
      console.error("Erro no processamento do postback:", error);
      res.status(500).json({ error: "Erro interno no processamento" });
    }
  });

  wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');
    
    ws.on('close', () => {
      console.log('Cliente WebSocket desconectado');
    });
  });



  // === SISTEMA COMPLETO DE POSTBACKS DINÂMICOS ===
  
  // Rota pública para receber postbacks das casas: GET /postback/:identifier/:event
  app.get("/postback/:identifier/:event", async (req, res) => {
    const { identifier, event } = req.params;
    const { subid, amount, customer_id, ...otherParams } = req.query;
    
    const logData = {
      houseIdentifier: identifier,
      event: event,
      subid: subid as string,
      amount: amount as string,
      customerId: customer_id as string,
      rawData: { ...req.query },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'PROCESSING',
      processedAt: new Date()
    };

    try {
      console.log(`🔄 Postback recebido: ${identifier}/${event} - subid: ${subid}, amount: ${amount}`);
      
      // 1. Validar se a casa existe e aceita esse tipo de postback
      const house = await db.select()
        .from(schema.bettingHouses)
        .where(eq(schema.bettingHouses.identifier, identifier))
        .limit(1);
      
      if (!house.length) {
        logData.status = 'INVALID_HOUSE';
        await db.insert(schema.postbackLogs).values(logData);
        return res.status(400).json({ error: "Casa não encontrada", status: "INVALID_HOUSE" });
      }
      
      // 2. Verificar se a casa aceita esse evento
      const enabledEvents = house[0].enabledPostbacks as string[];
      if (!enabledEvents || !enabledEvents.includes(event)) {
        logData.status = 'INVALID_EVENT';
        await db.insert(schema.postbackLogs).values(logData);
        return res.status(400).json({ error: "Evento não aceito por esta casa", status: "INVALID_EVENT" });
      }
      
      // 3. Validar se o afiliado (subid) existe
      if (!subid) {
        logData.status = 'INVALID_SUBID';
        await db.insert(schema.postbackLogs).values(logData);
        return res.status(400).json({ error: "SubID obrigatório", status: "INVALID_SUBID" });
      }
      
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (!affiliate.length) {
        logData.status = 'INVALID_SUBID';
        await db.insert(schema.postbackLogs).values(logData);
        return res.status(400).json({ error: "Afiliado não encontrado", status: "INVALID_SUBID" });
      }
      
      // 4. Calcular comissão baseada no tipo de evento e casa
      let commissionValue = 0;
      const depositAmount = parseFloat(amount as string) || 0;
      
      if ((event === 'registration' || event === 'first_deposit') && house[0].commissionType === 'cpa') {
        // CPA: valor fixo para registro/primeiro depósito
        const cpaValue = house[0].commissionValue.replace(/[^\d]/g, ''); // Remove R$ e outros caracteres
        commissionValue = parseFloat(cpaValue) || 0;
      } else if ((event === 'deposit' || event === 'profit') && house[0].commissionType === 'revshare') {
        // RevShare: porcentagem do valor
        const percentage = house[0].commissionValue.replace(/[^\d]/g, ''); // Remove % e outros caracteres
        commissionValue = (depositAmount * parseFloat(percentage)) / 100;
      }
      
      // 5. Registrar conversão se houver comissão
      if (commissionValue > 0) {
        await storage.createConversion({
          userId: affiliate[0].id,
          houseId: house[0].id,
          type: event,
          amount: depositAmount,
          customerId: customer_id as string || null,
          status: 'confirmed'
        });
        
        // 6. Criar pagamento
        await storage.createPayment({
          userId: affiliate[0].id,
          amount: commissionValue,
          status: 'pending',
          description: `${event.toUpperCase()} - ${house[0].name}`,
          conversionId: null // Será atualizado se necessário
        });
        
        console.log(`💰 Comissão calculada: R$ ${commissionValue.toFixed(2)} para ${affiliate[0].username}`);
      }
      
      // 7. Registrar log como sucesso
      logData.status = 'OK';
      logData.commissionCalculated = commissionValue.toString();
      await db.insert(schema.postbackLogs).values(logData);
      
      console.log(`✅ Postback processado com sucesso: ${identifier}/${event}`);
      res.json({ 
        success: true, 
        status: "OK",
        message: "Postback processado com sucesso",
        commission: commissionValue.toFixed(2),
        affiliate: affiliate[0].username
      });
      
    } catch (error) {
      console.error("❌ Erro no processamento do postback:", error);
      logData.status = 'ERROR';
      try {
        await db.insert(schema.postbackLogs).values(logData);
      } catch (logError) {
        console.error("Erro ao salvar log:", logError);
      }
      res.status(500).json({ error: "Erro interno no processamento", status: "ERROR" });
    }
  });

  // === APIS PARA LOGS DE POSTBACKS REAIS ===
  
  // API para buscar logs de postbacks recebidos
  app.get("/api/admin/postback-logs", requireAdmin, async (req, res) => {
    try {
      const { status, casa, subid } = req.query;
      
      console.log("Buscando logs de postbacks com filtros:", { status, casa, subid });
      
      // Buscar logs da tabela postback_logs com filtros opcionais
      let query = db.select().from(schema.postbackLogs);
      
      if (status && status !== 'all') {
        query = query.where(eq(schema.postbackLogs.status, status as string));
      }
      if (casa) {
        query = query.where(eq(schema.postbackLogs.casa, casa as string));
      }
      if (subid) {
        query = query.where(eq(schema.postbackLogs.subid, subid as string));
      }
      
      const logs = await query
        .orderBy(desc(schema.postbackLogs.criadoEm))
        .limit(100);
      
      console.log(`Encontrados ${logs.length} logs de postbacks`);
      res.json(logs);
    } catch (error) {
      console.error("Erro ao buscar logs de postbacks:", error);
      res.status(500).json({ message: "Erro ao buscar logs de postbacks" });
    }
  });

  app.get("/api/admin/eventos", requireAdmin, async (req, res) => {
    try {
      const eventos = await db.select({
        id: schema.eventos.id,
        casa: schema.eventos.casa,
        evento: schema.eventos.evento,
        valor: schema.eventos.valor,
        criadoEm: schema.eventos.criadoEm,
        afiliadoUsername: schema.users.username,
        afiliadoEmail: schema.users.email
      })
      .from(schema.eventos)
      .leftJoin(schema.users, eq(schema.eventos.afiliadoId, schema.users.id))
      .orderBy(desc(schema.eventos.criadoEm))
      .limit(100);
      
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Failed to fetch eventos" });
    }
  });

  app.get("/api/admin/comissoes", requireAdmin, async (req, res) => {
    try {
      const comissoes = await db.select({
        id: schema.comissoes.id,
        tipo: schema.comissoes.tipo,
        valor: schema.comissoes.valor,
        criadoEm: schema.comissoes.criadoEm,
        afiliadoUsername: schema.users.username,
        eventoTipo: schema.eventos.evento,
        eventoCasa: schema.eventos.casa
      })
      .from(schema.comissoes)
      .leftJoin(schema.users, eq(schema.comissoes.afiliadoId, schema.users.id))
      .leftJoin(schema.eventos, eq(schema.comissoes.eventoId, schema.eventos.id))
      .orderBy(desc(schema.comissoes.criadoEm))
      .limit(100);
      
      res.json(comissoes);
    } catch (error) {
      console.error("Error fetching comissoes:", error);
      res.status(500).json({ message: "Failed to fetch comissoes" });
    }
  });

  // ROTA FUNCIONAL PARA POSTBACKS COM CPA E REVSHARE SIMULTÂNEOS
  app.get("/webhook/:casa/:evento", async (req, res) => {
    try {
      const { casa, evento } = req.params;
      const { subid, amount, customer_id } = req.query;
      const valorAmount = amount ? parseFloat(amount as string) : 0;
      
      console.log(`📩 Postback recebido: casa=${casa}, evento=${evento}, subid=${subid}, amount=${valorAmount}`);
      
      // Verificar se a casa existe
      const house = await db.select()
        .from(schema.bettingHouses)
        .where(eq(schema.bettingHouses.identifier, casa))
        .limit(1);
      
      if (house.length === 0) {
        console.log(`❌ Casa não encontrada: ${casa}`);
        return res.status(404).json({ error: "Casa não encontrada" });
      }
      
      // Verificar se o afiliado existe
      const affiliate = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, subid as string))
        .limit(1);
      
      if (affiliate.length === 0) {
        console.log(`❌ Afiliado não encontrado: ${subid}`);
        return res.status(404).json({ error: "Afiliado não encontrado" });
      }
      
      // Calcular comissões - CPA e RevShare podem ser aplicados juntos
      let totalCommission = 0;
      let commissions = [];
      
      // Verificar CPA para registration e first_deposit
      if ((evento === 'registration' || evento === 'first_deposit') && house[0].commissionType === 'CPA') {
        const cpaValue = parseFloat(house[0].commissionValue);
        totalCommission += cpaValue;
        commissions.push({ type: 'CPA', value: cpaValue });
        console.log(`💰 CPA aplicado: R$ ${cpaValue.toFixed(2)}`);
      }
      
      // Verificar RevShare para deposit e profit
      if ((evento === 'deposit' || evento === 'profit') && valorAmount > 0) {
        // RevShare pode ser aplicado mesmo se já teve CPA
        if (house[0].commissionType === 'RevShare' || house[0].commissionType === 'Hybrid') {
          const percentage = parseFloat(house[0].commissionValue) / 100;
          const revShareValue = valorAmount * percentage;
          totalCommission += revShareValue;
          commissions.push({ type: 'RevShare', value: revShareValue, percentage });
          console.log(`💰 RevShare aplicado: ${percentage}% de R$ ${valorAmount} = R$ ${revShareValue.toFixed(2)}`);
        }
      }
      
      console.log(`✅ Postback processado: ${affiliate[0].username} - ${house[0].name} - Comissão total: R$ ${totalCommission.toFixed(2)}`);
      res.json({ 
        success: true, 
        message: "Postback processado com sucesso",
        affiliate: affiliate[0].username,
        house: house[0].name,
        evento,
        amount: valorAmount,
        totalCommission: totalCommission.toFixed(2),
        commissions
      });
      
    } catch (error) {
      console.error("❌ Erro no postback:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  return httpServer;
}