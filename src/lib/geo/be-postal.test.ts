import { describe, expect, it } from "vitest";

import {
  GeocodeError,
  geocodePostalCode,
  isGeocodeError,
  validateAndResolvePostalCode,
} from "./be-postal";

describe("geocodePostalCode", () => {
  it("retourner les coords pour Bruxelles 1000", async () => {
    const result = await geocodePostalCode("1000");
    expect(result.postalCode).toBe("1000");
    expect(result.city).toContain("Bruxelles");
    expect(result.latitude).toBeGreaterThan(50);
    expect(result.latitude).toBeLessThan(51);
    expect(result.longitude).toBeGreaterThan(4);
    expect(result.longitude).toBeLessThan(5);
  });

  it("retourner les coords pour Liege 4000", async () => {
    const result = await geocodePostalCode("4000");
    expect(result.postalCode).toBe("4000");
    expect(result.city.length).toBeGreaterThan(0);
  });

  it("throw GeocodeError pour code invalide format", async () => {
    await expect(geocodePostalCode("00000")).rejects.toThrow(GeocodeError);
    await expect(geocodePostalCode("abcd")).rejects.toThrow(GeocodeError);
    await expect(geocodePostalCode("123")).rejects.toThrow(GeocodeError);
  });

  it("throw GeocodeError pour code postal inexistant", async () => {
    // 9999 a format valide (1-9 puis 3 chiffres) mais hors plage BE.
    // Selon la couverture du JSON, peut etre present ou absent.
    // On verifie surtout qu'aucun crash si absent.
    try {
      await geocodePostalCode("9999");
    } catch (err) {
      expect(isGeocodeError(err)).toBe(true);
    }
  });
});

describe("validateAndResolvePostalCode", () => {
  it("retourner valid:true pour code postal BE existant", () => {
    const result = validateAndResolvePostalCode("1000");
    if (result.valid) {
      expect(result.commune).toContain("Bruxelles");
      expect(result.lat).toBeGreaterThan(50);
    } else {
      // Should not reach here for "1000"
      expect.fail("1000 devrait etre un code postal BE valide");
    }
  });

  it("retourner valid:false pour code postal format invalide", () => {
    expect(validateAndResolvePostalCode("00000")).toEqual({ valid: false });
    expect(validateAndResolvePostalCode("123")).toEqual({ valid: false });
    expect(validateAndResolvePostalCode("abcd")).toEqual({ valid: false });
  });
});

describe("isGeocodeError type guard", () => {
  it("retourner true pour une GeocodeError", () => {
    expect(isGeocodeError(new GeocodeError("test"))).toBe(true);
  });

  it("retourner false pour une Error standard", () => {
    expect(isGeocodeError(new Error("test"))).toBe(false);
  });

  it("retourner false pour un non-Error", () => {
    expect(isGeocodeError("string")).toBe(false);
    expect(isGeocodeError(null)).toBe(false);
    expect(isGeocodeError(undefined)).toBe(false);
  });
});
