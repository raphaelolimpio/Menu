import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomerController {
  public static async list(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const customers = await prisma.customer.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: String(search) } },
                { email: { contains: String(search) } },
                { responsibleArea: { contains: String(search) } },
              ],
            }
          : undefined,
        orderBy: { name: 'asc' },
      });
      return res.json(customers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  public static async updateStore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, logoUrl, themeColor, phone, greeting } = req.body;

    const updated = await prisma.store.update({
      where: { id },
      data: { name, logoUrl, themeColor, phone, greeting },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

  // No user/store controller ou auth controller
public static async updateUserAvatar(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

  public static async create(req: Request, res: Response) {
    try {
      const { name, responsibleArea, phone, email, address, document } = req.body;
      const customer = await prisma.customer.create({
        data: { name, responsibleArea, phone, email, address, document },
      });
      return res.status(201).json(customer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, responsibleArea, phone, email, address, document } = req.body;
      const customer = await prisma.customer.update({
        where: { id },
        data: { name, responsibleArea, phone, email, address, document },
      });
      return res.json(customer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}