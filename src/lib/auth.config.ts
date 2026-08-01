import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";
import type { ProValidationStatus, UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      // Photographie prise a la connexion, PAS une source de verite : le
      // statut change cote admin sans que le jeton bouge. Ne router aucune
      // decision dessus (blocage d'acces, achat de lead) — lire le
      // ProProfile en base, cf. requireProSession dans lib/auth-guards.ts.
      validationStatus: ProValidationStatus | null;
      // null pour les comptes non-PRO (ADMIN) ou pour un PRO dont le
      // ProProfile n'aurait pas ete cree (etat transitoire improbable
      // mais possible). Les Server Actions du dashboard rejettent
      // explicitement ce cas via `requireProSession()`.
      proProfileId: string | null;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    validationStatus?: ProValidationStatus | null;
    proProfileId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    validationStatus: ProValidationStatus | null;
    proProfileId: string | null;
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
        token.proProfileId = user.proProfileId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      session.user.validationStatus = token.validationStatus;
      session.user.proProfileId = token.proProfileId;
      return session;
    },
  },
} satisfies NextAuthConfig;
