"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleNotch, Envelope, Key } from "@phosphor-icons/react";
import Turnstile from "react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Fallback dev sans key : sitekey "mock" -> react-turnstile renvoie le
// token "mock" que verifyTurnstileToken accepte cote serveur en dev.
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

type Props = {
  action: (formData: FormData) => Promise<void>;
  callbackUrl: string;
  error?: string;
};

type FieldErrors = { email?: string; password?: string };

const ICON_CLS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
const ICON_SIZE = 18;
const INPUT_CLS =
  "h-[48px] border-slate-200 bg-white pl-10 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
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
          Connexion…
        </>
      ) : (
        "Se connecter"
      )}
    </Button>
  );
}

export function LoginForm({ action, callbackUrl, error }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});

  // Validation client : remplace la popup native du navigateur (form en
  // noValidate) par des messages inline coherents avec le reste du projet.
  // On bloque le Server Action tant qu'un champ est vide / invalide.
  async function handleAction(formData: FormData) {
    const email = ((formData.get("email") as string) ?? "").trim();
    const password = (formData.get("password") as string) ?? "";

    const next: FieldErrors = {};
    if (!email) next.email = "Veuillez renseigner votre email.";
    else if (!EMAIL_RE.test(email)) next.email = "Cet email n'est pas valide.";
    if (!password) next.password = "Veuillez renseigner votre mot de passe.";

    if (next.email || next.password) {
      setErrors(next);
      return;
    }

    setErrors({});
    await action(formData);
  }

  return (
    <form action={handleAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[13.5px] font-semibold text-slate-700">
          Email
        </Label>
        <div className="relative">
          <Envelope
            size={ICON_SIZE}
            weight="regular"
            className={ICON_CLS}
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.be"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={() =>
              setErrors((e) => (e.email ? { ...e, email: undefined } : e))
            }
            className={INPUT_CLS}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-[13px] text-rose-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          className="text-[13.5px] font-semibold text-slate-700"
        >
          Mot de passe
        </Label>
        <div className="relative">
          <Key
            size={ICON_SIZE}
            weight="regular"
            className={ICON_CLS}
            aria-hidden
          />
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            onChange={() =>
              setErrors((e) =>
                e.password ? { ...e, password: undefined } : e,
              )
            }
            className={INPUT_CLS}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="text-[13px] text-rose-600">
            {errors.password}
          </p>
        )}
      </div>

      {error === "invalid" && (
        <p className="text-[13px] text-rose-600">
          Email ou mot de passe incorrect.
        </p>
      )}

      {/* Cloudflare Turnstile anti-bot. Le widget injecte un input hidden
          name="cf-turnstile-response" dans le form, lu par le Server Action
          login + verifie par authorize() avant bcrypt compare. */}
      <Turnstile sitekey={TURNSTILE_SITE_KEY} theme="light" />

      <div className="mt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
