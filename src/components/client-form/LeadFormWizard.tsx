"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleNotch,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Step1Project } from "@/components/client-form/steps/Step1Project";
import { Step2Info } from "@/components/client-form/steps/Step2Info";
import { Step3Contact } from "@/components/client-form/steps/Step3Contact";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { validatePostalCode } from "@/server/actions/geocode";
import { createLead } from "@/server/actions/lead";
import { createLeadSchema, type LeadWizardValues } from "@/schemas/lead";
import type { CatalogueTree } from "@/types/catalogue";

type Props = {
  catalogue: CatalogueTree;
  initialUniverseId?: string | null;
  initialCategoryId?: string | null;
};

// Sprint E : tunnel condensé de 6 → 3 étapes (maquettes Kamel).
//  0. Projet  : univers + catégorie + sous-besoins (multi-checkbox).
//  1. Infos   : description + urgence + code postal + adresse.
//  2. Contact : coordonnées + Turnstile.
const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof LeadWizardValues>> = [
  ["universeId", "categoryId", "subCategoryId"],
  ["description", "urgency", "postalCode", "address"],
  ["firstName", "lastName", "email", "phone", "turnstileToken"],
];

// Stepper (timeline en haut, hors card) — libellés maquette.
const STEPPER_STEPS = [
  { title: "Votre projet", subtitle: "Sélectionnez vos besoins" },
  { title: "Vos informations", subtitle: "Décrivez votre projet" },
  { title: "Confirmation", subtitle: "Vos coordonnées" },
];

// Titre + sous-titre dans la card, par étape.
const CARD_TITLES = [
  "Quels sont vos besoins ?",
  "Décrivez votre projet",
  "Recevez vos devis gratuits",
];
const CARD_SUBTITLES = [
  "Sélectionnez un ou plusieurs besoins correspondant à votre projet.",
  "Donnez un maximum de détails et indiquez le délai souhaité.",
  "Complétez vos coordonnées pour être contacté par les professionnels de votre région.",
];

const DESCRIPTION_MAX = 2000;

