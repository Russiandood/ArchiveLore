import type { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      profile(profile) {
        // Make sure image is mapped at account creation time
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
    async jwt({ token, profile }) {
      // On first sign-in run, `profile` is present - capture Twitch fields onto the JWT
      if (profile) {
        (token as any).twitchId =
          (profile as any).sub ?? (profile as any).id?.toString() ?? null;
        (token as any).displayName =
          (profile as any).display_name ??
          (profile as any).preferred_username ??
          (profile as any).login ??
          token.name ??
          null;
        (token as any).image =
          (profile as any).profile_image_url ?? (token as any).picture ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure id + image flow to the session your UI reads
      session.user.id = token.sub as string;
      (session.user as any).twitchId = (token as any).twitchId ?? null;
      session.user.name = (token as any).displayName ?? session.user.name ?? null;
      session.user.image = (token as any).image ?? session.user.image ?? null;
      return session;
    },
  },
};
