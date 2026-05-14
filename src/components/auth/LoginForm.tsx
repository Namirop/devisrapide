"use client";

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

const ICON_CLS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
const ICON_SIZE = 18;
const INPUT_CLS =
  "h-[48px] border-slate-200 bg-white pl-10 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";

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
  return (
    <form action={action} className="flex flex-col gap-4">
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
            className={INPUT_CLS}
          />
        </div>
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
            className={INPUT_CLS}
          />
        </div>
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
