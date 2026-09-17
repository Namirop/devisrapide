import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";
import type { ProValidationStatus, UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      // Photographie prise à la connexion, pas une source de vérité : l'admin
      // change le statut sans que le jeton bouge. Toute décision d'accès
      // relit le ProProfile en base (cf. requireProSession).
      validationStatus: ProValidationStatus | null;
      // null pour un ADMIN ; PRO sans profil rejeté par requireProSession().
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

// Config minimale (sans adapter Prisma ni bcrypt), partagée avec proxy.ts.
// Le provider Credentials et son `authorize` sont ajoutés dans auth.ts.
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
