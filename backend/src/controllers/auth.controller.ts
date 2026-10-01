import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MailService } from '../services/mail.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_jwt_para_tokens';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, password, accountType, storeName, storeCode } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (accountType === 'OWNER') {
        if (!storeName) {
          return res.status(400).json({ error: 'Nome da loja é obrigatório para o proprietário.' });
        }

        const generatedCode = `LOJA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const createdStore = await prisma.store.create({
          data: {
            name: storeName,
            code: generatedCode,
            ownerId: 'temp',
          },
        });

        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'OWNER',
            status: 'ACTIVE',
            storeId: createdStore.id,
          },
        });

        await prisma.store.update({
          where: { id: createdStore.id },
          data: { ownerId: user.id },
        });

        const token = jwt.sign(
          { id: user.id, role: user.role, storeId: createdStore.id },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
          store: { id: createdStore.id, name: createdStore.name, code: createdStore.code },
          token,
        });
      } else {
        if (!storeCode) {
          return res.status(400).json({ error: 'Código da loja é obrigatório para vendedor.' });
        }

        const store = await prisma.store.findUnique({
          where: { code: storeCode.trim().toUpperCase() },
        });

        if (!store) {
          return res.status(404).json({ error: 'Código de loja inválido ou não localizado.' });
        }

        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'SELLER',
            status: 'PENDING_APPROVAL',
            storeId: store.id,
            commissionPercent: 0.0,
            maxDiscountPercent: 0.0,
          },
        });

        return res.status(201).json({
          message: 'Cadastro recebido! Aguarde a aprovação do proprietário da loja para fazer login.',
          status: user.status,
        });
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  public static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'O e-mail é obrigatório.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return res.json({ message: 'Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hora

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires },
      });

      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

      await MailService.sendPasswordResetEmail({
        to: user.email,
        resetLink,
      });

      return res.json({ message: 'E-mail de recuperação enviado com sucesso!' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetExpires: { gte: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({ error: 'Token inválido ou expirado.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetExpires: null,
        },
      });

      return res.json({ message: 'Senha alterada com sucesso! Você já pode fazer login.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { store: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (user.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          error: 'Sua conta ainda está aguardando aprovação pelo proprietário da loja.',
          status: 'PENDING_APPROVAL',
        });
      }

      if (user.status === 'REJECTED') {
        return res.status(403).json({ error: 'O acesso a esta loja foi recusado pelo proprietário.' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, storeId: user.storeId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          commissionPercent: user.commissionPercent,
          maxDiscountPercent: user.maxDiscountPercent,
        },
        store: user.store,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}