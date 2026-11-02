const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureRole(rolename) {
  const found = await prisma.role.findFirst({ where: { rolename } });
  if (found) return found;
  return prisma.role.create({ data: { rolename } });
}

async function ensureMembership(mname, score) {
  const found = await prisma.memberShip.findFirst({ where: { mname } });
  if (found) return found;
  return prisma.memberShip.create({ data: { mname, score } });
}

async function main() {
  await ensureRole('admin');
  await ensureRole('normal');
  await ensureMembership('Normal', 10);
  console.log('Seed completed');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());