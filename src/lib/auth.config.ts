import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";
import type { ProValidationStatus, UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      validationStatus: ProValidationStatus | null;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    validationStatus?: ProValidationStatus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    validationStatus: ProValidationStatus | null;
  }
}

// Config Edge-safe (sans adapter Prisma, sans bcrypt). Utilisable depuis le
// middleware qui tourne en Edge runtime. Le provider Credentials avec sa
// fonction `authorize` est ajoute dans `auth.ts` (Node runtime).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.validationStatus = user.validationStatus ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      session.user.validationStatus = token.validationStatus;
      return session;
    },
  },
} satisfies NextAuthConfig;
