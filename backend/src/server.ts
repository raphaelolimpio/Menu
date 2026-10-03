import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware CORS manual prioritário e universal
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

  // Se for a checagem preliminar (OPTIONS), encerra imediatamente com 200 OK
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/images', express.static(path.resolve(__dirname, '../uploads/images')));

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});