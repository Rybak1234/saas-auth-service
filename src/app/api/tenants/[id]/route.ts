import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const tenant = await prisma.tenant.findUnique({ where: { id: user!.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const [userCount, activeUsers, sessionCount, auditCount] = await Promise.all([
    prisma.user.count({ where: { tenantId: user!.tenantId } }),
    prisma.user.count({ where: { tenantId: user!.tenantId, active: true } }),
    prisma.session.count({ where: { user: { tenantId: user!.tenantId } } }),
    prisma.auditLog.count({ where: { user: { tenantId: user!.tenantId } } }),
  ]);

  return NextResponse.json({
    ...tenant,
    stats: { userCount, activeUsers, sessionCount, auditCount },
  });
}

export async function PUT(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner"]);
  if (err) return err;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;

  const tenant = await prisma.tenant.update({
    where: { id: user!.tenantId },
    data,
  });

  return NextResponse.json(tenant);
}
