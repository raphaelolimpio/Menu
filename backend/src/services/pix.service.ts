import QRCode from 'qrcode';

export class PixService {
  private static formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private static calculateCRC16(payload: string): string {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc = crc & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  public static generatePayload(key: string, name: string, city: string, amount: number, txid: string) {
    const merchantAccount =
      this.formatField('00', 'BR.GOV.BCB.PIX') +
      this.formatField('01', key);

    let payload =
      this.formatField('00', '01') +
      this.formatField('26', merchantAccount) +
      this.formatField('52', '0000') +
      this.formatField('53', '986') + // Moeda BRL
      this.formatField('54', amount.toFixed(2)) +
      this.formatField('58', 'BR') +
      this.formatField('59', name.substring(0, 25)) +
      this.formatField('60', city.substring(0, 15)) +
      this.formatField('62', this.formatField('05', txid || '***')) +
      '6304';

    const checksum = this.calculateCRC16(payload);
    return `${payload}${checksum}`;
  }

  public static async generateQrCodeBuffer(payload: string): Promise<Buffer> {
    return QRCode.toBuffer(payload, { width: 250, margin: 1 });
  }
}