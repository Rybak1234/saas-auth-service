import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const users = await prisma.user.findMany({
    where: { tenantId: user!.tenantId },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const { email, password, name, role } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const allowedRoles = user!.role === "owner" ? ["admin", "member"] : ["member"];
  const assignRole = role && allowedRoles.includes(role) ? role : "member";

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const newUser = await prisma.user.create({
    data: { email, passwordHash, name, role: assignRole, tenantId: user!.tenantId },
    select: { id: true, email: true, name: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "user_created",
      userId: user!.sub,
      details: `Created user ${newUser.email} with role ${newUser.role}`,
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}
