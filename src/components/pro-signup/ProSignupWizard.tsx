"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { submitProRegistration } from "@/server/actions/pro-signup";
import type { ProSignupWizardValues } from "@/schemas/pro-signup";

import { ProStep1Identity } from "./steps/ProStep1Identity";
import { ProStep2Trades } from "./steps/ProStep2Trades";
import { ProStep3Zone } from "./steps/ProStep3Zone";
import { ProStep4Confirm } from "./steps/ProStep4Confirm";

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof ProSignupWizardValues>> = [
  [
    "companyName",
    "vatNumber",
    "email",
    "phone",
    "postalCode",
    "password",
    "confirmPassword",
  ],
  ["categoryIds"],
  ["zonePostalCode", "radiusKm"],
  ["acceptCgu", "acceptPrivacy"],
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
  const [isSubmitting, startSubmitting] = useTransition();

  const form = useForm<ProSignupWizardValues>({
    mode: "onTouched",
    defaultValues: {
      companyName: "",
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
    },
  });

  // Pre-remplit zonePostalCode depuis postalCode au passage Step 1 -> 2 si
  // zonePostalCode est vide (l'utilisateur peut surcharger).
  const postalCode = form.watch("postalCode");
  const zonePostalCode = form.watch("zonePostalCode");
  useEffect(() => {
    if (postalCode && !zonePostalCode) {
      form.setValue("zonePostalCode", postalCode);
    }
  }, [postalCode, zonePostalCode, form]);

  function moveTo(target: number) {
    form.clearErrors(STEP_FIELDS[target] as (keyof ProSignupWizardValues)[]);
    setStep(target);
  }

  async function goNext() {
    const valid = await form.trigger(
      STEP_FIELDS[step] as (keyof ProSignupWizardValues)[],
    );
    if (!valid) return;
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

  // Bloque le scroll page (meme pattern que LeadFormWizard).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
    };
    html.style.overflow = "hidden";
    html.style.height = "100vh";
    body.style.overflow = "hidden";
    body.style.height = "100vh";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
    };
  }, []);

  const allCategories = useMemo(
    () => universes.flatMap((u) => u.categories.map((c) => ({ ...c, universeName: u.name }))),
    [universes],
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-6"
      >
        <header className="flex flex-col gap-3">
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
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
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
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
            {STEP_TITLES[step]}
          </h1>
        </header>

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="scrollbar-hide absolute inset-0 overflow-y-auto pb-10"
          >
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
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="text-[13px] text-rose-600">
            {form.formState.errors.root.message}
          </p>
        )}

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
              className="h-[52px] gap-2 px-6 text-[15.5px] font-semibold"
            >
              Suivant
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Button>
          )}
        </footer>
      </form>
    </Form>
  );
}
