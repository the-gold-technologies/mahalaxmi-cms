import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || "mahalaxmi-hp-lubricants-cms-secret-key-2026-auth",
  cookies: {
    sessionToken: {
      name: "mahalaxmi-cms.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as any).role || "admin";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        (session.user as any).role = token.role || "admin";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
