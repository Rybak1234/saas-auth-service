import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const sessions = await prisma.session.findMany({
    where: { user: { tenantId: user!.tenantId } },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner"]);
  if (err) return err;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("id");

  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session || session.user.tenantId !== user!.tenantId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    await prisma.session.delete({ where: { id: sessionId } });
  } else {
    await prisma.session.deleteMany({
      where: { user: { tenantId: user!.tenantId }, expiresAt: { lt: new Date() } },
    });
  }

  return NextResponse.json({ message: "Sessions cleaned" });
}
