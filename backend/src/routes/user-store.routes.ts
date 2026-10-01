import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.patch('/users/:id', async (req, res) => {
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
});

router.patch('/stores/:id', async (req, res) => {
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
});

export default router;