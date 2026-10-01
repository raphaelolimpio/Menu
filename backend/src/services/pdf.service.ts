import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import  QRCode  from 'qrcode';

export interface OrderPDFData {
  orderNumber: number;
  date: Date;
  customer: {
    name: string;
    document?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    responsibleArea?: string | null;
  };
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    configuration: Record<string, string>;
  }>;
  totalAmount: number;
  paymentMethod: string;
  pixQrCodeBuffer?: Buffer;
  pixCopiaECola?: string;
}

export class PdfService {
  public static async generateOrderPdf(data: OrderPDFData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 1. Garante que o diretório de destino existe antes de criar o stream
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const writeStream = fs.createWriteStream(outputPath);

      // Tratamento de erros do stream e do documento
      doc.on('error', (err) => reject(err));
      writeStream.on('error', (err) => reject(err));
      writeStream.on('finish', () => resolve(outputPath));

      doc.pipe(writeStream);

      const year = data.date.getFullYear();
      const code = `PED-${year}-${String(data.orderNumber).padStart(4, '0')}`;

      // 1. Cabeçalho Corporativo
      doc.rect(36, 36, 523, 50).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('COMPROVANTE DE PEDIDO & ESPECIFICAÇÃO TÉCNICA', 50, 48);
      doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text(
        `IDENTIFICADOR: ${code}  |  EMISSÃO: ${data.date.toLocaleDateString('pt-BR')} ${data.date.toLocaleTimeString('pt-BR')}`,
        50,
        66
      );

      // 2. Painéis Lado a Lado (Cliente x Condições de Pagamento)
      const panelY = 96;
      doc.rect(36, panelY, 255, 75).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.rect(304, panelY, 255, 75).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

      // Painel Cliente
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('DADOS DO CLIENTE', 46, panelY + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      doc.text(`Razão / Nome: ${data.customer.name}`, 46, panelY + 22, { width: 235, ellipsis: true });
      doc.text(`Setor / Região: ${data.customer.responsibleArea || 'Não especificado'}`, 46, panelY + 34);
      doc.text(`Contato: ${data.customer.phone || 'Sem tel'} | ${data.customer.email}`, 46, panelY + 46, { width: 235, ellipsis: true });
      doc.text(`Endereço: ${data.customer.address || 'Balcão / A retirar'}`, 46, panelY + 58, { width: 235, ellipsis: true });

      // Painel Transacional
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('DETALHES DA TRANSAÇÃO', 314, panelY + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      doc.text(`Forma de Pagamento: ${data.paymentMethod}`, 314, panelY + 22);
      doc.text(`Situação: Liquidado / Confirmado`, 314, panelY + 34);
      doc.text(`Total de Itens: ${data.items.reduce((acc, i) => acc + i.quantity, 0)} unidades`, 314, panelY + 46);
      doc.font('Helvetica-Bold').fillColor('#059669').fontSize(10).text(`VALOR TOTAL: R$ ${data.totalAmount.toFixed(2)}`, 314, panelY + 58);

      // 3. Tabela de Produtos e Especificações 3D
      let currentY = 185;
      doc.rect(36, currentY, 523, 20).fill('#F1F5F9');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8);
      doc.text('ITEM / ESPECIFICAÇÃO DE CORES 3D', 46, currentY + 6);
      doc.text('QTD', 380, currentY + 6, { width: 35, align: 'center' });
      doc.text('UNITÁRIO', 425, currentY + 6, { width: 60, align: 'right' });
      doc.text('TOTAL', 490, currentY + 6, { width: 60, align: 'right' });

      currentY += 25;

      data.items.forEach((item, index) => {
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5);
        doc.text(`${index + 1}. ${item.productName} (SKU: ${item.sku})`, 46, currentY);

        doc.font('Helvetica').fontSize(8.5).fillColor('#1E293B');
        doc.text(`${item.quantity}`, 380, currentY, { width: 35, align: 'center' });
        doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 425, currentY, { width: 60, align: 'right' });
        doc.text(`R$ ${item.totalPrice.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });

        // Desenho dos Swatches com as cores de cada grupo configurado
        let swatchX = 52;
        let swatchY = currentY + 14;

        const rawConfig = item.configuration || {};
        const configEntries = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;

        const cleanConfig = Object.entries(configEntries).filter(
          ([key]) => key !== '[object Object]' && !key.toLowerCase().startsWith('body')
        );

        cleanConfig.forEach(([groupName, colorVal]: [string, any]) => {
          // Sanitiza o código hexadecimal para não provocar falha no fill
          const validHex = (typeof colorVal === 'string' && colorVal.startsWith('#')) ? colorVal : '#64748B';

          doc.rect(swatchX, swatchY, 8, 8).fillAndStroke(validHex, '#94A3B8');
          doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
            .text(`${groupName}: ${colorVal}`, swatchX + 12, swatchY + 1);
          swatchX += 115;
        });

        currentY = swatchY + 18;
        doc.moveTo(36, currentY).lineTo(559, currentY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        currentY += 8;
      });

      // 4. Seção PIX e Autenticação
      if (data.paymentMethod === 'PIX' && data.pixQrCodeBuffer) {
        const qrBoxY = Math.max(currentY + 10, 650);
        doc.rect(36, qrBoxY, 523, 115).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

        try {
          doc.image(data.pixQrCodeBuffer, 46, qrBoxY + 8, { width: 95 });
        } catch (imgErr) {
          console.warn('QR Code não pôde ser renderizado no PDF:', imgErr);
        }

        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text('PAGAMENTO DIGITAL INSTANTÂNEO (PIX)', 155, qrBoxY + 12);
        doc.font('Helvetica').fontSize(8).fillColor('#64748B')
          .text('Aponte o leitor de QR Code do seu aplicativo bancário ou utilize a chave Copia e Cola:', 155, qrBoxY + 26);

        doc.rect(155, qrBoxY + 40, 390, 45).fill('#F8FAFC');
        doc.font('Courier').fontSize(7).fillColor('#0F172A')
          .text(data.pixCopiaECola || '', 162, qrBoxY + 46, { width: 375, height: 35 });

        doc.font('Helvetica').fontSize(7).fillColor('#10B981').text('✓ Autenticação transacional registrada', 155, qrBoxY + 95);
      }

      // Rodapé
      doc.fontSize(7).font('Helvetica').fillColor('#94A3B8').text(
        'Documento gerado eletronicamente pela Plataforma de Catálogo 3D B2B. Válido como espelho e comprovante do pedido.',
        36,
        790,
        { align: 'center', width: 523 }
      );

      doc.end();
    });
  }
  public static async generateProductionPdf(order: any, outputPath: string): Promise<string> {
    const appWebUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const productionLink = `${appWebUrl}/producao/${order.id}?storeId=${order.storeId}`;

    const qrBuffer = await QRCode.toBuffer(productionLink, {  width: 90, margin: 1});

    return new Promise((resolve, reject) => {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const writeStream = fs.createWriteStream(outputPath);

      doc.on('error', (err) => reject(err));
      writeStream.on('error', (err) => reject(err));
      writeStream.on('finish', () => resolve(outputPath));

      doc.pipe(writeStream);

      const orderCode = `PROD-${new Date(order.createdAt).getFullYear()}-${String(order.id).replace(/\D/g, '').slice(0, 4) || '0001'}`;

      // 1. Cabeçalho de Fábrica / Produção
      doc.rect(36, 36, 523, 45).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold').text('ORDEM DE PRODUÇÃO & FICHA TÉCNICA INDUSTRIAL', 50, 48);
      doc.fontSize(8.5).font('Helvetica').fillColor('#94A3B8').text(
        `LOTE / CÓDIGO: ${orderCode}  |  EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
        50,
        64
      );
      doc.image(qrBuffer, 465, 40, { width: 50 });
      doc.fontSize(6).fillColor('#64748B').text('Aponte para atualizar status', 450, 93, { width: 80, align: 'center' });

      // 2. Painel de Identificação & Destino
      const topY = 90;
      doc.rect(36, topY, 523, 40).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('DADOS DA EXPEDIÇÃO & DESTINO', 46, topY + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      doc.text(`Cliente: ${order.customer?.name || 'Cliente'}  |  Setor/Local: ${order.customer?.responsibleArea || 'Geral'}`, 46, topY + 22);

      // 3. Tabela de Montagem e Especificações 3D
      let currentY = 140;
      doc.rect(36, currentY, 523, 18).fill('#F1F5F9');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
      doc.text('ITEM / MODELO', 46, currentY + 5);
      doc.text('QUANTIDADE', 350, currentY + 5, { width: 70, align: 'center' });
      doc.text('CHECK PRODUÇÃO', 440, currentY + 5, { width: 105, align: 'center' });

      currentY += 24;

      order.items.forEach((item: any, idx: number) => {
        const prodName = item.product?.name || item.productName || 'Item';
        const sku = item.product?.sku || item.sku || 'N/A';

        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
        doc.text(`${idx + 1}. ${prodName} (SKU: ${sku})`, 46, currentY);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B');
        doc.text(`${item.quantity} un`, 350, currentY, { width: 70, align: 'center' });

        // Caixa de checkbox para o operador de fábrica
        doc.rect(480, currentY, 12, 12).lineWidth(0.8).strokeColor('#475569').stroke();

        // Especificação das Cores e Peças 3D
        let swatchX = 52;
        let swatchY = currentY + 14;

        let rawConfig = item.configuration || {};
        if (typeof rawConfig === 'string') {
          try {
            rawConfig = JSON.parse(rawConfig);
          } catch {
            rawConfig = {};
          }
        }

        const validEntries = Object.entries(rawConfig).filter(
          ([k]) => k !== '[object Object]' && !k.toLowerCase().startsWith('body')
        );

        validEntries.forEach(([group, colorVal]: [string, any]) => {
          const hex = typeof colorVal === 'string' && colorVal.startsWith('#') ? colorVal : '#64748B';
          doc.rect(swatchX, swatchY, 8, 8).fillAndStroke(hex, '#94A3B8');
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
            .text(`${group}: ${colorVal}`, swatchX + 12, swatchY + 1);
          swatchX += 115;
        });

        currentY = swatchY + 20;
        doc.moveTo(36, currentY).lineTo(559, currentY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        currentY += 10;
      });

      // 4. Seção de Assinaturas e Controle de Qualidade
      const signY = 700;
      doc.rect(36, signY, 523, 75).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('CONTROLE DE QUALIDADE & EXPEDIÇÃO DE FÁBRICA', 46, signY + 8);

      doc.moveTo(50, signY + 50).lineTo(190, signY + 50).strokeColor('#94A3B8').lineWidth(0.5).stroke();
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('Operador Responsável', 50, signY + 54, { width: 140, align: 'center' });

      doc.moveTo(225, signY + 50).lineTo(365, signY + 50).strokeColor('#94A3B8').lineWidth(0.5).stroke();
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('Conferência / CQ', 225, signY + 54, { width: 140, align: 'center' });

      doc.moveTo(400, signY + 50).lineTo(540, signY + 50).strokeColor('#94A3B8').lineWidth(0.5).stroke();
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('Data de Finalização: ___/___/______', 400, signY + 54, { width: 140, align: 'center' });

      doc.end();
    });
  }
}
