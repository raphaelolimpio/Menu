import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsController {
public static async getDashboardMetrics(req: Request, res: Response) {
  try {
      const storeId = (req.query.storeId as string) || (req as any).user?.storeId;
      const { range } = req.query;

      const defaultMetrics = {
        totalRevenue: 0,
        totalOrdersCount: 0,
        productSales: [],
        regionSales: [],
        topCustomers: [],
        bottomCustomers: [],
      };

      if (!storeId) {
        return res.json(defaultMetrics);
      }

      const whereClause: any = { storeId }; 

      const now = new Date();
      if (range === 'today') {
        whereClause.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (range === '7days') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        whereClause.createdAt = { gte: past };
      } else if (range === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.createdAt = { gte: firstDay };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      if (!orders || orders.length === 0) {
        return res.json(defaultMetrics);
      }

      const totalRevenue = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
      const totalOrdersCount = orders.length;

      const productMap: Record<string, number> = {};
      orders.forEach((o) => {
        o.items.forEach((item) => {
          const prodName = item.product?.name || 'Item Removido';
          productMap[prodName] = (productMap[prodName] || 0) + Number(item.totalPrice || 0);
        });
      });

      const productSales = Object.entries(productMap).map(([name, revenue]) => ({ name, revenue }));

      const regionMap: Record<string, number> = {};
      orders.forEach((o) => {
        const region = o.customer?.responsibleArea || 'Geral';
        regionMap[region] = (regionMap[region] || 0) + Number(o.totalAmount || 0);
      });

      const regionSales = Object.entries(regionMap).map(([region, total]) => ({ region, total }));

      const customerMap: Record<string, number> = {};
      orders.forEach((o) => {
        const custName = o.customer?.name || 'Cliente';
        customerMap[custName] = (customerMap[custName] || 0) + Number(o.totalAmount || 0);
      });

      const sortedCustomers = Object.entries(customerMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

      return res.json({
        totalRevenue,
        totalOrdersCount,
        productSales,
        regionSales,
        topCustomers: sortedCustomers.slice(0, 5),
        bottomCustomers: [...sortedCustomers].reverse().slice(0, 5),
      });
    } catch (error: any) {
      console.error('Erro no cálculo de métricas:', error);
      return res.status(500).json({ error: error.message });
    }
  }


  public static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await prisma.order.update({
        where: { id: Number(id) },
        data: { status },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  public static async getProductionMetrics(req: Request, res: Response) {
    try {
      const storeId = (req.query.storeId as string) || (req as any).user?.storeId;
      const { range } = req.query;

      if (!storeId) {
        return res.status(400).json({ error: 'ID da loja obrigatório.' });
      }

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { operationalCostPerHour: true }
      });
      const costPerHour = store?.operationalCostPerHour || 0;

      const whereClause: any = {
        storeId,
        productionStartedAt: { not: null },
        productionFinishedAt: { not: null },
      };

      const now = new Date();
      if (range === 'today') {
        whereClause.productionFinishedAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (range === '7days') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        whereClause.productionFinishedAt = { gte: past };
      } else if (range === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.productionFinishedAt = { gte: firstDay };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          customer: { select: { name: true } },
          items: { include: { product: true } },
        },
        orderBy: { productionFinishedAt: 'asc' },
      });

      let totalEstimatedMin = 0;
      let totalActualMin = 0;
      let globalFinancialResult = 0;
      const ordersData: any[] = [];

      for (const o of orders) {
        let orderEstimatedMin = 0;

        for (const item of o.items) {
          orderEstimatedMin += (item.quantity * (item.product?.estimatedTimeMin || 0));
        }

        const timeWithMargin = orderEstimatedMin * 1.1;
        const actualMin = (o.productionFinishedAt!.getTime() - o.productionStartedAt!.getTime()) / 60000;

        totalEstimatedMin += timeWithMargin;
        totalActualMin += actualMin;

        const varianceHours = (timeWithMargin - actualMin) / 60;
        const orderFinancialResult = varianceHours * costPerHour;
        globalFinancialResult += orderFinancialResult;

        ordersData.push({
          id: o.id,
          orderCode: `PED-${o.id}`,
          customerName: o.customer?.name || 'Sem nome',
          estimatedMin: Math.round(timeWithMargin),
          actualMin: Math.round(actualMin),
          financialResult: orderFinancialResult, 
          finishedAt: o.productionFinishedAt
        });
      }

      return res.json({
        summary: {
          totalEstimatedMin: Math.round(totalEstimatedMin),
          totalActualMin: Math.round(totalActualMin),
          efficiencyPercent: totalEstimatedMin > 0 ? ((totalEstimatedMin / totalActualMin) * 100).toFixed(1) : 0,
          financialResult: globalFinancialResult,
          operationalCostPerHour: costPerHour
        },
        history: ordersData.reverse() 
      });

    } catch (error: any) {
      console.error('Erro no cálculo de produção:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}