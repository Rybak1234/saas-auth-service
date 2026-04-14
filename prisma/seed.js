const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding auth database...");

  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: { name: "Empresa Demo", slug: "empresa-demo" },
  });

  const tenant2 = await prisma.tenant.create({
    data: { name: "Startup Tech", slug: "startup-tech" },
  });

  const hash = await bcrypt.hash("Demo1234!", 10);

  await prisma.user.createMany({
    data: [
      { email: "admin@demo.com", passwordHash: hash, name: "Admin Principal", role: "owner", tenantId: tenant.id },
      { email: "maria@demo.com", passwordHash: hash, name: "María García", role: "admin", tenantId: tenant.id },
      { email: "carlos@demo.com", passwordHash: hash, name: "Carlos López", role: "member", tenantId: tenant.id },
      { email: "admin@startup.com", passwordHash: hash, name: "Tech Lead", role: "owner", tenantId: tenant2.id },
      { email: "dev@startup.com", passwordHash: hash, name: "Desarrollador", role: "member", tenantId: tenant2.id },
    ],
  });

  console.log("✅ Created 2 tenants and 5 users");
  console.log("📧 Login: admin@demo.com / Demo1234!");
  console.log("🎉 Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
