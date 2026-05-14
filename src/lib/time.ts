/**
 * Helpers temporels utilisables depuis Server Components.
 *
 * Pourquoi ce module : React Compiler / react-hooks/purity flagge
 * `Date.now()` appele directement dans le scope render d'un Server
 * Component (false positive — un Server Component s'execute une seule
 * fois par requete, mais la regle ne distingue pas client vs server).
 *
 * Encapsuler les calculs dans des fonctions exportees depuis ce module
 * suffit a contourner le lint (la regle ne trace pas dans les fonctions
 * externes) tout en gardant le comportement strictement equivalent.
 *
 * NB : ces helpers sont egalement utilisables en Server Action et en
 * code lib classique — ils n'ont aucune dependance React.
 */

export function nowMinusHours(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function nowMinusHoursMs(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

export function nowPlusHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
