import { NextResponse } from "next/server";
import { getOpsCostSnapshot } from "@/lib/cost-metrics";

export async function GET() {
  const snap = await getOpsCostSnapshot();
  return NextResponse.json(snap);
}
