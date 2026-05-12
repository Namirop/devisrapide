# DevisRapide — V2 Roadmap

Ce fichier track tout ce qui est connu, identifié, mais **hors périmètre MVP**.
Repris au Sprint 5+ (polish) ou en V2.

## Dette technique / polish (Sprint 5+)

- [ ] `<img>` Hero landing → migrer vers `next/image` (impact LCP, gain Lighthouse perf)
- [ ] React Compiler warning sur `form.watch()` dans `LeadFormWizard` → investiguer migration vers `useWatch` ciblé (lecture sélective des fields plutôt que watch global)
- [ ] `FormMessage` shadcn → ajouter icône `AlertCircle` lucide en préfixe conditionnel (TODO laissé dans `src/components/ui/form.tsx`)
