import { notFound } from "next/navigation";

// Cible du `rewrite` du middleware quand un visiteur non admin tente d'acceder
// a /admin. On appelle notFound() pour servir la 404 standard de Next.
export default function Hidden404Page() {
  notFound();
}
