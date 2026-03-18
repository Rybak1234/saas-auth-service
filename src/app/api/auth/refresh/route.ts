import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
  }

  let payload: { sub: string };
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({ where: { refreshToken } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });
  }

  // Rotate refresh token
  const newAccessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });
  const newRefreshToken = await signRefreshToken(user.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  await prisma.auditLog.create({
    data: {
      action: "refresh",
      userId: user.id,
      ip: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
}
