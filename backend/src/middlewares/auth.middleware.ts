import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_jwt_para_tokens';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'OWNER' | 'SELLER';
    storeId: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const [, token] = authHeader.split(' ');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      storeId: decoded.storeId,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expirado ou inválido.' });
  }
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'OWNER') {
    return res.status(403).json({ error: 'Acesso restrito ao proprietário da loja.' });
  }
  return next();
}