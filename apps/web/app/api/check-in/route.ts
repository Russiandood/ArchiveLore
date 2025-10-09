import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

const API_BASE = process.env.API_BASE_URL || "https://osg-api.fly.dev";

function hmacSign(body: string, key: string) {
  return crypto.createHmac("sha256", key).update(body).digest("hex");
}

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    userId: session.user.id,
    twitchId: (session.user as any).twitchId ?? null,
  };
  const body = JSON.stringify(payload);
  const sig = hmacSign(body, process.env.SHARED_API_KEY!);

  const res = await fetch(`${API_BASE}/api/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": sig },
    body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
