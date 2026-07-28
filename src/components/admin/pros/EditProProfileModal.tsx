"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { updateProProfileAdmin } from "@/server/actions/admin-pro-update";

type Props = {
  proProfileId: string;
  initial: {
    companyName: string;
    vatNumber: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    interventionRadiusKm: number;
    autoAccept: boolean;
  };
};

/**
 * Modal admin "Modifier le profil pro". V1 : champs editables limites
 * (companyName, vatNumber, email, phone, firstName, lastName,
 * interventionRadiusKm, autoAccept). Geoloc (postal/ville/lat/lng)
 * exclue car changement de zone necessite un re-geocode V2.
 *
 * Form basic : pre-rempli avec les valeurs actuelles passees en props,
 * submit envoie l'ensemble à updateProProfileAdmin (cote serveur,
 * seuls les champs MODIFIES sont detectes via diff vs initial puis
 * appliques).
 */
export function EditProProfileModal({ proProfileId, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useSafeTransition();

  function handleSubmit() {
    // Construit le payload diff : on n'envoie que les champs modifies.
    const diff: Record<string, string | number | boolean> = {};
    if (form.companyName !== initial.companyName) diff.companyName = form.companyName;
    if (form.vatNumber !== initial.vatNumber) diff.vatNumber = form.vatNumber;
    if (form.email !== initial.email) diff.email = form.email;
    if (form.phone !== initial.phone) diff.phone = form.phone;
    if (form.firstName !== initial.firstName) diff.firstName = form.firstName;
    if (form.lastName !== initial.lastName) diff.lastName = form.lastName;
    if (form.interventionRadiusKm !== initial.interventionRadiusKm)
      diff.interventionRadiusKm = form.interventionRadiusKm;
    if (form.autoAccept !== initial.autoAccept) diff.autoAccept = form.autoAccept;

    if (Object.keys(diff).length === 0) {
      toast.info("Aucune modification");
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateProProfileAdmin({
        proProfileId,
        ...diff,
      });
      if (!result.success) {
        toast.error("Modification impossible", { description: result.message });
        return;
      }
      toast.success("Profil mis à jour");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50">
        <PencilSimple size={14} weight="regular" aria-hidden />
        Modifier le profil
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            Modifier le profil pro
          </DialogTitle>
          <DialogDescription>
            Override admin. Seuls les champs modifiés seront appliqués.
            Géolocalisation (code postal/ville/coordonnées) exclue V1.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Nom commercial"
            value={form.companyName}
            onChange={(v) => setForm({ ...form, companyName: v })}
          />
          <Field
            label="Numéro TVA"
            value={form.vatNumber}
            onChange={(v) => setForm({ ...form, vatNumber: v })}
            mono
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />
          <Field
            label="Téléphone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            type="tel"
          />
          <Field
            label="Prénom"
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <Field
            label="Nom"
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              Rayon (km)
            </label>
            <select
              value={form.interventionRadiusKm}
              onChange={(e) =>
                setForm({ ...form, interventionRadiusKm: Number(e.target.value) })
              }
              className="h-[40px] rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            >
              <option value={30}>30 km</option>
              <option value={60}>60 km</option>
              <option value={-1}>Toute la Belgique francophone</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.autoAccept}
                onChange={(e) =>
                  setForm({ ...form, autoAccept: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
              Auto-accept activé
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose
            disabled={pending}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="gap-2 bg-[#1e3a8a] text-white hover:bg-[#1a3175]"
          >
            {pending ? (
              <CircleNotch
                size={14}
                weight="bold"
                className="animate-spin"
                aria-hidden
              />
            ) : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[40px] rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      />
    </div>
  );
}
