import { notFound } from "next/navigation";

// Cible du rewrite du proxy pour un non-admin sur /admin : notFound() sert
// la 404 standard de Next, avec un vrai statut HTTP 404.
export default function Hidden404Page() {
  notFound();
}
