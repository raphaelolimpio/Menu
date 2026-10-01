import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PdfService } from '../services/pdf.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/:id/production-pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const ordersDir = path.resolve(__dirname, '../../uploads/orders');
    const filename = `producao_${order.id}.pdf`;
    const outputPath = path.resolve(ordersDir, filename);

    await PdfService.generateProductionPdf(order, outputPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const stream = fs.createReadStream(outputPath);
    return stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(__dirname, '../../uploads/orders', filename);

  console.log('Procurando arquivo PDF em:', filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo PDF não encontrado no disco.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const stream = fs.createReadStream(filePath);
  return stream.pipe(res);
});

router.get('/:id/producao', async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.query.storeId as string;

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'ID da ordem inválido.' });
    }

    const whereClause: any = {
      id: parsedId, 
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            responsibleArea: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Ordem não encontrada para esta loja.' });
    }

    return res.json(order);
  } catch (err: any) {
    console.error('Erro na rota /producao:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/etapa-producao', async (req, res) => {
  try {
    const { id } = req.params;
    const { productionStep, storeId } = req.body;

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'ID da ordem inválido.' });
    }

    const validSteps = ['CORTE', 'SOLDA', 'PINTURA', 'MONTAGEM', 'PRONTO_ENTREGA'];
    if (!validSteps.includes(productionStep)) {
      return res.status(400).json({ error: 'Etapa fabril inválida.' });
    }

    const whereClause: any = { id: parsedId };
    if (storeId) whereClause.storeId = storeId;

    const existingOrder = await prisma.order.findFirst({
      where: whereClause,
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Ordem não localizada para atualizar.' });
    }
    const updateData: any = {
      productionStep,
      status: 'IN_PRODUCTION',
    };

    if (!existingOrder.productionStartedAt) {
      updateData.productionStartedAt = new Date();
    }

    if (productionStep === 'PRONTO_ENTREGA' && !existingOrder.productionFinishedAt) {
      updateData.productionFinishedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData,
    });

    return res.json({ message: 'Etapa atualizada!', productionStep: updated.productionStep });
  } catch (err: any) {
    console.error('Erro ao atualizar etapa:', err);
    return res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/concluir-entrega', async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = Number(id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const existingOrder = await prisma.order.findUnique({
      where: { id: parsedId }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Ordem não localizada.' });
    }

    const updateData: any = {
      status: 'COMPLETED',
      productionStep: 'ENTREGUE',
    };

    if (!existingOrder.productionFinishedAt) {
      updateData.productionFinishedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: parsedId },
      data: updateData,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
router.get('/analytics/commissions', async (req, res) => {
  try {
    const storeId = req.query.storeId as string;
    const range = (req.query.range as string) || 'all';
    
    // Obtém o usuário autenticado (ou via query param se não usar middleware direto nesta rota)
    const requestingUserId = (req as any).user?.id || (req.query.userId as string);
    const requestingRole = (req as any).user?.role || (req.query.role as string);

    const whereClause: any = {
      status: { in: ['PAID', 'FINISHED', 'COMPLETED'] },
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    // 🔒 REGRA DE OURO DE SEGURANÇA:
    // Se for VENDEDOR, restringe estritamente aos pedidos DELE:
    if (requestingRole !== 'OWNER') {
      whereClause.sellerId = requestingUserId;
    } else {
      whereClause.sellerId = { not: null };
    }

    // Filtros de data (hoje, 7 dias, mês)
    const now = new Date();
    if (range === 'today') {
      whereClause.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (range === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      whereClause.createdAt = { gte: past7 };
    } else if (range === 'month') {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      whereClause.createdAt = { gte: startMonth };
    }

    const ordersWithSeller = await prisma.order.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            commissionPercent: true,
          },
        },
      },
    });

    // Agrupa métricas
    const sellersMap: Record<string, any> = {};
    let totalCommissionAccumulated = 0;
    let totalRevenueAccumulated = 0;

    for (const order of ordersWithSeller) {
      if (!order.seller) continue;

      const sId = order.seller.id;
      const comm = Number(order.sellerCommission) || 0;
      const rev = Number(order.totalAmount) || 0;

      totalCommissionAccumulated += comm;
      totalRevenueAccumulated += rev;

      if (!sellersMap[sId]) {
        sellersMap[sId] = {
          id: sId,
          name: order.seller.name,
          email: order.seller.email,
          commissionPercent: order.seller.commissionPercent || 0,
          ordersCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
        };
      }

      sellersMap[sId].ordersCount += 1;
      sellersMap[sId].totalRevenue += rev;
      sellersMap[sId].totalCommission += comm;
    }

    return res.json({
      role: requestingRole,
      summary: {
        totalCommission: totalCommissionAccumulated,
        totalRevenue: totalRevenueAccumulated,
        totalOrdersCount: ordersWithSeller.length,
      },
      sellers: Object.values(sellersMap),
    });
  } catch (err: any) {
    console.error('Erro ao buscar comissões:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/editar', async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discountAmount, totalAmount } = req.body;

    await prisma.orderItem.deleteMany({
      where: { orderId: Number(id) }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        discountAmount: Number(discountAmount),
        totalAmount: Number(totalAmount),
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.price,
            configuration: JSON.stringify(item.configuration)
          }))
        }
      }
    });

    return res.json(updatedOrder);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/:id/publico', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ error: "Ordem não encontrada" });
    return res.json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/aprovar-orcamento', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'PENDING' }
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/dashboard', AnalyticsController.getDashboardMetrics);
router.patch('/:id/status', AnalyticsController.updateOrderStatus);
router.get('/analytics/production', authMiddleware, AnalyticsController.getProductionMetrics);

router.post('/', OrderController.create);
router.get('/', OrderController.listAll);
router.get('/:id', OrderController.getById);




export default router;