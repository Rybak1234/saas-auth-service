import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const err = requireAuth(user);
  if (err) return err;

  return NextResponse.json({ id: user!.tenantId });
}
