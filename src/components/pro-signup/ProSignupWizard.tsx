"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  PaperPlaneTilt,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { cn } from "@/lib/utils";
import {
  checkProSignupIdentity,
  submitProRegistration,
} from "@/server/actions/pro-signup";
import { proSignupSchema, type ProSignupWizardValues } from "@/schemas/pro-signup";

import { ProStep1Identity } from "./steps/ProStep1Identity";
import { ProStep2Trades } from "./steps/ProStep2Trades";
import { ProStep3Zone } from "./steps/ProStep3Zone";
import { ProStep4Confirm } from "./steps/ProStep4Confirm";

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof ProSignupWizardValues>> = [
  [
    "companyName",
    "firstName",
    "lastName",
    "vatNumber",
    "email",
    "phone",
    "postalCode",
    "password",
    "confirmPassword",
  ],
  ["categoryIds"],
  ["zonePostalCode", "radiusKm"],
  ["acceptCgu", "acceptPrivacy", "turnstileToken"],
];

const STEP_TITLES = [
  "Votre entreprise",
  "Vos métiers",
  "Votre zone d'intervention",
  "Vérification & validation",
];

export type Category = { id: string; name: string; slug: string };
export type UniverseWithCategories = {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
};

type Props = { universes: UniverseWithCategories[] };

