import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3333;

// Configuração de CORS compatível com credenciais e múltiplos domínios da Vercel
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (mobile, Postman) ou de domínios Vercel e localhost
      if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, true); // Deixa passar qualquer origem refletindo o header correto
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Trata explicitamente o preflight para todas as rotas
app.options('*', cors());

app.use(express.json());

const modelsDir = path.resolve(__dirname, '../uploads/models3d');
const ordersDir = path.resolve(__dirname, '../uploads/orders');

if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });

app.use('/uploads/models3d', express.static(modelsDir));
app.use('/uploads/orders', express.static(ordersDir));
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/images', express.static(path.resolve(__dirname, '../uploads/images')));

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📦 Modelos 3D em: http://localhost:${PORT}/uploads/models3d/`);
});