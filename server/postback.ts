import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

// Função simples para processar postbacks
export async function processPostback(req: Request, res: Response) {
  try {
    const { casa, evento } = req.params;
    const { subid, amount, customer_id } = req.query;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    
    console.log(`📩 Postback recebido: casa=${casa}, evento=${evento}, subid=${subid}, amount=${amount}`);
    
    // Verificar se a casa existe
    const house = await db.select()
      .from(schema.bettingHouses)
      .where(eq(schema.bettingHouses.identifier, casa))
      .limit(1);
    
    if (house.length === 0) {
      console.log(`❌ Casa não encontrada: ${casa}`);
      return res.status(404).json({ error: "Casa de apostas não encontrada" });
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
    
    console.log(`✅ Postback processado com sucesso para ${affiliate[0].username}`);
    res.json({ 
      success: true, 
      message: "Postback processado com sucesso",
      affiliate: affiliate[0].username,
      house: house[0].name
    });
    
  } catch (error) {
    console.error("❌ Erro no processamento do postback:", error);
    res.status(500).json({ error: "Erro interno no processamento" });
  }
}