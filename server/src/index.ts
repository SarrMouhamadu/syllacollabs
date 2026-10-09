import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import collaborationRoutes from './routes/collaboration.routes.js';
import adminRoutes from './routes/admin.routes.js';
import audioRoutes from './routes/audio.routes.js';
import { prisma } from './prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    // Vérification de la connexion PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'Sylla Collaborations API',
      database: 'PostgreSQL Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'Sylla Collaborations API',
      database: 'PostgreSQL Connection Failed',
      error: error instanceof Error ? error.message : 'Unknown DB error',
    });
  }
});

// Enregistrement des routes API
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audio', audioRoutes);

// Service des fichiers statiques du frontend client en production
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const localClientDistPath = path.resolve(process.cwd(), 'client/dist');
const staticPath = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(localClientDistPath)
  ? localClientDistPath
  : null;

if (staticPath) {
  app.use(express.static(staticPath));
}

// Gestion des routes non trouvées et SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      error: 'Route non trouvée sur le serveur Sylla Collaborations API.',
    });
    return;
  }
  if (staticPath) {
    res.sendFile(path.join(staticPath, 'index.html'));
    return;
  }
  res.status(404).send('Page non trouvée');
});

// Middleware d'erreurs global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur API non gérée :', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Une erreur interne inattendue est survenue.',
  });
});

// Initialisation de l'administrateur système si aucun compte n'existe
async function ensureAdminExists() {
  try {
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@sylla.com';
      const password = process.env.ADMIN_PASSWORD || 'admin_sylla_2026';
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await prisma.adminUser.create({
        data: {
          email,
          passwordHash,
          fullName: 'Direction Sylla',
          role: 'ADMIN',
        },
      });
      console.log(`✅ Administrateur initial configuré avec succès : ${email}`);
    }
  } catch (adminErr) {
    console.warn('Vérification du compte administrateur :', adminErr);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur Sylla Collaborations démarré avec succès sur le port ${PORT}`);
  console.log(`📡 URL API : http://localhost:${PORT}/api`);
  ensureAdminExists();
});

export default app;
