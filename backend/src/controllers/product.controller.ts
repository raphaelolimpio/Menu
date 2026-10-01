import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseJsonField = (field: any) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch {
    return String(field)
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

export class ProductController {
  public static async create(req: Request, res: Response) {
    try {

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'O arquivo 3D (.glb, .gltf ou .obj) é obrigatório.' });
      }

      const {
        name,
        sku,
        description,
        basePrice,
        customizableParts,
        availableColors,
        discountRules,
        thumbnailUrl,
        storeId, 
      } = req.body;

      const targetStoreId = storeId || (req as any).user?.storeId;

      if (!targetStoreId) {
        return res.status(400).json({ error: 'ID da loja não informado para vincular o produto.' });
      }

      const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3333';
      const model3dUrl = `${appBaseUrl}/uploads/models3d/${file.filename}`;

      const parsedParts = parseJsonField(customizableParts);
      const parsedColors = parseJsonField(availableColors);
      const parsedDiscounts = parseJsonField(discountRules);

      const product = await ProductService.create({
        name,
        sku,
        description,
        basePrice: Number(basePrice),
        model3dUrl,
        customizableParts: parsedParts,
        availableColors: parsedColors,
        discountRules: parsedDiscounts,
        thumbnailUrl,
        storeId: targetStoreId, 
      });

      return res.status(201).json(product);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  public static async list(req: Request, res: Response) {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) {
        return res.json([]);
      }
      const products = await prisma.product.findMany({
        where: { storeId: storeId },
      });
      return res.json(products);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.findById(id);
      return res.json(product);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, sku, description, basePrice, customizableParts, discountRules, thumbnailUrl } = req.body;
      const file = req.file;

      const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3333';
      const model3dUrl = file ? `${appBaseUrl}/uploads/models3d/${file.filename}` : undefined;

      const updateData: any = {
        name,
        sku,
        description,
        basePrice: basePrice ? Number(basePrice) : undefined,
        model3dUrl,
        thumbnailUrl,
      };

      if (customizableParts) {
        updateData.customizableParts = parseJsonField(customizableParts);
      }
      if (discountRules) {
        updateData.discountRules = parseJsonField(discountRules);
      }

      const updated = await ProductService.update(id, updateData);
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ProductService.delete(id);
      return res.json({ message: 'Produto removido com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  // Aliases para garantir retrocompatibilidade com rotas que chamam getAll ou listAll
  public static getAll = ProductController.list;
  public static listAll = ProductController.list;
}