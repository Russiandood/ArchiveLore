import type { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: { params: { force_verify: true } },
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
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        try {
          const res = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
              "Client-Id": process.env.TWITCH_CLIENT_ID!,
              Authorization: `Bearer ${account.access_token}`,
            },
            cache: "no-store",
          });
          if (res.ok) {
            const { data } = await res.json();
            const u = Array.isArray(data) ? data[0] : null;
            if (u) {
              (token as any).twitchId = u.id ?? null;
              (token as any).twitchLogin = u.login ?? null;
              (token as any).displayName = u.display_name ?? token.name ?? null;
              (token as any).image = u.profile_image_url ?? null;
              (token as any).profileImageUrl = (token as any).image;
            }
          }
        } catch {}
        (token as any).access_token = account.access_token;
        (token as any).providerAccountId = (account as any).providerAccountId;
      }
      if (profile && typeof profile === "object") {
        const p = profile as any;
        (token as any).twitchId = p.sub ?? p.id?.toString() ?? (token as any).twitchId ?? null;
        (token as any).twitchLogin = p.login ?? (token as any).twitchLogin ?? null;
        (token as any).displayName =
          p.display_name ?? (token as any).displayName ?? token.name ?? null;
        (token as any).image =
          p.profile_image_url ?? p.picture ?? (token as any).image ?? null;
        (token as any).profileImageUrl = (token as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.name = (token as any).displayName ?? session.user.name ?? "Twitch User";
      session.user.image =
        (token as any).profileImageUrl ?? (token as any).image ?? session.user.image ?? null;
      (session.user as any).twitchId = (token as any).twitchId ?? null;
      (session as any).accessToken = (token as any).access_token ?? null;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
