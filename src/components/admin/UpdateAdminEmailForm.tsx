"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Envelope } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateAdminEmail } from "@/server/actions/admin-account";

type Props = {
  currentEmail: string;
};

export function UpdateAdminEmailForm({ currentEmail }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const emailsMatch =
    newEmail.length === 0 ||
    confirmEmail.length === 0 ||
    newEmail.toLowerCase() === confirmEmail.toLowerCase();

  const canSubmit =
    currentPassword.length > 0 &&
    newEmail.length > 0 &&
    confirmEmail.length > 0 &&
    emailsMatch &&
    !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await updateAdminEmail({
        currentPassword,
        newEmail,
        confirmEmail,
      });
      if (!result.success) {
        toast.error("Impossible de modifier l'email", {
          description: result.message,
        });
        return;
      }
      toast.success("Email modifié", {
        description:
          "Votre adresse email a été mise à jour. Reconnectez-vous pour rafraîchir la session.",
      });
      setCurrentPassword("");
      setNewEmail("");
      setConfirmEmail("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          Email actuel
        </p>
        <p className="mt-1 text-[14px] text-slate-900">{currentEmail}</p>
      </div>

      <Field
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />

      <Field
        label="Nouvel email"
        type="email"
        autoComplete="off"
        value={newEmail}
        onChange={setNewEmail}
      />

      <div>
        <Field
          label="Confirmer le nouvel email"
          type="email"
          autoComplete="off"
          value={confirmEmail}
          onChange={setConfirmEmail}
        />
        {!emailsMatch && (
          <p className="mt-1 text-[12px] text-rose-600">
            Les deux emails ne correspondent pas.
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
              <Envelope size={14} weight="regular" aria-hidden />
              Modifier l&apos;email
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  type: "email" | "password";
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-slate-700">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
      />
    </label>
  );
}
