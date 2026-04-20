import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const body = await req.json();
  const { refreshToken } = body;

  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  } else {
    await prisma.session.deleteMany({ where: { userId: user!.sub } });
  }

  await prisma.auditLog.create({
    data: {
      action: "logout",
      userId: user!.sub,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    },
  });

  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  return res;
}
