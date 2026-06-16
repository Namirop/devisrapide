import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Logo } from "@/components/ds/Logo";

export const metadata = {
  title: "Mot de passe oublié — DevisRapide",
};

export default function MotDePasseOubliePage() {
  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col items-center text-center">
          <Logo variant="brand" size={44} href="/" />
          <span className="mt-5 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#ea580c]">
            Espace artisan
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900">
            Mot de passe oublié&nbsp;?
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
            Saisissez l&apos;email de votre compte professionnel : nous vous
            enverrons un lien pour en choisir un nouveau.
          </p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-[13px] text-slate-500">
            Vous vous souvenez de votre mot de passe&nbsp;?{" "}
            <Link
              href="/connexion"
              className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
