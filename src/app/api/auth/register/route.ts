import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { email, password, name, tenantName } = await req.json();

  if (!email || !password || !name || !tenantName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return NextResponse.json({ error: "Tenant name already taken" }, { status: 409 });
  }

  const tenant = await prisma.tenant.create({
    data: { name: tenantName, slug },
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "owner",
      tenantId: tenant.id,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });
  const refreshToken = await signRefreshToken(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "register",
      userId: user.id,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    },
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
  }, { status: 201 });
}
