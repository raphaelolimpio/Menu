import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { PrismaClient } from '@prisma/client';
import { MailService } from '../services/mail.service';
import path from 'path';

const prisma = new PrismaClient();

export class OrderController {
  public static async create(req: Request, res: Response) {
    try {
      const { customerId, storeId, sellerId, appliedDiscount, paymentMethod, items } = req.body;
      const targetStoreId = storeId || (req as any).user?.storeId;

      const order = await OrderService.createOrder({
        customerId,
        storeId: targetStoreId,
        sellerId,
        appliedDiscount: Number(appliedDiscount) || 0,
        paymentMethod,
        items,
      });

      // Busca o cliente e a loja em paralelo para pegar os e-mails corretos
      const [customer, store] = await Promise.all([
        prisma.customer.findUnique({ where: { id: customerId } }),
        prisma.store.findUnique({ where: { id: targetStoreId } })
      ]);

      if (customer && customer.email) {
        const pdfPath = path.resolve(__dirname, `../../uploads/orders/producao_${order.id}.pdf`);
        
        await MailService.sendOrderDocuments({
          to: customer.email,
          orderNumber: order.id,
          pdfPath: pdfPath,
          storeName: store?.name,
          storeEmail: store?.email || undefined, 
        });
      }

      return res.status(201).json(order);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async listAll(req: Request, res: Response) {
    try {
      const storeId = (req.query.storeId as string) || (req as any).user?.storeId;

      if (!storeId) {
        return res.json([]);
      }

      const orders = await prisma.order.findMany({
        where: { storeId },
        include: {
          customer: true,
          items: { include: { product: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      return res.json(order);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}