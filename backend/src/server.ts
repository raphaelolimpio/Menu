import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3333;

app.set('trust proxy', 1);

// CORS MANUAL DEFINITIVO (Blindado contra proxies do Railway)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // CRÍTICO: Responder com 200 OK e um pequeno corpo de texto.
  // Isto força o proxy do Railway a manter os cabeçalhos intactos.
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
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

app.use('/api/auth', authRoutes);
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend a correr na porta ${PORT}`);
});