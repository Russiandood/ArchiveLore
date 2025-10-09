import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Make sure this runs on Node (not Edge) and doesn’t get cached
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
