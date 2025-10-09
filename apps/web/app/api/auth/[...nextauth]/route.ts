import NextAuth, { type AuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

// Fallback so previews work (sets NEXTAUTH_URL if missing)
const url =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    process.env.NEXTAUTH_URL = url;

// NOTE: do NOT export this from a route file
const authOptions: AuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
