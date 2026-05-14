"use client";

import { useState, useTransition } from "react";
import { CircleNotch, Lock } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateAdminPassword } from "@/server/actions/admin-account";

// Regle synchro avec updateAdminPasswordSchema cote serveur. Affiche
// chaque critere et coche en vert au fur et a mesure pour guider l'admin.
const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 10, label: "Au moins 10 caractères" },
  { test: (v: string) => /[A-Z]/.test(v), label: "Au moins une majuscule" },
  { test: (v: string) => /[a-z]/.test(v), label: "Au moins une minuscule" },
  { test: (v: string) => /\d/.test(v), label: "Au moins un chiffre" },
] as const;

export function UpdateAdminPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const passwordsMatch =
    newPassword.length === 0 ||
    confirmPassword.length === 0 ||
    newPassword === confirmPassword;
  const passwordValid = PASSWORD_RULES.every((r) => r.test(newPassword));

  const canSubmit =
    currentPassword.length > 0 &&
    passwordValid &&
    passwordsMatch &&
    confirmPassword.length > 0 &&
    !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await updateAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.success) {
        toast.error("Impossible de modifier le mot de passe", {
          description: result.message,
        });
        return;
      }
      toast.success("Mot de passe modifié", {
        description:
          "Utilisez le nouveau mot de passe à votre prochaine connexion.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Mot de passe actuel"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />

      <Field
        label="Nouveau mot de passe"
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
      />

      {newPassword.length > 0 && (
        <ul className="flex flex-col gap-1">
          {PASSWORD_RULES.map((r) => {
            const passed = r.test(newPassword);
            return (
              <li
                key={r.label}
                className={
                  passed
                    ? "text-[12px] text-emerald-600"
                    : "text-[12px] text-slate-500"
                }
              >
                {passed ? "✓" : "○"} {r.label}
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Field
          label="Confirmer le nouveau mot de passe"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        {!passwordsMatch && (
          <p className="mt-1 text-[12px] text-rose-600">
            Les deux mots de passe ne correspondent pas.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!canSubmit}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
        >
          {pending ? (
            <>
              <CircleNotch
                size={14}
                weight="bold"
                className="animate-spin"
                aria-hidden
              />
              Enregistrement…
            </>
          ) : (
            <>
              <Lock size={14} weight="regular" aria-hidden />
              Modifier le mot de passe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-slate-700">{label}</span>
      <input
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
      />
    </label>
  );
}
