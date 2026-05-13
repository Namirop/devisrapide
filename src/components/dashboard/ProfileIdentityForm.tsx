"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProProfileIdentity } from "@/server/actions/pro-profile-actions";

type Props = {
  initial: {
    companyName: string;
    vatNumber: string;
    email: string;
    phone: string;
  };
};

export function ProfileIdentityForm({ initial }: Props) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const dirty =
    values.companyName !== initial.companyName ||
    values.vatNumber !== initial.vatNumber ||
    values.email !== initial.email ||
    values.phone !== initial.phone;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateProProfileIdentity(values);
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
      toast.success("Identité mise à jour.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        label="Nom commercial"
        name="companyName"
        value={values.companyName}
        onChange={(v) => setValues((s) => ({ ...s, companyName: v }))}
        error={errors.companyName}
      />
      <Field
        label="Numéro de TVA"
        name="vatNumber"
        placeholder="BE0123456789"
        value={values.vatNumber}
        onChange={(v) => setValues((s) => ({ ...s, vatNumber: v }))}
        error={errors.vatNumber}
      />
      <Field
        label="Email pro"
        name="email"
        type="email"
        value={values.email}
        onChange={(v) => setValues((s) => ({ ...s, email: v }))}
        error={errors.email}
      />
      <Field
        label="Téléphone"
        name="phone"
        value={values.phone}
        onChange={(v) => setValues((s) => ({ ...s, phone: v }))}
        error={errors.phone}
      />
      <div className="sm:col-span-2">
        <Button
          type="submit"
          variant="accent"
          disabled={!dirty || isPending}
          className="h-10 px-5"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-[13px] font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-rose-300" : undefined}
      />
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
    </div>
  );
}
