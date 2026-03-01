import QRCode from 'qrcode';

/** Generate QR code data URLs from raw byte arrays */
export async function generateQrDataUrls(chunks: Uint8Array[]): Promise<string[]> {
  const urls: string[] = [];
  for (const chunk of chunks) {
    const b64 = uint8ToBase64(chunk);
    const url = await QRCode.toDataURL([{ data: b64, mode: 'byte' as const }], {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 600,
      color: { dark: '#000000', light: '#ffffff' },
    });
    urls.push(url);
  }
  return urls;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
