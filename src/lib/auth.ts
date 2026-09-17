import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginLimiter } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { credentialsSchema } from "@/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      const next = await authConfig.callbacks.jwt({ token, user, trigger });
      if (!user && trigger === "update" && next.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: next.sub },
          include: {
            proProfile: { select: { id: true, validationStatus: true } },
          },
        });
        if (fresh) {
          next.role = fresh.role;
          next.validationStatus = fresh.proProfile?.validationStatus ?? null;
          next.proProfileId = fresh.proProfile?.id ?? null;
        }
      }
      return next;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Turnstile en premier : un bot est rejeté sans coût bcrypt ni
        // quota de rate limit (token envoyé par l'action login de /connexion).
        const turnstileToken =
          typeof (raw as Record<string, unknown>)?.turnstileToken === "string"
            ? ((raw as Record<string, unknown>).turnstileToken as string)
            : "";
        const turnstile = await verifyTurnstileToken(turnstileToken);
        if (!turnstile.success) {
          console.warn("[auth/login] turnstile failed", {
            errorCodes: turnstile.errorCodes,
          });
          return null;
        }

        // Anti brute force par IP. Auth.js ne remonte qu'un CredentialsSignin
        // générique : un blocage s'affiche comme des identifiants invalides.
        const headerList = await headers();
        const ip =
          headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headerList.get("x-real-ip") ||
          "unknown";
        const rl = await loginLimiter().limit(ip);
        if (!rl.success) {
          console.warn("[auth/login] rate limited", { ip });
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            proProfile: { select: { id: true, validationStatus: true } },
          },
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
          proProfileId: user.proProfile?.id ?? null,
        };
      },
    }),
  ],
});
