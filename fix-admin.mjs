import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;

async function fixAdmin() {
  const pool = new Pool({
    user: 'afiliadosbet',
    host: 'localhost',
    database: 'afiliadosbet',
    password: 'AfiliadosBet1001',
    port: 5432,
  });

  try {
    console.log('Corrigindo usuário admin...');
    
    // Criar hash da senha "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Deletar usuários admin existentes
    await pool.query('DELETE FROM users WHERE role = $1', ['admin']);
    
    // Criar novo usuário admin
    const result = await pool.query(`
      INSERT INTO users (name, email, cpf, password, role, city, is_active, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
      RETURNING id, email
    `, [
      'Administrador',
      'admin@admin.com', 
      '00000000000',
      hashedPassword,
      'admin',
      'São Paulo',
      true
    ]);
    
    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixAdmin();