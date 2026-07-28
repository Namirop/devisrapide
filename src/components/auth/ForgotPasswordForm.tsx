"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import Turnstile from "react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { requestPasswordReset } from "@/server/actions/pro-password-reset";

// Fallback dev sans key : test sitekey "always passes" (cf. LoginForm).
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

const INPUT_CLS =
  "h-[48px] border-slate-200 bg-white px-3.5 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useSafeTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Veuillez renseigner votre email.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Cet email n'est pas valide.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await requestPasswordReset({
        email: value,
        turnstileToken,
      });
      if (res.success) {
        setDone(true);
        return;
      }
      setError(res.message);
    });
  }

  // Reponse generique volontaire : on n'indique jamais si l'email existe.
  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-6 text-center">
        <CheckCircle size={32} weight="fill" className="text-emerald-600" />
        <p className="text-[14.5px] font-semibold text-slate-900">
          Vérifiez votre boîte mail
        </p>
        <p className="text-[13.5px] leading-relaxed text-slate-600">
          Si un compte est associé à <strong>{email.trim()}</strong>, vous
          allez recevoir un lien pour réinitialiser votre mot de passe. Le lien
          expire dans 1 heure — pensez à vérifier vos spams.
        </p>
        <Link
          href="/connexion"
          className="mt-1 text-[13px] font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="email"
          className="text-[13.5px] font-semibold text-slate-700"
        >
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.be"
          value={email}
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          className={INPUT_CLS}
        />
        {error && (
          <p id="email-error" className="text-[13px] text-rose-600">
            {error}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile anti-bot. onVerify alimente le token envoye au
          Server Action (verifie avant l'envoi de l'email). */}
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        theme="light"
        onVerify={(token) => setTurnstileToken(token)}
      />

      <Button
        type="submit"
        variant="accent"
        disabled={pending}
        className="h-12 w-full gap-2 text-[15px] font-semibold"
      >
        {pending ? (
          <>
            <CircleNotch
              size={16}
              weight="bold"
              className="animate-spin"
              aria-hidden
            />
            Envoi…
          </>
        ) : (
          "Recevoir le lien de réinitialisation"
        )}
      </Button>
    </form>
  );
}
