import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireAuth(user);
  if (err) return err;

  const dbUser = await prisma.user.findUnique({
    where: { id: user!.sub },
    select: { id: true, email: true, name: true, role: true, tenantId: true, active: true, createdAt: true, tenant: { select: { name: true, slug: true } } },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(dbUser);
}
