import { prisma } from '../lib/prisma';

(async () => {
  const planId = process.argv[2];
  if (!planId) throw new Error('planId required');

  const plan = await prisma.revclawPlan.findUnique({
    where: { id: planId },
    select: { status: true, executeIntentId: true },
  });

  console.log(JSON.stringify(plan, null, 2));
  await prisma.$disconnect();
})();