export function LeadFormWizard({
  catalogue,
  initialUniverseId = null,
  initialCategoryId = null,
}: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isValidatingStep, startValidatingStep] = useTransition();

  const [selectedSubNeeds, setSelectedSubNeeds] = useState<
    { id: string; name: string }[]
  >([]);

  const form = useForm<LeadWizardValues>({
    resolver: zodResolver(createLeadSchema),
    mode: "onTouched",
    defaultValues: {
      universeId: initialUniverseId ?? "",
      categoryId: initialCategoryId ?? "",
      subCategoryId: "",
      description: "",
      urgency: "PLANNED",
      postalCode: "",
      address: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      turnstileToken: "",
    },
  });

  const universeId = useWatch({ control: form.control, name: "universeId" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });

  // ── Sélection projet (étape 1) ──────────────────────────────
  function selectUniverse(id: string) {
    if (form.getValues("universeId") !== id) {
      form.setValue("categoryId", "");
      form.setValue("subCategoryId", "");
      setSelectedSubNeeds([]);
    }
    form.setValue("universeId", id, { shouldValidate: true });
  }

  function toggleSubNeed(
    nextUniverseId: string,
    nextCategoryId: string,
    subCat: { id: string; name: string },
  ) {
    const activeCategoryId = form.getValues("categoryId");
    if (selectedSubNeeds.length > 0 && activeCategoryId !== nextCategoryId) {
      return;
    }
    const exists = selectedSubNeeds.some((s) => s.id === subCat.id);
    const next = exists
      ? selectedSubNeeds.filter((s) => s.id !== subCat.id)
      : [...selectedSubNeeds, subCat];
    setSelectedSubNeeds(next);

    if (next.length === 0) {
      form.setValue("categoryId", "", { shouldValidate: true });
      form.setValue("subCategoryId", "", { shouldValidate: true });
    } else {
      form.setValue("universeId", nextUniverseId, { shouldValidate: true });
      form.setValue("categoryId", nextCategoryId, { shouldValidate: true });
      form.setValue("subCategoryId", next[0].id, { shouldValidate: true });
    }
  }

  function resetSelection() {
    setSelectedSubNeeds([]);
    form.setValue("categoryId", "", { shouldValidate: true });
    form.setValue("subCategoryId", "", { shouldValidate: true });
  }

  function selectNotListed() {
    const autre = catalogue.find((u) => u.slug === "autre");
    const cat = autre?.categories[0];
    const sub = cat?.subCategories[0];
    if (!autre || !cat || !sub) return;
    form.setValue("universeId", autre.id, { shouldValidate: true });
    form.setValue("categoryId", cat.id, { shouldValidate: true });
    form.setValue("subCategoryId", sub.id, { shouldValidate: true });
    setSelectedSubNeeds([{ id: sub.id, name: sub.name }]);
  }

  // Préfixe injecté en tête de description (cf. createLead) — réduit le quota
  // saisissable pour garantir description composée ≤ 2000 (Zod serveur).
  const descriptionPrefix =
    selectedSubNeeds.length > 0
      ? `Besoins identifiés : ${selectedSubNeeds
          .map((s) => s.name)
          .join(", ")}\n\n`
      : "";
  const descriptionMaxLength = DESCRIPTION_MAX - descriptionPrefix.length;

  function moveTo(targetStep: number) {
    form.clearErrors(STEP_FIELDS[targetStep] as (keyof LeadWizardValues)[]);
    setStep(targetStep);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function goNext() {
    startValidatingStep(async () => {
      const fields = STEP_FIELDS[step];
      const valid = await form.trigger(fields);
      if (!valid) return;
      if (step === 1) {
        const postalCode = form.getValues("postalCode");
        const res = await validatePostalCode(postalCode);
        if (!res.valid) {
          form.setError("postalCode", { message: res.message });
          return;
        }
      }
      moveTo(Math.min(step + 1, STEP_FIELDS.length - 1));
    });
  }

  function goPrev() {
    moveTo(Math.max(step - 1, 0));
  }

  function onSubmit(values: LeadWizardValues) {
    startSubmitting(async () => {
      const description = descriptionPrefix
        ? `${descriptionPrefix}${values.description}`
        : values.description;
      const result = await createLead({ ...values, description });
      if (!result.success) {
        if (result.code === "TURNSTILE_FAILED") {
          form.setValue("turnstileToken", "");
          toast.error(result.message);
          return;
        }
        if (result.fieldErrors) {
          let firstFieldStep: number | null = null;
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            const msg = msgs?.[0];
            if (!msg) continue;
            form.setError(field as keyof LeadWizardValues, { message: msg });
            const stepIdx = STEP_FIELDS.findIndex((fs) =>
              fs.includes(field as keyof LeadWizardValues),
            );
            if (stepIdx >= 0 && firstFieldStep === null) {
              firstFieldStep = stepIdx;
            }
          }
          if (firstFieldStep !== null) setStep(firstFieldStep);
          return;
        }
        toast.error(result.message);
        if (result.code === "SUBCATEGORY_NOT_FOUND") setStep(0);
        return;
      }
      router.push("/demande/confirmation");
    });
  }

  const isLast = step === STEP_FIELDS.length - 1;
  const totalSteps = STEP_FIELDS.length;
  const canProceed = step !== 0 || selectedSubNeeds.length > 0;

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* ── Timeline (hors card, en haut) ── */}
      <nav aria-label="Progression du formulaire">
        <ol
          className="flex items-start"
          role="list"
          aria-label={`Étape ${step + 1} sur ${totalSteps}`}
        >
          {STEPPER_STEPS.map((s, i) => {
            const state =
              i < step ? "completed" : i === step ? "active" : "pending";
            return (
              <li key={s.title} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === 0
                        ? "invisible"
                        : i <= step
                          ? "bg-[#1e3a8a]"
                          : "bg-slate-200",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors duration-200",
                      state === "pending"
                        ? "border border-slate-300 bg-white text-slate-400"
                        : "bg-[#1e3a8a] text-white",
                    )}
                  >
                    {state === "completed" ? (
                      <Check size={15} weight="bold" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === totalSteps - 1
                        ? "invisible"
                        : i < step
                          ? "bg-[#1e3a8a]"
                          : "bg-slate-200",
                    )}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-[13px] font-semibold leading-tight",
                      state === "pending" ? "text-slate-400" : "text-slate-900",
                    )}
                  >
                    {s.title}
                  </div>
                  <div className="mt-0.5 hidden text-[11.5px] text-slate-500 sm:block">
                    {s.subtitle}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── Card du formulaire ── */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8"
        >
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
              {CARD_TITLES[step]}
            </h1>
            <p className="mt-1 text-[14px] text-slate-500 lg:text-[15px]">
              {CARD_SUBTITLES[step]}
            </p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={transition}
              >
                {step === 0 && (
                  <Step1Project
                    universes={catalogue}
                    activeUniverseId={universeId}
                    activeCategoryId={categoryId}
                    selectedSubNeedIds={selectedSubNeeds.map((s) => s.id)}
                    onSelectUniverse={selectUniverse}
                    onToggleSubNeed={toggleSubNeed}
                    onResetSelection={resetSelection}
                    onSelectNotListed={selectNotListed}
                  />
                )}
                {step === 1 && (
                  <Step2Info
                    control={form.control}
                    descriptionMaxLength={descriptionMaxLength}
                  />
                )}
                {step === 2 && (
                  <Step3Contact
                    control={form.control}
                    onTurnstileSuccess={(token) =>
                      form.setValue("turnstileToken", token, {
                        shouldValidate: true,
                      })
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="sticky bottom-0 z-30 mt-auto -mx-5 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={step === 0 || isSubmitting}
              aria-label="Précédent"
              className="h-[52px] gap-2 px-3 text-[14px] sm:px-5 sm:text-[15.5px]"
            >
              <ArrowLeft size={16} weight="bold" aria-hidden />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            {isLast ? (
              <Button
                type="submit"
                variant="accent"
                disabled={isSubmitting}
                className="h-[52px] gap-2 px-3 text-[14px] font-semibold sm:px-6 sm:text-[15.5px]"
              >
                {isSubmitting ? (
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
                  <>
                    <PaperPlaneTilt size={16} weight="regular" aria-hidden />
                    Recevoir mes devis gratuits
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="accent"
                onClick={goNext}
                disabled={isSubmitting || isValidatingStep || !canProceed}
                className="h-[52px] gap-2 px-3 text-[14px] font-semibold sm:px-6 sm:text-[15.5px]"
              >
                {isValidatingStep ? (
                  <>
                    <CircleNotch
                      size={16}
                      weight="bold"
                      className="animate-spin"
                      aria-hidden
                    />
                    {step === 1 ? "Vérification…" : "…"}
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight size={16} weight="bold" aria-hidden />
                  </>
                )}
              </Button>
            )}
          </footer>
        </form>
      </Form>
    </div>
  );
}
