"use client";

import { useState } from "react";
import { CircleNotch, Lock } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { updatePassword } from "@/server/actions/pro-profile-actions";

export function ProfilePasswordButton() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useSafeTransition();

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
  }

  function handleSubmit() {
    setErrors({});
    startTransition(async () => {
      const result = await updatePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) flat[key] = msgs[0];
          }
          setErrors(flat);
        }
        toast.error(result.error);
        return;
      }
      toast.success("Mot de passe mis à jour.");
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 gap-2 px-5"
      >
        <Lock size={16} weight="regular" aria-hidden />
        Changer mon mot de passe
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer mon mot de passe</DialogTitle>
            <DialogDescription>
              Saisissez votre mot de passe actuel pour confirmer, puis
              choisissez un nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Field
              label="Mot de passe actuel"
              type="password"
              value={current}
              onChange={setCurrent}
              error={errors.currentPassword}
            />
            <Field
              label="Nouveau mot de passe"
              type="password"
              value={next}
              onChange={setNext}
              error={errors.newPassword}
              hint="8 caractères min, 1 majuscule, 1 chiffre"
            />
            <Field
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={confirm}
              onChange={setConfirm}
              error={errors.confirmPassword}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={handleSubmit}
              disabled={isPending || !current || !next || !confirm}
            >
              {isPending && (
                <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
              )}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-medium text-slate-700">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-rose-300" : undefined}
      />
      {error ? (
        <p className="text-[12px] text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
