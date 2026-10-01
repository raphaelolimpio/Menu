import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface CreateProductDTO {
  name: string;
  sku: string;
  description?: string;
  basePrice: number;
  model3dUrl: string;
  thumbnailUrl?: string;
  customizableParts: any;
  availableColors: any;
  discountRules?: any;
  storeId: string; // <-- Obriga o vínculo do produto com a loja
}

export class ProductService {
  public static async create(data: CreateProductDTO) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new Error(`SKU ${data.sku} já cadastrado.`);
    }

    const customizablePartsStr =
      typeof data.customizableParts === 'string'
        ? data.customizableParts
        : JSON.stringify(data.customizableParts);

    const availableColorsStr =
      typeof data.availableColors === 'string'
        ? data.availableColors
        : JSON.stringify(data.availableColors);

    const discountRulesStr =
      typeof data.discountRules === 'string'
        ? data.discountRules
        : JSON.stringify(data.discountRules || []);

    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        basePrice: data.basePrice,
        model3dUrl: data.model3dUrl,
        thumbnailUrl: data.thumbnailUrl,
        customizableParts: customizablePartsStr,
        availableColors: availableColorsStr,
        discountRules: discountRulesStr,
        storeId: data.storeId, // <-- Salva a loja proprietária do produto
      },
    });
  }

  // Método chamado pelo ProductController para listar por loja
  public static async list(storeId?: string) {
    return prisma.product.findMany({
      where: storeId ? { storeId } : undefined, // <-- Filtra os produtos apenas da loja indicada
      orderBy: { createdAt: 'desc' },
    });
  }

  // Mantido para compatibilidade retroativa
  public static async listAll(storeId?: string) {
    return this.list(storeId);
  }

  public static async findById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Produto não encontrado.');
    return product;
  }

  public static async update(id: string, data: Partial<CreateProductDTO>) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Produto não encontrado.');

    const customizablePartsStr =
      data.customizableParts !== undefined
        ? typeof data.customizableParts === 'string'
          ? data.customizableParts
          : JSON.stringify(data.customizableParts)
        : undefined;

    const availableColorsStr =
      data.availableColors !== undefined
        ? typeof data.availableColors === 'string'
          ? data.availableColors
          : JSON.stringify(data.availableColors)
        : undefined;

    const discountRulesStr =
      data.discountRules !== undefined
        ? typeof data.discountRules === 'string'
          ? data.discountRules
          : JSON.stringify(data.discountRules)
        : undefined;

    return prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        basePrice: data.basePrice !== undefined ? Number(data.basePrice) : undefined,
        model3dUrl: data.model3dUrl,
        thumbnailUrl: data.thumbnailUrl,
        customizableParts: customizablePartsStr,
        availableColors: availableColorsStr,
        discountRules: discountRulesStr,
        storeId: data.storeId,
      },
    });
  }

  public static async delete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Produto não encontrado.');

    // 1. Remove dependências de itens de pedidos vinculados a esse produto
    await prisma.orderItem.deleteMany({
      where: { productId: id },
    });

    // 2. Remove o arquivo 3D físico caso ele exista no disco
    const filename = product.model3dUrl.split('/').pop();
    if (filename) {
      const filePath = path.resolve(__dirname, '../../uploads/models3d', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Arquivo já removido ou inacessível:', filePath);
        }
      }
    }

    // 3. Remove o registro do banco
    return prisma.product.delete({ where: { id } });
  }
}