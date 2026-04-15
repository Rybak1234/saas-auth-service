import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { tenantId: user!.tenantId };
  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const body = await req.json();
  const { title, content, category } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      title: title.trim(),
      content: content || "",
      category: category || "General",
      userId: user!.sub,
      tenantId: user!.tenantId,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: { action: "document_create", userId: user!.sub, details: `Created document: ${title}` },
  });

  return NextResponse.json(document, { status: 201 });
}
