import { describe, expect, it } from "vitest";

import { computeAssignmentPrice, computeLeadBasePrice } from "./pricing";

describe("computeLeadBasePrice", () => {
  it("appliquer le coefficient URGENT (+30%)", () => {
    const result = computeLeadBasePrice({
      sharedPriceCents: 2500,
      exclusivePriceCents: 6250,
      urgency: "URGENT",
    });
    expect(result.sharedCents).toBe(3250);
    expect(result.exclusiveCents).toBe(8125);
  });

  it("appliquer le coefficient SOON (+10%)", () => {
    const result = computeLeadBasePrice({
      sharedPriceCents: 2000,
      exclusivePriceCents: 5000,
      urgency: "SOON",
    });
    expect(result.sharedCents).toBe(2200);
    expect(result.exclusiveCents).toBe(5500);
  });

  it("laisser le prix inchange pour PLANNED", () => {
    const result = computeLeadBasePrice({
      sharedPriceCents: 3500,
      exclusivePriceCents: 8750,
      urgency: "PLANNED",
    });
    expect(result.sharedCents).toBe(3500);
    expect(result.exclusiveCents).toBe(8750);
  });

  it("appliquer le coefficient FLEXIBLE (-10%)", () => {
    const result = computeLeadBasePrice({
      sharedPriceCents: 2000,
      exclusivePriceCents: 5000,
      urgency: "FLEXIBLE",
    });
    expect(result.sharedCents).toBe(1800);
    expect(result.exclusiveCents).toBe(4500);
  });

  it("arrondir avec Math.round (banker's rounding selon JS spec)", () => {
    // 2500 * 1.1 = 2750.0000000000005 (precision floating point)
    // Math.round renvoie 2750, OK
    const result = computeLeadBasePrice({
      sharedPriceCents: 2500,
      exclusivePriceCents: 6250,
      urgency: "SOON",
    });
    expect(result.sharedCents).toBe(2750);
  });
});

describe("computeAssignmentPrice", () => {
  it("retourner le prix shared si !isExclusive", () => {
    const price = computeAssignmentPrice({
      lead: {
        sharedLeadPriceCentsSnapshot: 3250,
        exclusiveLeadPriceCentsSnapshot: 8125,
      },
      isExclusive: false,
    });
    expect(price).toBe(3250);
  });

  it("retourner le prix exclusive si isExclusive", () => {
    const price = computeAssignmentPrice({
      lead: {
        sharedLeadPriceCentsSnapshot: 3250,
        exclusiveLeadPriceCentsSnapshot: 8125,
      },
      isExclusive: true,
    });
    expect(price).toBe(8125);
  });
});
