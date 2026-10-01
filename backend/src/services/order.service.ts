import { PrismaClient } from '@prisma/client';
import { PdfService } from './pdf.service';
import { PixService } from './pix.service';
import { MailService } from './mail.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
  configuration: Record<string, string>;
}

export interface CreateOrderDTO {
  customerId: string;
  storeId?: string;
  sellerId?: string;
  appliedDiscount?: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentMethod?: string;
  status?: string;
  items: CreateOrderItemDTO[];
}

export class OrderService {
  public static async createOrder(data: CreateOrderDTO) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) throw new Error('Cliente não encontrado.');

    let sellerCommission = 0;
    const discountPercent = Math.max(0, Number(data.appliedDiscount || 0));

    if (data.sellerId) {
      const seller = await prisma.user.findUnique({
        where: { id: data.sellerId },
      });

      if (!seller) {
        throw new Error('Vendedor responsável não encontrado.');
      }

      if (seller.status !== 'ACTIVE') {
        throw new Error('Este vendedor ainda não foi aprovado pelo proprietário da loja.');
      }

      if (seller.role === 'SELLER' && discountPercent > (seller.maxDiscountPercent || 0)) {
        throw new Error(
          `Desconto de ${discountPercent}% excede o limite máximo permitido para você (${seller.maxDiscountPercent}%).`
        );
      }
    }

    let subtotal = 0;
    const itemsData = [];
    let detectedStoreId = data.storeId;

    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Produto ${item.productId} não encontrado.`);

      if (!detectedStoreId && product.storeId) {
        detectedStoreId = product.storeId;
      }

      const unitPrice = Number(product.basePrice);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      itemsData.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        configuration: item.configuration || {},
      });
    }

    if (!detectedStoreId) {
      throw new Error('Loja não identificada para este pedido.');
    }

    const calculatedDiscountAmount = data.discountAmount !== undefined
      ? Number(data.discountAmount)
      : subtotal * (discountPercent / 100);

    const finalPaidAmount = data.finalAmount !== undefined
      ? Number(data.finalAmount)
      : Math.max(0, subtotal - calculatedDiscountAmount);

    if (data.sellerId) {
      const seller = await prisma.user.findUnique({ where: { id: data.sellerId } });
      if (seller && (seller.commissionPercent || 0) > 0) {
        sellerCommission = finalPaidAmount * (seller.commissionPercent / 100);
      }
    }

    const paymentMethod = data.paymentMethod || 'PIX';
    const initialStatus = data.status || (paymentMethod === 'PIX' ? 'PAID' : 'QUOTE');

    const createdOrder = await prisma.order.create({
      data: {
        customerId: customer.id,
        storeId: detectedStoreId as string,
        sellerId: data.sellerId || null,


        totalAmount: subtotal,
        discountAmount: calculatedDiscountAmount,
        finalAmount: finalPaidAmount,

        sellerCommission,
        paymentMethod,
        status: initialStatus,
        items: {
          create: itemsData.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            configuration: JSON.stringify(i.configuration),
          })),
        },
      },
      include: {
        items: true,
        seller: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let pixQrBuffer: Buffer | undefined;
    let pixPayload: string | undefined;

    if (paymentMethod === 'PIX') {
      try {
        pixPayload = PixService.generatePayload(
          'contato@suaempresa.com.br',
          'EMPRESA INDUSTRIAL',
          'PALMAS',
          finalPaidAmount,
          `PED${createdOrder.id}`
        );
        pixQrBuffer = await PixService.generateQrCodeBuffer(pixPayload);
      } catch (pixErr) {
        console.warn('⚠️ Falha ao gerar QR Code PIX:', pixErr);
      }
    }

    const ordersDir = path.resolve(__dirname, '../../uploads/orders');
    if (!fs.existsSync(ordersDir)) {
      fs.mkdirSync(ordersDir, { recursive: true });
    }

    const pdfFilename = `pedido_${createdOrder.id}_${Date.now()}.pdf`;
    const pdfPath = path.resolve(ordersDir, pdfFilename);

    const parsedOrderNumber = typeof createdOrder.id === 'number'
      ? createdOrder.id
      : parseInt(String(createdOrder.id).replace(/\D/g, '').slice(0, 4) || '1', 10);

    try {
      await PdfService.generateOrderPdf(
        {
          orderNumber: parsedOrderNumber,
          date: createdOrder.createdAt,
          customer: {
            name: customer.name,
            document: customer.document,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            responsibleArea: customer.responsibleArea,
          },
          items: itemsData,
          totalAmount: finalPaidAmount,
          paymentMethod,
          pixQrCodeBuffer: pixQrBuffer,
          pixCopiaECola: pixPayload,
        },
        pdfPath
      );
    } catch (pdfErr) {
      console.error('Erro na geração do arquivo PDF:', pdfErr);
    }

    const relativePdfUrl = `/orders/download/${pdfFilename}`;

    const updatedOrder = await prisma.order.update({
      where: { id: createdOrder.id },
      data: {
        pdfUrl: relativePdfUrl,
        receiptPdfUrl: paymentMethod === 'PIX' ? relativePdfUrl : null,
      },
      include: {
        customer: true,
        seller: true,
        items: true,
      },
    });

    try {
      await MailService.sendOrderDocuments({
        to: customer.email,
        orderNumber: parsedOrderNumber,
        pdfPath,
      });
    } catch (mailError) {
      console.warn(' E-mail não disparado (SMTP não autenticado):', (mailError as any)?.message);
    }

    return {
      ...updatedOrder,
      pixPayload,
    };
  }
}