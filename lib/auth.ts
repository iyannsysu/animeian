import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createHash } from "crypto";

export function hashEmailId(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.picture =
          (profile as { picture?: string }).picture ?? token.picture;
      }
      if (token.email) {
        token.appId = hashEmailId(String(token.email));
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
        (session.user as { id?: string }).id =
          (token.appId as string | undefined) ??
          (session.user.email ? hashEmailId(session.user.email) : undefined);
      }
      return session;
    },
  },
};
