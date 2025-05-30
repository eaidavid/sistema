import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware para parsing JSON
app.use(express.json());

// Servir arquivos estáticos do build do Vite
const distPath = join(__dirname, '../dist/public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Fallback para SPA - todas as rotas não encontradas devem servir o index.html
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Se o build não existir, mostrar página temporária
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Afiliados</title>
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            text-align: center;
            padding: 2rem;
            border: 1px solid #334155;
            border-radius: 12px;
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
          }
          h1 { color: #3b82f6; margin-bottom: 1rem; }
          p { color: #94a3b8; margin-bottom: 0.5rem; }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #334155;
            border-left: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sistema de Afiliados</h1>
          <div class="spinner"></div>
          <p>Preparando o sistema...</p>
          <p>O build do front-end está sendo gerado.</p>
          <p>Aguarde alguns momentos.</p>
        </div>
        <script>
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        </script>
      </body>
      </html>
    `);
  });
}

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor temporário rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});