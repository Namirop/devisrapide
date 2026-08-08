import { describe, expect, it } from "vitest";

import { maskContactDetails } from "./mask-contact";

describe("maskContactDetails", () => {
  describe("masque ce qui permet de joindre le client sans payer", () => {
    it.each([
      ["0470123456", "GSM colle"],
      ["0470 12 34 56", "GSM espace"],
      ["0470.12.34.56", "GSM points"],
      ["02/123.45.67", "fixe avec slash"],
      ["+32 470 12 34 56", "international espace"],
      ["+32470123456", "international colle"],
      ["0032 470 123 456", "international 00"],
    ])("%s (%s)", (phone) => {
      const masked = maskContactDetails(`Rappelez-moi au ${phone} svp`);
      expect(masked).not.toContain(phone);
      expect(masked).toContain("[coordonnées masquées]");
    });

    it("masque une adresse email", () => {
      expect(maskContactDetails("ecrivez a jean.dupont@example.be")).toBe(
        "ecrivez a [coordonnées masquées]",
      );
    });

    it("masque plusieurs occurrences dans le meme texte", () => {
      const masked = maskContactDetails(
        "Tel 0470123456 ou mail jean@example.be ou 02 123 45 67",
      );
      expect(masked).not.toMatch(/\d{4}/);
      expect(masked).not.toContain("@");
    });
  });

  describe("laisse la description du chantier lisible", () => {
    it("garde une surface et un budget", () => {
      const text = "Toiture de 120 m2, budget 15000 euros, 3 fenetres.";
      expect(maskContactDetails(text)).toBe(text);
    });

    it("garde une date d'intervention (8 chiffres, sous le seuil)", () => {
      const text = "Disponible le 12/03/2026 apres-midi.";
      expect(maskContactDetails(text)).toBe(text);
    });

    it("garde un code postal et une annee", () => {
      const text = "Maison de 1975 a 5000 Namur.";
      expect(maskContactDetails(text)).toBe(text);
    });

    it("ne colle pas des nombres separes par du texte", () => {
      const text = "12 chassis, 34 metres de gouttiere, 56 tuiles.";
      expect(maskContactDetails(text)).toBe(text);
    });

    it("renvoie le texte tel quel quand il n'y a rien a masquer", () => {
      const text = "Remplacement de la chaudiere au gaz, urgent.";
      expect(maskContactDetails(text)).toBe(text);
    });
  });
});
