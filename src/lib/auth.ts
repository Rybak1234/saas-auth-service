import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, TokenPayload } from "./jwt";

export async function authenticate(req: NextRequest): Promise<TokenPayload | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await verifyAccessToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(user: TokenPayload | null): NextResponse | null {
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export function requireRole(user: TokenPayload | null, roles: string[]): NextResponse | null {
  const authErr = requireAuth(user);
  if (authErr) return authErr;
  if (!roles.includes(user!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
