import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TeamController {
  // Lista todos os vendedores vinculados à loja
  public static async listTeam(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const sellers = await prisma.user.findMany({
        where: { 
          storeId, 
          role: 'SELLER' 
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          commissionPercent: true,
          maxDiscountPercent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(sellers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Atualiza status (aprovação/rejeição), comissão e margem de desconto do vendedor
  public static async updateSellerPermissions(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { status, commissionPercent, maxDiscountPercent } = req.body;

      const updated = await prisma.user.update({
        where: { id: sellerId },
        data: {
          status: status || undefined,
          commissionPercent: commissionPercent !== undefined ? Number(commissionPercent) : undefined,
          maxDiscountPercent: maxDiscountPercent !== undefined ? Number(maxDiscountPercent) : undefined,
        },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}