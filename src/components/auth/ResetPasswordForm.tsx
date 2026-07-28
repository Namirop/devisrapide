"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { resetPassword } from "@/server/actions/pro-password-reset";

const INPUT_CLS =
  "h-[48px] border-slate-200 bg-white px-3.5 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";

const PASSWORD_HINT = "Au moins 8 caractères, une majuscule et un chiffre.";

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
  form?: string;
};

// Miroir client de passwordRules (8+, une majuscule, un chiffre). La source
// autoritaire reste le schema Zod cote serveur ; ceci evite juste un
// aller-retour pour une saisie evidemment invalide.
function validatePassword(pw: string): string | undefined {
  if (pw.length < 8) return "Au moins 8 caractères.";
  if (!/[A-Z]/.test(pw)) return "Au moins une majuscule.";
  if (!/\d/.test(pw)) return "Au moins un chiffre.";
  return undefined;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useSafeTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: FieldErrors = {};
    const pwError = validatePassword(password);
    if (pwError) next.password = pwError;
    if (confirmPassword !== password)
      next.confirmPassword = "Les mots de passe ne correspondent pas.";
    if (next.password || next.confirmPassword) {
      setErrors(next);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const res = await resetPassword({ token, password, confirmPassword });
      if (res.success) {
        router.push("/connexion?reset=success");
        return;
      }
      if (res.code === "TOKEN_INVALID") {
        setErrors({ form: res.message });
        return;
      }
      const fe = res.fieldErrors;
      setErrors({
        password: fe?.password?.[0],
        confirmPassword: fe?.confirmPassword?.[0],
        form: fe ? undefined : res.message,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          className="text-[13.5px] font-semibold text-slate-700"
        >
          Nouveau mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          aria-invalid={!!errors.password}
          aria-describedby="password-hint"
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password)
              setErrors((s) => ({ ...s, password: undefined }));
          }}
          className={INPUT_CLS}
        />
        {/* Regles toujours visibles (pas seulement en placeholder qui
            disparait a la saisie). Passe en rouge si la regle est violee. */}
        <p
          id="password-hint"
          className={
            errors.password
              ? "text-[13px] text-rose-600"
              : "text-[12.5px] text-slate-500"
          }
        >
          {errors.password ?? PASSWORD_HINT}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="confirmPassword"
          className="text-[13.5px] font-semibold text-slate-700"
        >
          Confirmer le mot de passe
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword)
              setErrors((s) => ({ ...s, confirmPassword: undefined }));
          }}
          className={INPUT_CLS}
        />
        {errors.confirmPassword && (
          <p id="confirm-error" className="text-[13px] text-rose-600">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {errors.form && <p className="text-[13px] text-rose-600">{errors.form}</p>}

      <Button
        type="submit"
        variant="accent"
        disabled={pending}
        className="mt-2 h-12 w-full gap-2 text-[15px] font-semibold"
      >
        {pending ? (
          <>
            <CircleNotch
              size={16}
              weight="bold"
              className="animate-spin"
              aria-hidden
            />
            Mise à jour…
          </>
        ) : (
          "Réinitialiser mon mot de passe"
        )}
      </Button>
    </form>
  );
}
