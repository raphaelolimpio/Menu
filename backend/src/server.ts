import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3333;

app.set('trust proxy', 1);

// Middleware manual estrito de CORS aplicado a todas as rotas
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Max-Age', '86400');

  // Trata o preflight OPTIONS garantindo a entrega dos headers e status 204
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
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