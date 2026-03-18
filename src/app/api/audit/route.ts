import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireRole(user, ["owner", "admin"]);
  if (err) return err;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { user: { tenantId: user!.tenantId } },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where: { user: { tenantId: user!.tenantId } } }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
