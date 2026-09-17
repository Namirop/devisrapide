import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Script de maintenance : (re)pose l'admin principal depuis ADMIN_EMAIL /
// ADMIN_INITIAL_PASSWORD en forçant le mot de passe (seedAdmin() ne le pose
// qu'à la création). Ne touche à rien d'autre.
//
// Usage : DATABASE_URL, ADMIN_EMAIL et ADMIN_INITIAL_PASSWORD dans
// l'environnement, puis `pnpm db:reset-admin`.

const prisma = new PrismaClient();

// Affiche l'hôte de la BDD ciblée : garde-fou contre un reset sur la mauvaise
// base.
function dbHost(url: string | undefined): string {
  if (!url) return "(DATABASE_URL absente)";
  try {
    return new URL(url).host;
  } catch {
    return "(URL illisible)";
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    console.error(
      "[reset-admin] ❌ ADMIN_EMAIL et ADMIN_INITIAL_PASSWORD sont requis. Abandon.",
    );
    process.exit(1);
  }

  console.log(`[reset-admin] cible BDD : ${dbHost(process.env.DATABASE_URL)}`);
  console.log(`[reset-admin] admin     : ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });

  await prisma.user.upsert({
    where: { email },
    // Reset complet : mot de passe forcé, rôle ADMIN garanti, et
    // réactivation si le compte avait été soft-deleted.
    update: { role: "ADMIN", passwordHash, deletedAt: null },
    create: { email, role: "ADMIN", firstName: "Admin", passwordHash },
  });

  if (!existing) {
    console.log("[reset-admin] ✓ admin créé.");
  } else if (existing.deletedAt) {
    console.log(
      "[reset-admin] ✓ admin réactivé (soft-delete annulé) + mot de passe réinitialisé + rôle ADMIN forcé.",
    );
  } else {
    console.log(
      "[reset-admin] ✓ mot de passe réinitialisé + rôle ADMIN forcé.",
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
