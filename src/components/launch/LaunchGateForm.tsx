"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  action: (formData: FormData) => Promise<void>;
  next: string;
  hasError: boolean;
};

type FieldErrors = { username?: string; password?: string };

const INPUT_CLS =
  "h-[48px] border-slate-200 bg-white px-3.5 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";

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
          Vérification…
        </>
      ) : (
        "Déverrouiller l'accès"
      )}
    </Button>
  );
}

/**
 * Form de deverrouillage du verrou de pre-launch. Validation client inline
 * (form en noValidate → pas de popup navigateur), coherente avec LoginForm.
 * Les identifiants incorrects sont signales par le serveur via ?error=1
 * (le mot de passe n'est jamais renvoye au client).
 */
export function LaunchGateForm({ action, next, hasError }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleAction(formData: FormData) {
    const username = ((formData.get("username") as string) ?? "").trim();
    const password = (formData.get("password") as string) ?? "";

    const fieldErrors: FieldErrors = {};
    if (!username) fieldErrors.username = "Identifiant requis.";
    if (!password) fieldErrors.password = "Mot de passe requis.";

    if (fieldErrors.username || fieldErrors.password) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await action(formData);
  }

  return (
    <form action={handleAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="username"
          className="text-[13.5px] font-semibold text-slate-700"
        >
          Identifiant
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : undefined}
          onChange={() =>
            setErrors((e) => (e.username ? { ...e, username: undefined } : e))
          }
          className={INPUT_CLS}
        />
        {errors.username && (
          <p id="username-error" className="text-[13px] text-rose-600">
            {errors.username}
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
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          onChange={() =>
            setErrors((e) => (e.password ? { ...e, password: undefined } : e))
          }
          className={INPUT_CLS}
        />
        {errors.password && (
          <p id="password-error" className="text-[13px] text-rose-600">
            {errors.password}
          </p>
        )}
      </div>

      {hasError && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
          Identifiant ou mot de passe incorrect.
        </p>
      )}

      <div className="mt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
