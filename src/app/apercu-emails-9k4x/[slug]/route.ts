import { render } from "@react-email/components";

import { EMAIL_PREVIEWS } from "@/lib/email/previews";

// Sert le HTML d'un email de relecture (iframes et liens "ouvrir seul" de
// la page d'aperçu). Même moteur de rendu que l'envoi réel (sender.ts).

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const preview = EMAIL_PREVIEWS.find((p) => p.slug === slug);
  if (!preview) {
    return new Response("Not found", { status: 404 });
  }

  const html = await render(preview.element);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
