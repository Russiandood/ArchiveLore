// apps/web/app/api/craft/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge"; // you can switch to "nodejs" while debugging

export async function POST(req: Request) {
  return realCraftHandler(req); // we'll (re)introduce this in a moment
}

// TEMP placeholder so the file compiles before we paste the real logic
async function realCraftHandler(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, route: "/api/craft", method: "POST", body });
}
