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

  // Pre-remplit zonePostalCode depuis postalCode au passage Step 1 -> 2 si
  // zonePostalCode est vide (l'utilisateur peut surcharger).
  // useWatch au lieu de form.watch() : memoize-able par le React Compiler
  // (form.watch() est flag "incompatible library", skip la memoization
  // du composant entier).
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
    // Clear toutes les erreurs (pas seulement celles du target step) pour
    // garantir que l'utilisateur n'arrive jamais sur un step avec des
    // erreurs residuelles d'une tentative de submit anterieure ou d'un
    // form.trigger sur un autre step.
    form.clearErrors();
    setStep(target);
    // UX : remonte en haut au changement de step. Sinon sur mobile (ecrans
    // longs) l'utilisateur peut atterrir au milieu du nouveau step car la
    // position de scroll persiste. Respect prefers-reduced-motion via le
    // hook framer-motion deja en scope.
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
    // Step 1 (identite) : pre-check unicite email + VAT avant d'autoriser
    // la transition. Sinon l'utilisateur se prend l'erreur EMAIL_TAKEN
    // au submit final apres avoir rempli 3 etapes pour rien.
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

  // Effet "stack of papers" via box-shadow stackees, identique au pattern
  // /demande. N = remainingPages clamp 0..3 (les 4 steps font 3 ghosts
  // max au depart, 0 au dernier). Chaque transition retire une couche
  // → animation visible CSS pure (transition-shadow) qui bypasse l'OS
  // reduce-motion. Couleurs slate-100 → slate-300 avec interpolations
  // pour un degrade doux entre les bandes.
  const remainingPages = totalSteps - step - 1;
  const STACK_COLORS = [
    "#f1f5f9", // slate-100
    "#eaeff5", // interpolated
    "#e2e8f0", // slate-200
    "#d7dde8", // interpolated
    "#cbd5e1", // slate-300
  ];
  const stackShadow =
    Array.from({ length: remainingPages }, (_, i) => {
      const offset = (i + 1) * 3;
      const color = STACK_COLORS[i] ?? STACK_COLORS[STACK_COLORS.length - 1];
      return `${offset}px ${offset}px 0 0 ${color}`;
    }).join(", ") || undefined;

  return (
    // Card unique qui porte le wizard, plus les box-shadow stackees en
    // arriere-plan pour la metaphore "papiers empiles". Voir /demande
    // wizard pour le pattern source.
    <div
      style={{ boxShadow: stackShadow }}
      className="relative flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-[box-shadow] duration-500 ease-out sm:px-6 sm:py-4 lg:px-8 lg:py-5"
    >
    <Form {...form}>
      <form
        onSubmit={(e) => {
          // Intercept Enter-key implicit submission : sur les steps
          // intermediaires, on route vers goNext plutot que vers le
          // handleSubmit complet (qui validerait TOUS les champs et
          // collerait des erreurs persistantes sur les steps suivants).
          if (!isLast) {
            e.preventDefault();
            void goNext();
            return;
          }
          void form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-1 flex-col gap-4"
      >
        {/* Pattern /demande : progress bar sticky sous la Header DS. Hauteur
            reelle du Header : mobile = Logo 40 + py-3 + border = 65px,
            desktop = py-4 = 73px. Si le Header change un jour, garder ce
            sticky top aligne. Pas de negative margin (vit dans la card
            englobante). */}
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
                    // setValue sans shouldValidate : avec un schema Zod
                    // combine via .and(), shouldValidate: true re-valide
                    // l'integralite du form et setError sur acceptCgu /
                    // acceptPrivacy avant que l'utilisateur ait touche
                    // quoi que ce soit. On clear juste l'erreur locale
                    // sur turnstileToken si elle existait.
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

        {/* Nav buttons sticky en bas (collent au viewport pendant le scroll
            quand le step est long, sinon mt-auto les pousse en bas de card). */}
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
