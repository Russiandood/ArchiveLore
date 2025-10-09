import type { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
// import your PrismaAdapter + prisma as you already do

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      profile(profile) {
        const twitchId = (profile as any).sub ?? (profile as any).id?.toString();
        return {
          id: twitchId,
          name:
            (profile as any).display_name ??
            (profile as any).preferred_username ??
            (profile as any).login,
          image: (profile as any).profile_image_url ?? null,
          email: (profile as any).email ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      // If you populate twitchId/displayName from DB, do it here
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      (session.user as any).twitchId = (token as any).twitchId ?? null;
      session.user.name = (token as any).displayName ?? session.user.name;
      session.user.image = (token as any).image ?? session.user.image;
      return session;
    },
  },
};
