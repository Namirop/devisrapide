import { describe, expect, it } from "vitest";

import {
  VAT_RATE_BE,
  calculateTTC,
  formatAmountBE,
  normalizeVatBE,
  vatBeRegex,
} from "./finance";

describe("calculateTTC", () => {
  it("appliquer le taux TVA BE 21%", () => {
    expect(calculateTTC(1000)).toBe(1210); // 10€ HT -> 12,10€ TTC en centimes
    expect(calculateTTC(100)).toBe(121);
    expect(calculateTTC(0)).toBe(0);
  });

  it("arrondir au plus proche", () => {
    // 100 * 1.21 = 121 (pas d'arrondi)
    // 99 * 1.21 = 119.79 -> arrondi a 120
    expect(calculateTTC(99)).toBe(120);
  });

  it("VAT_RATE_BE = 0.21", () => {
    expect(VAT_RATE_BE).toBe(0.21);
  });
});

describe("formatAmountBE", () => {
  it("formater 1234.56 en string avec virgule decimale fr-BE", () => {
    // Intl.NumberFormat fr-BE -> "12,35 €" (non-breaking space)
    const result = formatAmountBE(1235);
    expect(result).toContain("12,35");
    expect(result).toContain("€");
  });

  it("formater 0 en '0,00 €'", () => {
    const result = formatAmountBE(0);
    expect(result).toContain("0,00");
  });

  it("formater 100000 (1000€) avec separateur de milliers", () => {
    const result = formatAmountBE(100000);
    expect(result).toContain("1");
    expect(result).toContain("000,00");
  });
});

describe("vatBeRegex", () => {
  it("valider BE0123456789", () => {
    expect(vatBeRegex.test("BE0123456789")).toBe(true);
  });

  it("rejeter formats incorrects", () => {
    expect(vatBeRegex.test("FR12345678901")).toBe(false); // mauvais prefixe
    expect(vatBeRegex.test("BE012345678")).toBe(false); // 9 chiffres
    expect(vatBeRegex.test("BE01234567890")).toBe(false); // 11 chiffres
    expect(vatBeRegex.test("be0123456789")).toBe(false); // minuscule
    expect(vatBeRegex.test("BE 0123 456 789")).toBe(false); // espaces (necessite normalize)
  });
});

describe("normalizeVatBE", () => {
  it("preserver une saisie deja normalisee", () => {
    expect(normalizeVatBE("BE0123456789")).toBe("BE0123456789");
  });

  it("retirer espaces, points, tirets, underscores", () => {
    expect(normalizeVatBE("BE 0123 456 789")).toBe("BE0123456789");
    expect(normalizeVatBE("BE.0123.456.789")).toBe("BE0123456789");
    expect(normalizeVatBE("BE-0123-456-789")).toBe("BE0123456789");
  });

  it("ajouter le prefixe BE si juste 10 chiffres", () => {
    expect(normalizeVatBE("0123456789")).toBe("BE0123456789");
  });

  it("uppercase les caracteres", () => {
    expect(normalizeVatBE("be0123456789")).toBe("BE0123456789");
  });
});
