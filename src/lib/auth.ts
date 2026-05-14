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

        // Turnstile anti-bot : check AVANT bcrypt pour bloquer les
        // attaques automatisees au plus tot (economise CPU + rate limit).
        // Le token est passe par le Server Action login dans le champ
        // turnstileToken de credentials (cf. connexion/page.tsx).
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

        // Rate limit IP : 5 tentatives / minute. Defense anti brute force.
        // Le client recoit CredentialsSignin generique (Auth.js ne distingue
        // pas la cause) — le message UX "trop de tentatives" est affiche
        // cote /connexion via un check separe (cf. login form).
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
