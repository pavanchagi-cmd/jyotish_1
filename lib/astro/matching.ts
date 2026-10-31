import { houseFromSign } from "./houses";
import { degInSign, signOf } from "./math";
import { nakshatraOf } from "./nakshatra";
import {
  BHAKOOT_DOSHA_DISTANCES,
  GANA_POINTS,
  GRAHA_MAITRI_POINTS,
  KOOTA_MAX,
  MANGLIK_HOUSES,
  VARNA_BY_SIGN,
  VASHYA_POINTS,
  YONI_ORDER,
  YONI_POINTS,
  vashyaGroup,
  type KootaName,
} from "./tables/koota";
import { relation, type Graha } from "./tables/planets";
import { SIGNS } from "./tables/signs";

export interface MatchPerson {
  /** Sidereal Moon longitude. */
  moon: number;
  /** Sidereal Mars longitude. */
  mars: number;
  /** Lagna sign (0–11) when the birth time is known. */
  lagnaSign?: number;
}

export interface KootaScore {
  name: KootaName;
  points: number;
  max: number;
}

export interface ManglikResult {
  fromLagna: { house: number; manglik: boolean } | null;
  fromMoon: { house: number; manglik: boolean };
  /** Uses Lagna when known, otherwise Moon. */
  manglik: boolean;
}

export interface MatchResult {
  kootas: KootaScore[];
  total: number;
  max: 36;
  doshas: {
    bhakoot: { present: boolean; distance: [number, number]; lordsSameOrFriends: boolean };
    nadi: { present: boolean };
  };
  manglik: { girl: ManglikResult; boy: ManglikResult };
}

/** Tara count from one nakshatra to another; 3, 5, 7 (mod 9) are inauspicious. */
export function taraIsGood(fromNak: number, toNak: number): boolean {
  const count = ((toNak - fromNak + 27) % 27) + 1;
  const rem = count % 9 || 9;
  return ![3, 5, 7].includes(rem);
}

export function manglik(p: MatchPerson): ManglikResult {
  const marsSign = signOf(p.mars);
  const fromMoonHouse = houseFromSign(marsSign, signOf(p.moon));
  const fromMoon = { house: fromMoonHouse, manglik: (MANGLIK_HOUSES as readonly number[]).includes(fromMoonHouse) };
  const fromLagna =
    p.lagnaSign === undefined
      ? null
      : (() => {
          const house = houseFromSign(marsSign, p.lagnaSign);
          return { house, manglik: (MANGLIK_HOUSES as readonly number[]).includes(house) };
        })();
  return { fromLagna, fromMoon, manglik: fromLagna ? fromLagna.manglik : fromMoon.manglik };
}

/** Ashtakoota matching between a girl and a boy (spec section 5, matching.ts). */
export function ashtakoota(girl: MatchPerson, boy: MatchPerson): MatchResult {
  const gSign = signOf(girl.moon);
  const bSign = signOf(boy.moon);
  const gNak = nakshatraOf(girl.moon);
  const bNak = nakshatraOf(boy.moon);
  const gLord = SIGNS[gSign]!.lord as Graha;
  const bLord = SIGNS[bSign]!.lord as Graha;

  const varna = VARNA_BY_SIGN[bSign]! >= VARNA_BY_SIGN[gSign]! ? 1 : 0;

  const vashya = VASHYA_POINTS[vashyaGroup(bSign, degInSign(boy.moon))][vashyaGroup(gSign, degInSign(girl.moon))];

  const goodCount = Number(taraIsGood(gNak.index, bNak.index)) + Number(taraIsGood(bNak.index, gNak.index));
  const tara = goodCount * 1.5;

  const yoni = YONI_POINTS[YONI_ORDER.indexOf(bNak.yoni)]![YONI_ORDER.indexOf(gNak.yoni)]!;

  const grahaMaitri =
    gLord === bLord
      ? 5
      : GRAHA_MAITRI_POINTS[[relation(gLord, bLord), relation(bLord, gLord)].sort().join("+")]!;

  const gana = GANA_POINTS[bNak.gana][gNak.gana];

  const gToB = houseFromSign(bSign, gSign);
  const bToG = houseFromSign(gSign, bSign);
  const bhakootDosha = BHAKOOT_DOSHA_DISTANCES.some(([a, b]) => a === gToB && b === bToG);
  const bhakoot = bhakootDosha ? 0 : 7;

  const nadiDosha = gNak.nadi === bNak.nadi;
  const nadi = nadiDosha ? 0 : 8;

  const points: Record<KootaName, number> = { varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi };
  const kootas = (Object.keys(KOOTA_MAX) as KootaName[]).map((name) => ({ name, points: points[name], max: KOOTA_MAX[name] }));
  const total = kootas.reduce((s, k) => s + k.points, 0);

  return {
    kootas,
    total,
    max: 36,
    doshas: {
      bhakoot: {
        present: bhakootDosha,
        distance: [gToB, bToG],
        lordsSameOrFriends: gLord === bLord || (relation(gLord, bLord) === "friend" && relation(bLord, gLord) === "friend"),
      },
      nadi: { present: nadiDosha },
    },
    manglik: { girl: manglik(girl), boy: manglik(boy) },
  };
}
