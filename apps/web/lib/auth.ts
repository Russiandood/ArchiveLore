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
    async jwt({ token, account, profile }) {
      if (account) {
        // @ts-ignore
        token.access_token = account.access_token;
        // @ts-ignore
        token.providerAccountId = account.providerAccountId;
      }
      if (profile && typeof profile === "object") {
        const p = profile as any;
        // @ts-ignore
        token.twitchLogin = p.login ?? token.twitchLogin;
        // @ts-ignore
        token.displayName = p.display_name ?? token.displayName;
        // @ts-ignore
        token.profileImageUrl = p.profile_image_url ?? token.profileImageUrl;
      }
      return token;
    },
    async session({ session, token }) {
        // Populate standard fields so TS is happy
        const name = (token as any).displayName ?? session.user?.name ?? "Twitch User";
        const image = (token as any).profileImageUrl ?? session.user?.image;

        // NextAuth expects user to exist
        session.user = {
            ...(session.user ?? {}),
            name,
            image,
        };

        // Keep access token if you want it later
        // @ts-ignore
        session.accessToken = (token as any).access_token;

        return session;
        },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

