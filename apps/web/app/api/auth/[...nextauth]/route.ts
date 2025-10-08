import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

const handler = NextAuth({
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.access_token = account.access_token;
        token.providerAccountId = account.providerAccountId;
      }
      if (profile && typeof profile === "object") {
        // Useful basics for your UI
        // @ts-ignore
        token.twitchLogin = profile.login ?? token.twitchLogin;
        // @ts-ignore
        token.displayName = profile.display_name ?? token.displayName;
        // @ts-ignore
        token.profileImageUrl = profile.profile_image_url ?? token.profileImageUrl;
      }
      return token;
    },
    async session({ session, token }) {
      // surface a few fields for the UI
      // @ts-ignore
      session.accessToken = token.access_token;
      // @ts-ignore
      session.twitchLogin = token.twitchLogin;
      // @ts-ignore
      session.displayName = token.displayName;
      // @ts-ignore
      session.profileImageUrl = token.profileImageUrl;
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
