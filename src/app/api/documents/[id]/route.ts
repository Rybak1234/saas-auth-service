import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const document = await prisma.document.findFirst({
    where: { id: params.id, tenantId: user!.tenantId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const document = await prisma.document.findFirst({
    where: { id: params.id, tenantId: user!.tenantId },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.pinned !== undefined) data.pinned = body.pinned;

  const updated = await prisma.document.update({
    where: { id: params.id },
    data,
    include: { user: { select: { name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: { action: "document_update", userId: user!.sub, details: `Updated document: ${updated.title}` },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  const document = await prisma.document.findFirst({
    where: { id: params.id, tenantId: user!.tenantId },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { action: "document_delete", userId: user!.sub, details: `Deleted document: ${document.title}` },
  });

  return NextResponse.json({ ok: true });
}
