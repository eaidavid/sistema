import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect to the actual React app
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Fallback for landing page if needed
app.get('/landing', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AfiliadosBet - Sistema de Marketing de Afiliados</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          color: white;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          z-index: -1;
          animation: backgroundShift 20s ease-in-out infinite;
        }

        @keyframes backgroundShift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-5px, -10px) rotate(1deg); }
          50% { transform: translate(5px, 5px) rotate(-1deg); }
          75% { transform: translate(-3px, 8px) rotate(0.5deg); }
        }

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .navbar.scrolled {
          background: rgba(15, 23, 42, 0.98);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .logo {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: flex;
          gap: 2.5rem;
          list-style: none;
        }

        .nav-links a {
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 500;
          position: relative;
          transition: all 0.3s ease;
          padding: 0.5rem 0;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          transition: width 0.3s ease;
        }

        .nav-links a:hover {
          color: #3b82f6;
          transform: translateY(-1px);
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          margin-top: 80px;
        }

        .hero {
          position: relative;
          text-align: center;
          padding: 6rem 0;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          z-index: -1;
        }

        .hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .hero p {
          font-size: 1.4rem;
          color: #cbd5e1;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 4rem;
        }

        .card {
          position: relative;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #10b981, #06b6d4);
          transform: scaleX(0);
          transition: transform 0.4s;
        }

        .card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);
        }

        .card:hover::before {
          transform: scaleX(1);
        }

        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .card h3 {
          color: #e2e8f0;
          margin-bottom: 1rem;
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .card p {
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .btn {
          position: relative;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-block;
          margin-top: 1.5rem;
          overflow: hidden;
          letter-spacing: 0.01em;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        .btn:hover::before {
          left: 100%;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin: 4rem 0;
          padding: 3rem 0;
        }

        .stat {
          text-align: center;
          padding: 2rem;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.4) 100%);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .stat:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.3);
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
        }

        .stat-number {
          font-size: 2.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .stat-label {
          color: #cbd5e1;
          font-size: 0.95rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-panel {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.7) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 24px;
          padding: 3rem;
          margin: 4rem auto;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .admin-panel h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #3b82f6;
          font-size: 2rem;
          font-weight: 700;
        }

        .admin-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .admin-link {
          background: rgba(51, 65, 85, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          text-decoration: none;
          color: #cbd5e1;
          transition: all 0.3s ease;
        }

        .admin-link:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }

        .admin-link h3 {
          color: #3b82f6;
          margin-bottom: 0.5rem;
        }

        .footer {
          background: rgba(15, 23, 42, 0.9);
          border-top: 1px solid #334155;
          padding: 2rem;
          text-align: center;
          color: #64748b;
          margin-top: 4rem;
        }

        @media (max-width: 768px) {
          .hero h1 { font-size: 2rem; }
          .container { padding: 1rem; }
          .cards { grid-template-columns: 1fr; }
          .stats { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <nav class="navbar">
        <div class="logo">AfiliadosBet</div>
        <ul class="nav-links">
          <li><a href="#inicio">Início</a></li>
          <li><a href="#admin">Admin</a></li>
          <li><a href="#postbacks">Postbacks</a></li>
          <li><a href="#stats">Estatísticas</a></li>
        </ul>
      </nav>

      <div class="container">
        <section class="hero">
          <h1>Sistema de Marketing de Afiliados</h1>
          <p>Conecte afiliados com as melhores casas de apostas do mercado</p>
          
          <div class="stats">
            <div class="stat">
              <span class="stat-number">150+</span>
              <span class="stat-label">Afiliados Ativos</span>
            </div>
            <div class="stat">
              <span class="stat-number">25</span>
              <span class="stat-label">Casas Parceiras</span>
            </div>
            <div class="stat">
              <span class="stat-number">R$ 2.5M</span>
              <span class="stat-label">Volume Mensal</span>
            </div>
            <div class="stat">
              <span class="stat-number">98%</span>
              <span class="stat-label">Satisfação</span>
            </div>
          </div>
        </section>

        <div class="cards">
          <div class="card">
            <div class="card-icon">👥</div>
            <h3>Gestão de Afiliados</h3>
            <p>Sistema completo para cadastro, acompanhamento e gerenciamento de afiliados. Controle total sobre performance e comissões em tempo real.</p>
            <a href="/api/users" class="btn">Ver Afiliados</a>
          </div>
          
          <div class="card">
            <div class="card-icon">🏢</div>
            <h3>Casas de Apostas</h3>
            <p>Configure casas parceiras com modelos de comissão flexíveis: CPA, RevShare ou Híbrido com valores específicos para cada tipo.</p>
            <a href="/api/betting-houses" class="btn">Ver Casas</a>
          </div>
          
          <div class="card">
            <div class="card-icon">🔄</div>
            <h3>Postbacks Avançados</h3>
            <p>Processamento inteligente de postbacks com suporte completo a registros, depósitos, profits e conversões automáticas.</p>
            <a href="http://localhost:5001" class="btn" target="_blank">Servidor Postbacks</a>
          </div>
          
          <div class="card">
            <div class="card-icon">💎</div>
            <h3>Comissões Híbridas</h3>
            <p>Modelo revolucionário que combina CPA e RevShare com valores independentes, maximizando o potencial de ganhos.</p>
            <a href="/api/stats/admin" class="btn">Ver Comissões</a>
          </div>
          
          <div class="card">
            <div class="card-icon">📊</div>
            <h3>Analytics Avançado</h3>
            <p>Dashboards interativos com métricas em tempo real, relatórios personalizados e insights de performance detalhados.</p>
            <a href="/api/stats/user" class="btn">Ver Relatórios</a>
          </div>
          
          <div class="card">
            <div class="card-icon">🚀</div>
            <h3>Links Inteligentes</h3>
            <p>Geração automática de links únicos com tracking avançado, pixel de conversão e análise completa de comportamento.</p>
            <a href="/api/affiliate-links" class="btn">Ver Links</a>
          </div>
        </div>

        <section class="admin-panel" id="admin">
          <h2>Painel Administrativo</h2>
          <div class="admin-links">
            <a href="/api/betting-houses" class="admin-link">
              <h3>🏢 Casas de Apostas</h3>
              <p>Gerenciar casas e modelos de comissão</p>
            </a>
            <a href="/api/users" class="admin-link">
              <h3>👥 Usuários</h3>
              <p>Administrar afiliados e permissões</p>
            </a>
            <a href="/api/stats/admin" class="admin-link">
              <h3>📊 Estatísticas</h3>
              <p>Relatórios e analytics do sistema</p>
            </a>
            <a href="/api/affiliate-links" class="admin-link">
              <h3>🔗 Links</h3>
              <p>Gestão de links de afiliados</p>
            </a>
          </div>
        </section>
      </div>

      <footer class="footer">
        <p>&copy; 2024 AfiliadosBet. Sistema desenvolvido para marketing de performance.</p>
        <p>API funcionando na porta 5000 | Postbacks na porta 5001 | Modelo híbrido ativo</p>
      </footer>

      <script>
        // Scroll navbar effect
        window.addEventListener('scroll', () => {
          const navbar = document.querySelector('.navbar');
          if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        });

        // Smooth entrance animations
        const observerOptions = {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }
          });
        }, observerOptions);

        // Animate cards on load
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(30px)';
          card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.transitionDelay = \`\${index * 100}ms\`;
          observer.observe(card);
        });

        // Animate stats
        const stats = document.querySelectorAll('.stat');
        stats.forEach((stat, index) => {
          stat.style.opacity = '0';
          stat.style.transform = 'translateY(20px)';
          stat.style.transition = 'all 0.5s ease';
          stat.style.transitionDelay = \`\${index * 150}ms\`;
          observer.observe(stat);
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
              target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          });
        });

        // Add floating particles animation
        function createParticle() {
          const particle = document.createElement('div');
          particle.style.position = 'fixed';
          particle.style.width = '2px';
          particle.style.height = '2px';
          particle.style.background = 'rgba(59, 130, 246, 0.6)';
          particle.style.borderRadius = '50%';
          particle.style.pointerEvents = 'none';
          particle.style.zIndex = '-1';
          
          const startX = Math.random() * window.innerWidth;
          const startY = window.innerHeight + 10;
          
          particle.style.left = startX + 'px';
          particle.style.top = startY + 'px';
          
          document.body.appendChild(particle);
          
          const duration = 8000 + Math.random() * 4000;
          const endY = -10;
          const drift = (Math.random() - 0.5) * 100;
          
          particle.animate([
            { 
              transform: \`translate(0, 0) scale(0)\`,
              opacity: 0
            },
            { 
              transform: \`translate(\${drift/2}px, -\${window.innerHeight/2}px) scale(1)\`,
              opacity: 1,
              offset: 0.1
            },
            { 
              transform: \`translate(\${drift}px, -\${window.innerHeight + 20}px) scale(0)\`,
              opacity: 0
            }
          ], {
            duration: duration,
            easing: 'linear'
          }).onfinish = () => {
            particle.remove();
          };
        }

        // Create particles periodically
        setInterval(createParticle, 800);
      </script>
    </body>
    </html>
  `);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  if (path.startsWith("/api/")) {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (body) {
      return originalSend.call(this, body);
    };

    res.json = function (body) {
      capturedJsonResponse = body;
      return originalJson.call(this, body);
    };
  }

  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    res.end = originalEnd;
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      const formattedJson = capturedJsonResponse
        ? `:: ${JSON.stringify(capturedJsonResponse).slice(0, 80)}...`
        : "";

      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms ${formattedJson}`);
    }

    return originalEnd.call(this, chunk, encoding);
  };
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  log(`Unhandled application error: ${err.message}`);
});

(async () => {
  try {
    console.log('starting up user application');
    const server = await registerRoutes(app);
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    console.log('Application ready to receive requests');
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
})();