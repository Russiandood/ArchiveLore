import type { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";


const url =
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
process.env.NEXTAUTH_URL = url;

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      profile(profile) {
        const p = profile as any;
        const twitchId = p.sub ?? p.id?.toString();
        return {
          id: twitchId, 
          name: p.display_name ?? p.preferred_username ?? p.login ?? null,
          image: p.profile_image_url ?? null,
          email: p.email ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {

      if (account) {
        (token as any).access_token = (account as any).access_token;
        (token as any).providerAccountId = (account as any).providerAccountId;
      }

      if (profile && typeof profile === "object") {
        const p = profile as any;
        (token as any).twitchLogin = p.login ?? (token as any).twitchLogin;
        (token as any).displayName = p.display_name ?? (token as any).displayName ?? token.name;
        (token as any).image =
          p.profile_image_url ??
          (token as any).profileImageUrl ??
          (token as any).image ??
          (token as any).picture ??
          null;
        (token as any).twitchId = p.sub ?? p.id?.toString() ?? (token as any).twitchId ?? null;

        (token as any).profileImageUrl = (token as any).image;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...(session.user ?? {}),
        id: token.sub as string,
        name: (token as any).displayName ?? session.user?.name ?? "Twitch User",
        image:
          (token as any).profileImageUrl ??
          (token as any).image ??
          session.user?.image ??
          null,
        email: session.user?.email ?? null,
      };

      (session as any).accessToken = (token as any).access_token ?? null;

      (session.user as any).twitchId = (token as any).twitchId ?? null;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
