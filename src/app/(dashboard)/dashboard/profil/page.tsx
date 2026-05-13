import { Briefcase, Lock, MapPin, Sparkles, User } from "lucide-react";

import { AutoAcceptWidget } from "@/components/dashboard/AutoAcceptWidget";
import {
  ProfileCategoriesEditor,
  type AvailableCategory,
} from "@/components/dashboard/ProfileCategoriesEditor";
import { ProfileIdentityForm } from "@/components/dashboard/ProfileIdentityForm";
import { ProfilePasswordButton } from "@/components/dashboard/ProfilePasswordButton";
import { ProfileZoneForm } from "@/components/dashboard/ProfileZoneForm";
import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function ProfilPage() {
  const { userId, proProfileId } = await requireProSession();

  const [user, profile, allCategories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    }),
    prisma.proProfile.findUnique({
      where: { id: proProfileId },
      select: {
        companyName: true,
        vatNumber: true,
        postalCode: true,
        city: true,
        interventionRadiusKm: true,
        autoAccept: true,
        categories: { select: { categoryId: true } },
      },
    }),
    prisma.universe.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        name: true,
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  if (!profile || !user) {
    // Le middleware + requireProSession garantissent que ces fetchs
    // matchent. Defensive return pour le typing.
    throw new Error("Profile data missing");
  }

  const availableByUniverse: Array<{
    universe: string;
    categories: AvailableCategory[];
  }> = allCategories
    .filter((u) => u.categories.length > 0)
    .map((u) => ({
      universe: u.name,
      categories: u.categories.map((c) => ({
        id: c.id,
        name: c.name,
        universeName: u.name,
      })),
    }));

  const selectedCategoryIds = profile.categories.map((c) => c.categoryId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Profil & Entreprise
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">
          Gérez vos informations, métiers, zone d&apos;intervention et
          préférences.
        </p>
      </header>

      {/* Section 1 — Identité */}
      <Section icon={User} title="Identité entreprise">
        <ProfileIdentityForm
          initial={{
            companyName: profile.companyName,
            vatNumber: profile.vatNumber ?? "",
            email: user.email,
            phone: user.phone ?? "",
          }}
        />
      </Section>

      {/* Section 2 — Métiers */}
      <Section icon={Briefcase} title="Métiers couverts">
        <p className="mb-3 text-[13px] text-slate-500">
          Vous recevez uniquement les leads correspondant aux catégories
          cochées. Minimum 1 catégorie obligatoire.
        </p>
        <ProfileCategoriesEditor
          initialSelectedIds={selectedCategoryIds}
          availableByUniverse={availableByUniverse}
        />
      </Section>

      {/* Section 3 — Zone */}
      <Section icon={MapPin} title="Zone d'intervention">
        <ProfileZoneForm
          initial={{
            postalCode: profile.postalCode,
            city: profile.city,
            radiusKm: profile.interventionRadiusKm,
          }}
        />
      </Section>

      {/* Section 4 — Auto-accept */}
      <Section icon={Sparkles} title="Auto-accept">
        <p className="mb-3 text-[13px] text-slate-500">
          Activez l&apos;auto-accept pour acheter automatiquement les leads
          matchant votre profil et votre zone. Solde wallet débité
          automatiquement à chaque acceptation.
        </p>
        <AutoAcceptWidget initialValue={profile.autoAccept} />
      </Section>

      {/* Section 5 — Sécurité */}
      <Section icon={Lock} title="Sécurité">
        <p className="mb-3 text-[13px] text-slate-500">
          Mettez à jour votre mot de passe. Règles : 8 caractères minimum,
          1 majuscule, 1 chiffre.
        </p>
        <ProfilePasswordButton />
      </Section>
    </main>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-md bg-blue-50"
          aria-hidden
        >
          <Icon className="h-4 w-4 text-[#1e3a8a]" strokeWidth={2} />
        </span>
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
