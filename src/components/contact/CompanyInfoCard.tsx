import {
  Bank,
  Buildings,
  Clock,
  CreditCard,
  EnvelopeSimple,
  MapPin,
  Phone,
} from "@phosphor-icons/react/dist/ssr";

import { BEFlag } from "@/components/ds/BEFlag";
import { CONTACT, COMPANY } from "@/lib/contact";

// Carte d'identite legale — chevauche le bas du ContactHero (-mt negatif)
// pour marquer la transition entre la bande sombre et le reste de la page,
// comme sur la maquette. Un seul container mais 7 infos reelles groupees
// (adresse/pays, BCE/TVA, email/tel/horaires) : legitime au sens
// "contenu avant container" (skill anti-ai-design-patterns).
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[#1e3a8a]">{icon}</span>
      <div>
        <div className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-[17px] text-slate-900">{children}</div>
      </div>
    </div>
  );
}

export function CompanyInfoCard() {
  return (
    <div className="relative mx-auto max-w-[1400px] px-6">
      <div className="relative -mt-14 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:-mt-16 sm:p-8 lg:-mt-20 lg:px-9 lg:py-8">
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-50">
            <Buildings size={28} weight="regular" className="text-[#1e3a8a]" aria-hidden />
          </span>
          <h2 className="font-display text-[25px] font-bold tracking-tight text-slate-900">
            DevisRapide
          </h2>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-6 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:justify-center lg:gap-0 lg:divide-x lg:divide-slate-200">
          <div className="flex flex-col gap-5 lg:pr-12">
            <InfoRow icon={<MapPin size={22} weight="regular" aria-hidden />} label="Adresse du siège social">
              {COMPANY.ADDRESS_LINE1}
              <br />
              {COMPANY.ADDRESS_LINE2}, {COMPANY.COUNTRY}
            </InfoRow>
            <InfoRow icon={<BEFlag className="h-[18px] w-6 rounded-[1px]" />} label="Pays">
              {COMPANY.COUNTRY}
            </InfoRow>
          </div>

          <div className="flex flex-col gap-5 lg:px-12">
            <InfoRow icon={<Bank size={22} weight="regular" aria-hidden />} label="Numéro d'entreprise (BCE)">
              {COMPANY.BCE_NUMBER}
            </InfoRow>
            <InfoRow icon={<CreditCard size={22} weight="regular" aria-hidden />} label="Numéro de TVA">
              {COMPANY.VAT_NUMBER}
            </InfoRow>
          </div>

          <div className="flex flex-col gap-5 lg:pl-12">
            <InfoRow icon={<EnvelopeSimple size={22} weight="regular" aria-hidden />} label="E-mail">
              <a
                href={`mailto:${CONTACT.EMAIL}`}
                className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
              >
                {CONTACT.EMAIL}
              </a>
            </InfoRow>
            <InfoRow icon={<Phone size={22} weight="regular" aria-hidden />} label="Téléphone">
              {CONTACT.PHONE_ENABLED ? (
                <a
                  href={`tel:${CONTACT.PHONE_E164}`}
                  className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
                >
                  {CONTACT.PHONE_DISPLAY}
                </a>
              ) : (
                CONTACT.PHONE_DISPLAY
              )}
            </InfoRow>
            <InfoRow icon={<Clock size={22} weight="regular" aria-hidden />} label="Horaires">
              {CONTACT.HOURS}
            </InfoRow>
          </div>
        </div>
      </div>
    </div>
  );
}
