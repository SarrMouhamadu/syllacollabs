import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@sylla.com';
  const password = process.env.ADMIN_PASSWORD || 'admin_sylla_2026';

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        fullName: 'Direction Sylla',
        role: 'ADMIN',
      },
    });
    console.log(`✅ Administrateur initial créé : ${email}`);
  } else {
    console.log(`ℹ️ L'administrateur existe déjà : ${email}`);
  }
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
