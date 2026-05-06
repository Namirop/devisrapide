"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Step1Universe } from "@/components/client-form/steps/Step1Universe";
import { Step2Category } from "@/components/client-form/steps/Step2Category";
import { Step3SubCategory } from "@/components/client-form/steps/Step3SubCategory";
import { Step4DescriptionUrgency } from "@/components/client-form/steps/Step4DescriptionUrgency";
import { Step5Location } from "@/components/client-form/steps/Step5Location";
import { Step6Contact } from "@/components/client-form/steps/Step6Contact";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { validatePostalCode } from "@/server/actions/geocode";
import { createLead } from "@/server/actions/lead";
import {
  createLeadSchema,
  type LeadWizardValues,
} from "@/schemas/lead";
import type { CatalogueTree } from "@/types/catalogue";

type Props = {
  catalogue: CatalogueTree;
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

export function LeadFormWizard({ catalogue }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isValidatingStep, startValidatingStep] = useTransition();

  const form = useForm<LeadWizardValues>({
    resolver: zodResolver(createLeadSchema),
    mode: "onTouched",
    defaultValues: {
      universeId: "",
      categoryId: "",
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
    // Évite l'effet "step suivante déjà rouge" : on efface les erreurs de la
    // destination, qui pouvaient avoir été setées par un handleSubmit antérieur.
    form.clearErrors(STEP_FIELDS[targetStep] as (keyof LeadWizardValues)[]);
    setStep(targetStep);
  }

  function goNext() {
    startValidatingStep(async () => {
      const fields = STEP_FIELDS[step];
      const valid = await form.trigger(fields);
      if (!valid) return;

      // Étape 5 : on vérifie le code postal en direct via BAN avant d'avancer.
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Étape {step + 1} / {STEP_FIELDS.length}
          </p>
          <h1 className="text-2xl font-semibold">{STEP_TITLES[step]}</h1>
        </header>

        <div className="min-h-[280px]">
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
                form.setValue("subCategoryId", id, { shouldValidate: true })
              }
            />
          )}
          {step === 3 && <Step4DescriptionUrgency control={form.control} />}
          {step === 4 && <Step5Location control={form.control} />}
          {step === 5 && <Step6Contact control={form.control} />}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0 || isSubmitting}
          >
            Précédent
          </Button>
          {isLast ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : "Envoyer ma demande"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={isSubmitting || isValidatingStep}
            >
              {isValidatingStep && step === 4 ? "Vérification…" : "Suivant"}
            </Button>
          )}
        </footer>
      </form>
    </Form>
  );
}
