import { prisma } from '../prisma.js';

export async function generateUniqueTrackingCode(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      suffix += chars[randomIndex];
    }
    code = `SYL-${suffix}`;

    const existing = await prisma.collaboration.findUnique({
      where: { trackingCode: code },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}