export function ProSignupWizard({ universes }: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [isSubmitting, startSubmitting] = useSafeTransition();

  const form = useForm<ProSignupWizardValues>({
    resolver: zodResolver(proSignupSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      firstName: "",
      lastName: "",
      vatNumber: "",
      email: "",
      phone: "",
      postalCode: "",
      password: "",
      confirmPassword: "",
      categoryIds: [],
      zonePostalCode: "",
      radiusKm: 30,
      acceptCgu: false,
      acceptPrivacy: false,
      turnstileToken: "",
    },
  });

  // Recopie postalCode dans zonePostalCode tant que ce dernier est vide.
  // useWatch plutôt que form.watch(), que le React Compiler ne sait pas
  // mémoïser (il désactiverait l'optimisation de tout le composant).
  const postalCode = useWatch({ control: form.control, name: "postalCode" });
  const zonePostalCode = useWatch({
    control: form.control,
    name: "zonePostalCode",
  });
  useEffect(() => {
    if (postalCode && !zonePostalCode) {
      form.setValue("zonePostalCode", postalCode);
    }
  }, [postalCode, zonePostalCode, form]);

  function moveTo(target: number) {
    // Toutes les erreurs, pas seulement celles de l'étape cible : aucune
    // erreur résiduelle d'un envoi ou d'une validation précédente.
    form.clearErrors();
    setStep(target);
    // Retour en haut : sur mobile, la position de scroll persisterait au
    // milieu de la nouvelle étape.
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }

  async function goNext() {
    const valid = await form.trigger(
      STEP_FIELDS[step] as (keyof ProSignupWizardValues)[],
    );
    if (!valid) return;
    // Étape 1 : unicité email + TVA vérifiée tout de suite, plutôt qu'au
    // submit final après les trois étapes suivantes.
    if (step === 0) {
      const { email, vatNumber } = form.getValues();
      const check = await checkProSignupIdentity({ email, vatNumber });
      if (!check.ok) {
        if (check.fieldErrors?.email) {
          form.setError("email", { message: check.fieldErrors.email });
        }
        if (check.fieldErrors?.vatNumber) {
          form.setError("vatNumber", { message: check.fieldErrors.vatNumber });
        }
        return;
      }
    }
    moveTo(Math.min(step + 1, STEP_FIELDS.length - 1));
  }
  function goPrev() {
    moveTo(Math.max(step - 1, 0));
  }

  function onSubmit(values: ProSignupWizardValues) {
    startSubmitting(async () => {
      const result = await submitProRegistration(values);
      if (!result.success) {
        if (result.fieldErrors) {
          let firstFieldStep: number | null = null;
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            const msg = msgs?.[0];
            if (!msg) continue;
            form.setError(field as keyof ProSignupWizardValues, {
              message: msg,
            });
            const idx = STEP_FIELDS.findIndex((fs) =>
              fs.includes(field as keyof ProSignupWizardValues),
            );
            if (idx >= 0 && firstFieldStep === null) firstFieldStep = idx;
          }
          if (firstFieldStep !== null) setStep(firstFieldStep);
          return;
        }
        form.setError("root", { message: result.message });
        return;
      }
      router.push("/inscription-pro/en-attente");
    });
  }

  const isLast = step === STEP_FIELDS.length - 1;
  const totalSteps = STEP_FIELDS.length;

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  const allCategories = useMemo(
    () => universes.flatMap((u) => u.categories.map((c) => ({ ...c, universeName: u.name }))),
    [universes],
  );

  // Effet « pile de feuilles » : une ombre portée par étape restante (3 au
  // départ, aucune à la dernière), retirée à chaque étape via une
  // transition CSS sur box-shadow.
  const remainingPages = totalSteps - step - 1;
  const STACK_COLORS = [
    "#f1f5f9", // slate-100
    "#eaeff5", // intermédiaire
    "#e2e8f0", // slate-200
    "#d7dde8", // intermédiaire
    "#cbd5e1", // slate-300
  ];
  const stackShadow =
    Array.from({ length: remainingPages }, (_, i) => {
      const offset = (i + 1) * 3;
      const color = STACK_COLORS[i] ?? STACK_COLORS[STACK_COLORS.length - 1];
      return `${offset}px ${offset}px 0 0 ${color}`;
    }).join(", ") || undefined;

  return (
    <div
      style={{ boxShadow: stackShadow }}
      className="relative flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-[box-shadow] duration-500 ease-out sm:px-6 sm:py-4 lg:px-8 lg:py-5"
    >
    <Form {...form}>
      <form
        onSubmit={(e) => {
          // Entrée sur une étape intermédiaire : goNext, et non handleSubmit
          // qui validerait tout le formulaire et afficherait des erreurs sur
          // les étapes suivantes.
          if (!isLast) {
            e.preventDefault();
            void goNext();
            return;
          }
          void form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-1 flex-col gap-4"
      >
        {/* Barre de progression collée sous le Header public sticky :
            top-[65px] / lg:top-[73px] reprennent sa hauteur et doivent
            suivre toute modification de celui-ci. */}
        <header className="sticky top-[65px] z-30 flex flex-col gap-3 bg-white py-2 lg:top-[73px]">
          <div className="flex items-end gap-3">
            <div
              className="flex flex-1 gap-2"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step + 1}
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
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-full rounded-full transition-colors duration-300",
                        (state === "completed" || state === "active") &&
                          "bg-[#1e3a8a]",
                        state === "pending" && "bg-slate-200",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
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
              {step === 0 && <ProStep1Identity control={form.control} />}
              {step === 1 && (
                <ProStep2Trades
                  universes={universes}
                  control={form.control}
                  setValue={form.setValue}
                  watch={form.watch}
                />
              )}
              {step === 2 && <ProStep3Zone control={form.control} />}
              {step === 3 && (
                <ProStep4Confirm
                  control={form.control}
                  values={form.getValues()}
                  allCategories={allCategories}
                  onTurnstileSuccess={(token) => {
                    // Sans shouldValidate : avec le schéma combiné par
                    // .and(), il revaliderait tout le formulaire et
                    // afficherait les erreurs de consentement trop tôt.
                    form.setValue("turnstileToken", token);
                    form.clearErrors("turnstileToken");
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {form.formState.errors.root && (
          <p className="text-[13px] text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}

        {/* Navigation sticky : reste visible sur une étape longue, sinon
            mt-auto la pousse en bas de la card. */}
        <footer className="sticky bottom-0 z-30 mt-auto flex items-center justify-between gap-3 border-t border-slate-200 bg-white pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                  Soumettre ma candidature
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              onClick={goNext}
              disabled={isSubmitting}
              className="h-[52px] gap-2 px-3 text-[14px] font-semibold sm:px-6 sm:text-[15.5px]"
            >
              Suivant
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Button>
          )}
        </footer>
      </form>
    </Form>
    </div>
  );
}
