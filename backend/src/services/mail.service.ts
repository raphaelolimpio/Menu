import nodemailer from 'nodemailer';

export class MailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'demo@ethereal.email',
      pass: process.env.SMTP_PASS || 'secret',
    },
  });

  // 1. Envio de Documentos (Dinâmico por Loja)
  public static async sendOrderDocuments(params: {
    to: string;
    orderNumber: number;
    pdfPath: string;
    receiptPath?: string;
    storeName?: string;
    storeEmail?: string;
  }) {
    const attachments = [{ filename: `pedido_${params.orderNumber}.pdf`, path: params.pdfPath }];

    if (params.receiptPath) {
      attachments.push({ filename: `comprovante_${params.orderNumber}.pdf`, path: params.receiptPath });
    }

    // Usa o nome e e-mail da loja remetente, ou fallback para a plataforma central
    const senderName = params.storeName || 'Catálogo Industrial 3D';
    const senderEmail = params.storeEmail || 'vendas@catalogo3d.com.br';

    try {
      await this.transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: params.to,
        bcc: senderEmail, // Cópia vai para a loja dona do pedido
        subject: `Documentos do Pedido #${params.orderNumber} - ${senderName}`,
        text: `Olá! Seu pedido #${params.orderNumber} na ${senderName} foi processado. Seguem em anexo os documentos gerados.`,
        attachments,
      });
      console.log(`E-mail de comprovante da loja ${senderName} enviado para: ${params.to}`);
    } catch (error) {
      console.error('Falha no envio de e-mail de pedido:', error);
    }
  }

  // 2. Recuperação de Senha (Sempre da Plataforma Central)
  public static async sendPasswordResetEmail(params: { to: string; resetLink: string }) {
    try {
      await this.transporter.sendMail({
        from: '"Suporte Catálogo 3D" <suporte@catalogo3d.com.br>',
        to: params.to,
        subject: 'Recuperação de Senha - Catálogo 3D',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Redefinição de Senha</h2>
            <p>Você solicitou a recuperação de senha da sua conta na plataforma central do Catálogo 3D.</p>
            <p>Clique no botão abaixo para definir uma nova senha (válido por 1 hora):</p>
            <a href="${params.resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px; font-weight: bold;">Redefinir Senha</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
          </div>
        `,
      });
      console.log(`E-mail de recuperação central enviado para: ${params.to}`);
    } catch (error) {
      console.error('Falha ao enviar e-mail de recuperação:', error);
      throw new Error('Não foi possível enviar o e-mail de recuperação.');
    }
  }
}