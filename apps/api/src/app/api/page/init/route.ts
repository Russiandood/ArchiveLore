import { NextRequest, NextResponse } from "next/server";
import { setActivePage, type PageTier } from "@/server/page";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.PAGE_ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tier = body?.tier as PageTier;
  const target = Number(body?.target);

  const allowed: PageTier[] = ["mundane","curious","artifact","relic","sacred","divine"];
  if (!allowed.includes(tier) || !Number.isFinite(target) || target <= 0) {
    return NextResponse.json({ error: "Bad tier or target" }, { status: 400 });
  }

  await setActivePage(tier, target);
  return NextResponse.json({ ok: true, tier, target });
}
