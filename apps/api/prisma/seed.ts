import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Secret1234', 10)
  await prisma.user.upsert({
    where: { email: 'demo@fluxo.bank' },
    update: { passwordHash },
    create: {
      email: 'demo@fluxo.bank',
      passwordHash,
    },
  })
}

main()
  .catch((e) => {
    process.stderr.write(`${e}\n`)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
