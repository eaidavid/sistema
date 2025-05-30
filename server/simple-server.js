// Servidor simples para testar postbacks e acessar painel
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(express.json());
app.use(express.static(join(__dirname, '../client/dist')));

// API para casas de apostas
app.get('/api/betting-houses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM betting_houses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para criar casa
app.post('/api/betting-houses', async (req, res) => {
  try {
    const { name, description, baseUrl, primaryParam, commissionType, commissionValue, cpaValue, revshareValue, identifier } = req.body;
    
    const result = await pool.query(
      `INSERT INTO betting_houses (name, description, base_url, primary_param, commission_type, commission_value, cpa_value, revshare_value, identifier, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [name, description, baseUrl, primaryParam, commissionType, commissionValue, cpaValue, revshareValue, identifier]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para o frontend
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor funcionando na porta ${PORT}`);
  console.log(`📡 Acesse: http://localhost:${PORT}`);
});