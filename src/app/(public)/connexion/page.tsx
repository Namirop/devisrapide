import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ds/Logo";
import { auth, signIn } from "@/lib/auth";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/pro");
  }

  async function login(formData: FormData) {
    "use server";
    const callback = (formData.get("callbackUrl") as string) || "/";
    const target =
      callback.startsWith("/pro") || callback.startsWith("/admin")
        ? callback
        : "/pro";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
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
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo size={48} href="/" />
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ea580c]">
          Espace pro
        </span>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
          Connectez-vous
        </h1>
        <p className="text-[14px] text-slate-600">
          Accédez à votre espace professionnel.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <LoginForm
          action={login}
          callbackUrl={callbackUrl ?? ""}
          error={error}
        />
      </div>

      <p className="text-center text-[13px] text-slate-500">
        Pas encore inscrit ?{" "}
        <Link
          href="/inscription-pro"
          className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          Devenir artisan
        </Link>
      </p>
    </section>
  );
}
