import Link from "next/link";
import { redirect } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  Bell,
  Sliders,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { AuthError } from "next-auth";

import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ds/Logo";
import { auth, signIn } from "@/lib/auth";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

const BENEFITS: ReadonlyArray<{
  Icon: Icon;
  title: string;
  text: string;
}> = [
  {
    Icon: Sparkle,
    title: "Sans abonnement",
    text: "Vous ne payez que les leads que vous acceptez.",
  },
  {
    Icon: Bell,
    title: "Notifications instantanées",
    text: "Email + push : ne ratez aucune opportunité.",
  },
  {
    Icon: Sliders,
    title: "Gardez le contrôle",
    text: "Auto-accept, zone, métiers : vous décidez.",
  },
];

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  async function login(formData: FormData) {
    "use server";
    const callback = (formData.get("callbackUrl") as string) || "/";
    const target =
      callback.startsWith("/dashboard") || callback.startsWith("/admin")
        ? callback
        : "/dashboard";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        // Token Turnstile injecte par le widget client. Verifie cote
        // serveur dans authorize() avant bcrypt.
        turnstileToken: formData.get("cf-turnstile-response"),
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(
          `/connexion?error=invalid&callbackUrl=${encodeURIComponent(callback)}`,
        );
      }
      throw err;
    }
  }

  return (
    // Page bg-slate-50 avec grille pattern de fond pour texture. Layout
    // 2-col sur lg+ : pitch artisan a gauche, card de connexion a droite.
    // Sur mobile, stack vertical avec un mini-header (logo + eyebrow)
    // au-dessus de la card.
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
          {/* GAUCHE — pitch artisan (lg+ only). items-center sur la grille
              aligne les centres verticaux des 2 colonnes (le titre/bullets
              gauche et la card droite). Pas de justify-center necessaire car
              la colonne prend sa hauteur naturelle. */}
          <div className="hidden flex-col lg:flex">
            <Logo variant="brand" size={56} href="/" />
            <span className="mt-6 text-[14px] font-semibold uppercase tracking-[0.05em] text-[#ea580c]">
              Espace artisan
            </span>
            <h1
              className="font-display mt-3 text-[44px] font-extrabold leading-[1] tracking-tight text-slate-900 lg:text-[56px]"
              style={{ color: "#1e3a8a", letterSpacing: "-0.025em" }}
            >
              Bon retour parmi nous.
            </h1>
            <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-slate-600">
              Retrouvez vos chantiers, votre wallet et vos notifications en
              un coup d&apos;œil.
            </p>
            <ul className="mt-7 flex flex-col gap-3.5">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-3.5">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50"
                    aria-hidden
                  >
                    <b.Icon
                      size={22}
                      weight="regular"
                      className="text-[#1e3a8a]"
                    />
                  </span>
                  <div className="pt-0.5 leading-tight">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {b.title}
                    </div>
                    <div className="mt-0.5 text-[13px] text-slate-500">
                      {b.text}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* DROITE — card de connexion. Le lien "Pas encore inscrit" est
              integre dans la card (footer avec border-top) pour que la card
              constitue toute la colonne. Cela permet d'aligner son centre
              vertical avec le pitch gauche via items-center sur la grille. */}
          <div className="flex flex-col">
            {/* Mini-header mobile (cache sur lg+) */}
            <div className="mb-6 flex flex-col items-center gap-1 text-center lg:hidden">
              <Logo variant="brand" size={40} href="/" />
              <span className="mt-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#ea580c]">
                Espace artisan
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-12">
              <h2 className="font-display text-[24px] font-bold tracking-tight text-slate-900 lg:text-[28px]">
                Connectez-vous
              </h2>
              <p className="mt-1.5 text-[14px] text-slate-500">
                Accédez à votre espace professionnel.
              </p>
              <div className="mt-6">
                <LoginForm
                  action={login}
                  callbackUrl={callbackUrl ?? ""}
                  error={error}
                />
              </div>

              <p className="mt-6 border-t border-slate-100 pt-5 text-center text-[13px] text-slate-500">
                Pas encore inscrit ?{" "}
                <Link
                  href="/inscription-pro"
                  className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
                >
                  Devenir artisan
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
