import type { Metadata } from "next";

import { render } from "@react-email/components";

import { EMAIL_PREVIEWS } from "@/lib/email/previews";

// Page interne de relecture des emails transactionnels (partage client).
// URL volontairement non devinable, non liée depuis le site, noindex.
// À retirer une fois la relecture terminée.
//
// Les apercus passent par iframe srcDoc et non src : les headers de
// securite du site (X-Frame-Options DENY + frame-ancestors 'none')
// interdisent d'embarquer une URL du site, meme same-origin. srcDoc
// n'est pas une navigation, donc pas concerne — et ca evite d'affaiblir
// les headers pour cette page temporaire.

export const metadata: Metadata = {
  title: "Aperçu des emails transactionnels",
  robots: { index: false, follow: false },
};

export default async function ApercuEmailsPage() {
  const previews = await Promise.all(
    EMAIL_PREVIEWS.map(async (p) => ({ ...p, html: await render(p.element) })),
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[720px] px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold">
          Aperçu des emails transactionnels
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Les {previews.length}{" "}
          emails envoyés par la plateforme, rendus avec les vrais templates et
          des données d&apos;exemple fictives. Page interne de relecture — non
          référencée.
        </p>
      </div>
      <main className="grid gap-8 p-6 min-[1440px]:grid-cols-2">
        {previews.map((p) => (
          <article
            key={p.slug}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <header className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">{p.subject}</h2>
              <p className="mt-1.5 text-[13px] text-slate-600">
                <strong>Destinataire&nbsp;:</strong> {p.recipient} ·{" "}
                <strong>Envoyé quand&nbsp;:</strong> {p.trigger} ·{" "}
                <a
                  href={`/apercu-emails-9k4x/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
                >
                  ouvrir seul
                </a>
              </p>
            </header>
            <iframe
              srcDoc={p.html}
              loading="lazy"
              title={p.subject}
              className="h-[720px] w-full border-0 bg-slate-50"
            />
          </article>
        ))}
      </main>
    </div>
  );
}
