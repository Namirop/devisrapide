"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Step1Universe } from "@/components/client-form/steps/Step1Universe";
import { Step2Category } from "@/components/client-form/steps/Step2Category";
import { Step3SubCategory } from "@/components/client-form/steps/Step3SubCategory";
import { Step4DescriptionUrgency } from "@/components/client-form/steps/Step4DescriptionUrgency";
import { Step5Location } from "@/components/client-form/steps/Step5Location";
import { Step6Contact } from "@/components/client-form/steps/Step6Contact";
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

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof LeadWizardValues>> = [
  ["universeId"],
  ["categoryId"],
  ["subCategoryId"],
  ["description", "urgency"],
  ["postalCode", "address"],
  ["firstName", "lastName", "email", "phone"],
];

const STEP_TITLES = [
  "Quel univers ?",
  "Quelle catégorie ?",
  "Précisez votre besoin",
  "Décrivez votre projet",
  "Où ?",
  "Vos coordonnées",
];

// Estimation grossiere du temps moyen par etape (secondes). Sert a afficher
// "~Xs restantes" pres de la barre de l'etape 6. Total : 90s sur le wizard.
// Calibre sur l'effort cognitif : 3 clicks (5s), description Textarea (45s),
// postal (10s), 4 inputs contact (20s).
const STEP_DURATIONS_S = [5, 5, 5, 45, 10, 20];

function formatRemainingTime(remainingSeconds: number): string {
  return `~${remainingSeconds} s`;
}

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
    },
  });

  const universeId = form.watch("universeId");
  const categoryId = form.watch("categoryId");

  const selectedUniverse = useMemo(
    () => catalogue.find((u) => u.id === universeId),
    [catalogue, universeId],
  );
  const selectedCategory = useMemo(
    () => selectedUniverse?.categories.find((c) => c.id === categoryId),
    [selectedUniverse, categoryId],
  );

  function moveTo(targetStep: number) {
    form.clearErrors(STEP_FIELDS[targetStep] as (keyof LeadWizardValues)[]);
    setStep(targetStep);
  }

  function goNext() {
    startValidatingStep(async () => {
      const fields = STEP_FIELDS[step];
      const valid = await form.trigger(fields);
      if (!valid) return;

      if (step === 4) {
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
      const result = await createLead(values);
      if (!result.success) {
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
        if (result.code === "SUBCATEGORY_NOT_FOUND") setStep(2);
        return;
      }
      router.push("/demande/confirmation");
    });
  }

  const isLast = step === STEP_FIELDS.length - 1;
  const totalSteps = STEP_FIELDS.length;
  const remainingSeconds = STEP_DURATIONS_S.slice(step).reduce(
    (a, b) => a + b,
    0,
  );

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 pt-6 lg:pt-8"
      >
        {/* TODO: extract to CSS custom property --header-height if Header height changes.
            Header DS is sticky top-0 with h ≈ 76px (Logo 44 + py-4). If that ever
            changes, the sticky top below must follow or the progress bar will be
            silently misaligned. */}
        <header className="sticky top-[76px] z-30 -mx-4 flex flex-col gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-end gap-3">
            <div
              className="flex flex-1 gap-2"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step + 1}
              aria-label={`Étape ${step + 1} sur ${totalSteps}`}
            >
              {Array.from({ length: totalSteps }).map((_, i) => {
                const state =
                  i < step ? "completed" : i === step ? "active" : "pending";
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span
                      className={cn(
                        "flex h-6 items-center justify-center transition-all duration-200",
                        state === "active" &&
                          "text-[17px] font-bold text-slate-900",
                        state === "completed" && "text-[#1e3a8a]",
                        state === "pending" && "text-[13px] text-slate-400",
                      )}
                    >
                      {state === "completed" ? (
                        <Check
                          className="h-4 w-4"
                          strokeWidth={2.75}
                          aria-hidden
                        />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-full rounded-full transition-colors duration-300",
                        state === "completed" && "bg-[#1e3a8a]",
                        state === "active" && "bg-[#1e3a8a]",
                        state === "pending" && "bg-slate-200",
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <p className="shrink-0 whitespace-nowrap pb-2 text-[12px] text-slate-400">
              {formatRemainingTime(remainingSeconds)}
            </p>
          </div>
        </header>

        <h1 className="mt-6 text-[26px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          {STEP_TITLES[step]}
        </h1>

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
                <Step1Universe
                  control={form.control}
                  universes={catalogue}
                  onPick={(id) => {
                    if (form.getValues("universeId") !== id) {
                      form.setValue("categoryId", "");
                      form.setValue("subCategoryId", "");
                    }
                    form.setValue("universeId", id, { shouldValidate: true });
                  }}
                />
              )}
              {step === 1 && selectedUniverse && (
                <Step2Category
                  control={form.control}
                  categories={selectedUniverse.categories}
                  onPick={(id) => {
                    if (form.getValues("categoryId") !== id) {
                      form.setValue("subCategoryId", "");
                    }
                    form.setValue("categoryId", id, { shouldValidate: true });
                  }}
                />
              )}
              {step === 2 && selectedCategory && (
                <Step3SubCategory
                  control={form.control}
                  subCategories={selectedCategory.subCategories}
                  onPick={(id) =>
                    form.setValue("subCategoryId", id, {
                      shouldValidate: true,
                    })
                  }
                />
              )}
              {step === 3 && (
                <Step4DescriptionUrgency control={form.control} />
              )}
              {step === 4 && <Step5Location control={form.control} />}
              {step === 5 && <Step6Contact control={form.control} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="mt-0 flex items-center justify-between gap-3 border-t-2 border-slate-300 py-6">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0 || isSubmitting}
            className="h-[52px] gap-2 px-5 text-[15.5px]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Précédent
          </Button>
          {isLast ? (
            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting}
              className="h-[52px] gap-2 px-6 text-[15.5px] font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  Envoi…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Envoyer ma demande
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              onClick={goNext}
              disabled={isSubmitting || isValidatingStep}
              className="h-[52px] gap- px-6 text-[15.5px] font-semibold"
            >
              {isValidatingStep ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {step === 4 ? "Vérification…" : "…"}
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                </>
              )}
            </Button>
          )}
        </footer>
      </form>
    </Form>
  );
}
