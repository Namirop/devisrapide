import { describe, expect, it } from "vitest";

import {
  isWithinReach,
  leadHasRoom,
  radiusCapKm,
  shouldAutoAcceptLead,
} from "./eligibility";

describe("radiusCapKm", () => {
  it("laisser un rayon positif inchange", () => {
    expect(radiusCapKm(30)).toBe(30);
    expect(radiusCapKm(60)).toBe(60);
  });

  it("traduire le sentinel -1 (OPEN) en borne infinie", () => {
    expect(radiusCapKm(-1)).toBe(Number.POSITIVE_INFINITY);
  });

  it("traiter 0 comme une vraie borne, pas comme OPEN", () => {
    expect(radiusCapKm(0)).toBe(0);
  });
});

describe("isWithinReach", () => {
  it("accepter un lead dans le palier et dans le rayon du pro", () => {
    expect(
      isWithinReach({
        distanceKm: 20,
        leadCurrentRadiusKm: 30,
        proInterventionRadiusKm: 60,
      }),
    ).toBe(true);
  });

  it("refuser un lead hors du palier courant, meme si le pro va plus loin", () => {
    // Le pro accepte 60 km mais le lead n'est diffusé qu'à 30 km : c'est le
    // cron qui l'élargira, pas le rattrapage.
    expect(
      isWithinReach({
        distanceKm: 45,
        leadCurrentRadiusKm: 30,
        proInterventionRadiusKm: 60,
      }),
    ).toBe(false);
  });

  it("refuser un lead hors du rayon du pro, meme au palier OPEN", () => {
    // Le palier OPEN lève la borne du lead, pas celle du pro.
    expect(
      isWithinReach({
        distanceKm: 80,
        leadCurrentRadiusKm: -1,
        proInterventionRadiusKm: 30,
      }),
    ).toBe(false);
  });

  it("accepter n'importe quelle distance quand les deux cotes sont OPEN", () => {
    // Le sentinel -1 ne doit jamais être comparé tel quel à une distance.
    expect(
      isWithinReach({
        distanceKm: 250,
        leadCurrentRadiusKm: -1,
        proInterventionRadiusKm: -1,
      }),
    ).toBe(true);
  });

  it("accepter un pro 'toute la zone' sur un lead encore au palier 30 km", () => {
    expect(
      isWithinReach({
        distanceKm: 25,
        leadCurrentRadiusKm: 30,
        proInterventionRadiusKm: -1,
      }),
    ).toBe(true);
    expect(
      isWithinReach({
        distanceKm: 55,
        leadCurrentRadiusKm: 30,
        proInterventionRadiusKm: -1,
      }),
    ).toBe(false);
  });

  it("inclure la borne exacte", () => {
    expect(
      isWithinReach({
        distanceKm: 30,
        leadCurrentRadiusKm: 30,
        proInterventionRadiusKm: 30,
      }),
    ).toBe(true);
  });
});

describe("leadHasRoom", () => {
  it("laisser de la place tant que le plafond partage n'est pas atteint", () => {
    expect(
      leadHasRoom({
        acceptedCount: 2,
        isExclusive: false,
        sharedMaxAcceptances: 3,
      }),
    ).toBe(true);
  });

  it("fermer un lead partage au plafond", () => {
    expect(
      leadHasRoom({
        acceptedCount: 3,
        isExclusive: false,
        sharedMaxAcceptances: 3,
      }),
    ).toBe(false);
  });

  it("fermer un lead exclusif des le premier acheteur", () => {
    expect(
      leadHasRoom({
        acceptedCount: 1,
        isExclusive: true,
        sharedMaxAcceptances: 3,
      }),
    ).toBe(false);
  });

  it("ouvrir un lead exclusif sans acheteur", () => {
    expect(
      leadHasRoom({
        acceptedCount: 0,
        isExclusive: true,
        sharedMaxAcceptances: 3,
      }),
    ).toBe(true);
  });
});

describe("shouldAutoAcceptLead", () => {
  it("declencher quand le pro l'a active et que le wallet suit", () => {
    expect(
      shouldAutoAcceptLead({
        proAutoAccept: true,
        proBalanceCents: 5000,
        priceCents: 2500,
        isCatchAllCategory: false,
      }),
    ).toBe(true);
  });

  it("ne rien declencher si le pro n'a pas active l'auto-accept", () => {
    expect(
      shouldAutoAcceptLead({
        proAutoAccept: false,
        proBalanceCents: 5000,
        priceCents: 2500,
        isCatchAllCategory: false,
      }),
    ).toBe(false);
  });

  it("ne rien declencher si le wallet est insuffisant", () => {
    expect(
      shouldAutoAcceptLead({
        proAutoAccept: true,
        proBalanceCents: 2000,
        priceCents: 2500,
        isCatchAllCategory: false,
      }),
    ).toBe(false);
  });

  it("declencher quand le solde vaut exactement le prix", () => {
    expect(
      shouldAutoAcceptLead({
        proAutoAccept: true,
        proBalanceCents: 2500,
        priceCents: 2500,
        isCatchAllCategory: false,
      }),
    ).toBe(true);
  });

  it("ne JAMAIS declencher sur une categorie fourre-tout, wallet plein ou non", () => {
    // Ces leads partent à tous les pros de la zone : un achat automatique
    // serait un débit non consenti.
    expect(
      shouldAutoAcceptLead({
        proAutoAccept: true,
        proBalanceCents: 100_000,
        priceCents: 2500,
        isCatchAllCategory: true,
      }),
    ).toBe(false);
  });
});
