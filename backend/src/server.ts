import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3333;

app.set('trust proxy', 1);

// Middleware manual prioritário para garantir CORS e OPTIONS em 100% das rotas
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Se for requisição de preflight, responde na hora sem passar para as rotas
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

const modelsDir = path.resolve(__dirname, '../uploads/models3d');
const ordersDir = path.resolve(__dirname, '../uploads/orders');

if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });

app.use('/uploads/models3d', express.static(modelsDir));
app.use('/uploads/orders', express.static(ordersDir));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/images', express.static(path.resolve(__dirname, '../uploads/images')));

// Rotas de autenticação sob /api/auth
app.use('/api/auth', authRoutes);

// Rotas gerais sob /api
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});