import { notFound } from "next/navigation";

// Cible du `rewrite` du proxy quand un visiteur non admin tente d'acceder
// a /admin. On appelle notFound() pour servir la 404 standard de Next
// (status HTTP 404, pas 200).
export default function Hidden404Page() {
  notFound();
}
