import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only owners can modify admins
  if (target.role === "admin" && user!.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.active !== undefined) data.active = body.active;
  if (body.role !== undefined) {
    const allowedRoles = user!.role === "owner" ? ["admin", "member"] : ["member"];
    if (allowedRoles.includes(body.role)) data.role = body.role;
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "role_change",
      userId: user!.sub,
      details: `Updated user ${updated.email}: ${JSON.stringify(data)}`,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner"]);
  if (err) return err;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === user!.sub) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
