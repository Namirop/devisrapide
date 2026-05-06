import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import type { ProValidationStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/schemas/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      validationStatus: ProValidationStatus | null;
    } & DefaultSession["user"];
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    // Magic link Email provider (clients) sera ajoute au Sprint 5 avec Resend.
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { proProfile: { select: { validationStatus: true } } },
        });

        if (!user || !user.passwordHash || user.deletedAt) return null;
        if (user.role === "CLIENT") return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
          role: user.role,
          validationStatus: user.proProfile?.validationStatus ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.validationStatus = user.validationStatus ?? null;
      } else if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { proProfile: { select: { validationStatus: true } } },
        });
        if (fresh) {
          token.role = fresh.role;
          token.validationStatus = fresh.proProfile?.validationStatus ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role as UserRole;
      session.user.validationStatus =
        token.validationStatus as ProValidationStatus | null;
      return session;
    },
  },
});
