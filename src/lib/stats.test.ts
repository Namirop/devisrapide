import { describe, expect, it } from "vitest";

import {
  computeDeltaPercent,
  formatDeltaLabel,
  formatPriceCents,
} from "./stats";

describe("computeDeltaPercent", () => {
  it('retourner { kind: "none" } quand current=0 ET previous=0', () => {
    expect(computeDeltaPercent(0, 0)).toEqual({ kind: "none" });
  });

  it('retourner { kind: "new" } quand previous=0 ET current>0', () => {
    expect(computeDeltaPercent(5, 0)).toEqual({ kind: "new" });
    expect(computeDeltaPercent(100, 0)).toEqual({ kind: "new" });
  });

  it("calculer un delta positif", () => {
    expect(computeDeltaPercent(120, 100)).toEqual({ kind: "delta", value: 20 });
  });

  it("calculer un delta negatif", () => {
    expect(computeDeltaPercent(80, 100)).toEqual({ kind: "delta", value: -20 });
  });

  it("arrondir le delta a l'entier", () => {
    // (133 - 100) / 100 * 100 = 33%
    expect(computeDeltaPercent(133, 100)).toEqual({ kind: "delta", value: 33 });
    // (105 - 100) / 100 * 100 = 5%
    expect(computeDeltaPercent(105, 100)).toEqual({ kind: "delta", value: 5 });
  });

  it("retourner delta -100 si current=0 ET previous>0", () => {
    // Cas distinct du "none" : on a eu de l'activite, on n'en a plus.
    expect(computeDeltaPercent(0, 50)).toEqual({
      kind: "delta",
      value: -100,
    });
  });
});

describe("formatDeltaLabel", () => {
  it('formater { kind: "new" } en "Nouveau"', () => {
    expect(formatDeltaLabel({ kind: "new" })).toBe("Nouveau");
  });

  it('formater { kind: "none" } en em-dash', () => {
    expect(formatDeltaLabel({ kind: "none" })).toBe("—");
  });

  it("formater un delta positif avec prefixe +", () => {
    expect(formatDeltaLabel({ kind: "delta", value: 20 })).toBe("+20%");
    expect(formatDeltaLabel({ kind: "delta", value: 0 })).toBe("+0%");
  });

  it("formater un delta negatif sans prefixe", () => {
    expect(formatDeltaLabel({ kind: "delta", value: -20 })).toBe("-20%");
  });
});

describe("formatPriceCents", () => {
  it("formater 3250 en '32,50 €'", () => {
    const result = formatPriceCents(3250);
    expect(result).toContain("32,50");
    expect(result).toContain("€");
  });

  it("formater 100000 en '1 000,00 €' (separateur milliers)", () => {
    const result = formatPriceCents(100000);
    expect(result).toContain("1");
    expect(result).toContain("000,00");
  });

  it("formater 0 en '0,00 €'", () => {
    expect(formatPriceCents(0)).toContain("0,00");
  });
});
