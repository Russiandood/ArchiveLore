import { NextResponse } from "next/server";
import { getActivePage } from "@/server/page";

export async function GET() {
  const state = await getActivePage();
  return NextResponse.json(state);
}
