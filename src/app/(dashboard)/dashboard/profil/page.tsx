import {
  Briefcase,
  Lock,
  MapPin,
  Sparkle,
  User,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

import { AutoAcceptToggleRow } from "@/components/dashboard/profile/AutoAcceptToggleRow";
import {
  ProfileCategoriesEditor,
  type AvailableCategory,
} from "@/components/dashboard/profile/ProfileCategoriesEditor";
import { ProfileIdentityForm } from "@/components/dashboard/profile/ProfileIdentityForm";
import { ProfilePasswordButton } from "@/components/dashboard/profile/ProfilePasswordButton";
import { ProfileZoneForm } from "@/components/dashboard/profile/ProfileZoneForm";
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
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-10">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Profil & Entreprise
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Gérez vos informations, métiers, zone d&apos;intervention et
          préférences.
        </p>
      </header>

      {/* Sections plat, separees par border-t. Titre font-display + ligne
          decorative orange w-8 (pattern coherent avec /leads/[id] +
          /mes-demandes/[id]). */}
      <Section icon={User} title="Identité entreprise" isFirst>
        <ProfileIdentityForm
          initial={{
            companyName: profile.companyName,
            vatNumber: profile.vatNumber ?? "",
            email: user.email,
            phone: user.phone ?? "",
          }}
        />
      </Section>

      <Section icon={Briefcase} title="Métiers couverts">
        <p className="mb-4 text-[13px] text-slate-600">
          Vous recevez uniquement les leads correspondant aux catégories
          cochées. Minimum 1 catégorie obligatoire.
        </p>
        <ProfileCategoriesEditor
          initialSelectedIds={selectedCategoryIds}
          availableByUniverse={availableByUniverse}
        />
      </Section>

      <Section icon={MapPin} title="Zone d'intervention">
        <ProfileZoneForm
          initial={{
            postalCode: profile.postalCode,
            city: profile.city,
            radiusKm: profile.interventionRadiusKm,
          }}
        />
      </Section>

      <Section icon={Sparkle} title="Auto-accept">
        <p className="mb-4 text-[13px] text-slate-600">
          Activez l&apos;auto-accept pour acheter automatiquement les leads
          matchant votre profil et votre zone. Solde wallet débité
          automatiquement à chaque acceptation.
        </p>
        <AutoAcceptToggleRow initialValue={profile.autoAccept} />
      </Section>

      <Section icon={Lock} title="Sécurité" isLast>
        <p className="mb-4 text-[13px] text-slate-600">
          Mettez à jour votre mot de passe. Règles : 8 caractères minimum,
          1 majuscule, 1 chiffre.
        </p>
        <ProfilePasswordButton />
      </Section>
    </main>
  );
}

function Section({
  icon: IconComp,
  title,
  isFirst,
  isLast,
  children,
}: {
  icon: Icon;
  title: string;
  isFirst?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${isFirst ? "" : "border-t border-slate-200 pt-10"} ${
        isLast ? "" : "pb-10"
      }`}
    >
      <header className="mb-5">
        <h2 className="font-display flex items-center gap-2 text-[20px] font-bold text-slate-900">
          <IconComp size={20} weight="regular" className="text-[#1e3a8a]" />
          {title}
        </h2>
        <div
          className="mt-2 h-[2px] w-8"
          style={{ backgroundColor: "#ea580c" }}
          aria-hidden
        />
      </header>
      {children}
    </section>
  );
}
