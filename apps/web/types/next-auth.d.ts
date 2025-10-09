import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      twitchId?: string | null;
      name?: string | null;
      image?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twitchId?: string | null;
    displayName?: string | null;
    image?: string | null;
  }
}
