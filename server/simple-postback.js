// Servidor de postbacks funcional com CPA e RevShare simultâneos
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
const app = express();

// Conexão com banco usando variável de ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Rota completa para postbacks com cálculo de comissões
app.get('/webhook/:casa/:evento', async (req, res) => {
  try {
    const { casa, evento } = req.params;
    const { subid, amount, customer_id } = req.query;
    const valorAmount = amount ? parseFloat(amount) : 0;
    
    console.log(`📩 Postback recebido: casa=${casa}, evento=${evento}, subid=${subid}, amount=${valorAmount}`);
    
    // Verificar se a casa existe
    const houseResult = await pool.query(
      'SELECT * FROM betting_houses WHERE identifier = $1 LIMIT 1',
      [casa]
    );
    
    if (houseResult.rows.length === 0) {
      console.log(`❌ Casa não encontrada: ${casa}`);
      return res.status(404).json({ error: "Casa não encontrada" });
    }
    
    const house = houseResult.rows[0];
    
    // Verificar se o afiliado existe
    const affiliateResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [subid]
    );
    
    if (affiliateResult.rows.length === 0) {
      console.log(`❌ Afiliado não encontrado: ${subid}`);
      return res.status(404).json({ error: "Afiliado não encontrado" });
    }
    
    const affiliate = affiliateResult.rows[0];
    
    // Calcular comissões - Hybrid tem valores separados para CPA e RevShare
    let totalCommission = 0;
    let commissions = [];
    
    // CPA para registration e first_deposit
    if ((evento === 'registration' || evento === 'first_deposit') && 
        (house.commission_type === 'CPA' || house.commission_type === 'Hybrid')) {
      
      let cpaValue;
      if (house.commission_type === 'Hybrid') {
        // Para Hybrid, usar cpa_value específico
        cpaValue = parseFloat(house.cpa_value || house.commission_value);
      } else {
        // Para CPA puro, usar commission_value
        cpaValue = parseFloat(house.commission_value);
      }
      
      totalCommission += cpaValue;
      commissions.push({ type: 'CPA', value: cpaValue });
      console.log(`💰 CPA aplicado: R$ ${cpaValue.toFixed(2)}`);
    }
    
    // RevShare para deposit e profit (pode ser aplicado junto com CPA)
    if ((evento === 'deposit' || evento === 'profit') && valorAmount > 0 &&
        (house.commission_type === 'RevShare' || house.commission_type === 'Hybrid')) {
      
      let percentage;
      if (house.commission_type === 'Hybrid') {
        // Para Hybrid, usar revshare_value específico
        percentage = parseFloat(house.revshare_value || house.commission_value) / 100;
      } else {
        // Para RevShare puro, usar commission_value
        percentage = parseFloat(house.commission_value) / 100;
      }
      
      const revShareValue = valorAmount * percentage;
      totalCommission += revShareValue;
      commissions.push({ type: 'RevShare', value: revShareValue, percentage: percentage * 100 });
      console.log(`💰 RevShare aplicado: ${(percentage * 100).toFixed(1)}% de R$ ${valorAmount} = R$ ${revShareValue.toFixed(2)}`);
    }
    
    console.log(`✅ Postback processado: ${affiliate.username} - ${house.name} - Comissão total: R$ ${totalCommission.toFixed(2)}`);
    
    res.json({ 
      success: true, 
      message: "Postback processado com sucesso",
      affiliate: affiliate.username,
      house: house.name,
      evento,
      amount: valorAmount,
      totalCommission: totalCommission.toFixed(2),
      commissions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Erro no postback:", error);
    res.status(500).json({ error: "Erro interno no processamento" });
  }
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Postback Handler', timestamp: new Date().toISOString() });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de postback funcionando na porta ${PORT}`);
  console.log(`📡 URLs de postback disponíveis:`);
  console.log(`   Registration: http://localhost:${PORT}/webhook/{casa}/registration?subid={username}&customer_id={id}`);
  console.log(`   Deposit: http://localhost:${PORT}/webhook/{casa}/deposit?subid={username}&amount={valor}&customer_id={id}`);
  console.log(`   Profit: http://localhost:${PORT}/webhook/{casa}/profit?subid={username}&amount={valor}&customer_id={id}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});