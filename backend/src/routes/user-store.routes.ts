import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ROTA NOVA: Retorna os dados atualizados do usuário (incluindo avatarUrl recente)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        storeId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

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