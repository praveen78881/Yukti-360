/**
 * PAN checks that need no network: the format, the holder-type letter (4th)
 * and, for entities, the name-initial rule (5th letter). The live check
 * against the Income-tax registry lives in company360.ts (lookupPan) and
 * runs where the Sandbox KYC keys are configured.
 */
import { PAN_REGEX } from '@/lib/schemas/india';

/** 4th letter → who holds the PAN. */
export const PAN_HOLDER: Record<string, string> = {
  P: 'an individual',
  C: 'a company',
  H: 'an HUF',
  F: 'a firm or LLP',
  A: 'an AOP',
  T: 'a trust',
  B: 'a BOI',
  L: 'a local authority',
  J: 'an artificial juridical person',
  G: 'a government body',
};

/** The 4th letter a legal form's PAN carries — undefined where the law allows
 *  more than one (societies, AOP/BOI and cooperatives are issued A, B or T). */
export function panHolderLetter(entityType: string): string | undefined {
  switch (entityType) {
    case 'individual':
    case 'sole_proprietorship': return 'P';
    case 'pvt_ltd':
    case 'public_ltd':
    case 'opc':
    case 'section8': return 'C';
    case 'partnership':
    case 'llp': return 'F';
    case 'huf': return 'H';
    case 'trust': return 'T';
    default: return undefined;
  }
}

/** Words that lead a registered name without being part of it. */
const NAME_PREFIXES = new Set(['M/S', 'MS', 'MESSRS', 'THE', 'SHRI', 'SRI', 'SMT']);

/** The letter an entity's PAN carries 5th: the first letter of its name. */
export function entityNameInitial(name?: string): string | null {
  const words = (name || '').toUpperCase().replace(/[^A-Z/ ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  while (words.length && NAME_PREFIXES.has(words[0])) words.shift();
  return words[0]?.[0] ?? null;
}

export interface PanContext {
  /** The 4th letter the holder's legal form demands, when known. */
  holder?: string;
  /** An entity's registered name — its PAN's 5th letter is the name's first letter.
   *  (Not applied to people: their 5th letter is the surname's initial, and
   *  names are written in too many orders to judge.) */
  entityName?: string;
}

/** Why a PAN fails, in words — null when it is fine or still empty. */
export function panProblem(pan: string, ctx: PanContext = {}): string | null {
  const p = pan.trim().toUpperCase();
  if (!p) return null;
  if (!PAN_REGEX.test(p)) return 'Please enter a valid PAN number (format ABCDE1234F)';
  if (!PAN_HOLDER[p[3]]) return `Please enter a valid PAN number — ${p[3]} is not a PAN holder type (4th letter)`;
  if (ctx.holder && p[3] !== ctx.holder) {
    return `Please enter a valid PAN number — the PAN of ${PAN_HOLDER[ctx.holder]} has ${ctx.holder} as its 4th letter, not ${p[3]}`;
  }
  const initial = entityNameInitial(ctx.entityName);
  if (initial && p[4] !== initial) {
    return `Please enter a valid PAN number — its 5th letter should be ${initial}, the first letter of the name, not ${p[4]}`;
  }
  return null;
}

export function isValidPan(pan: string, ctx: PanContext = {}): boolean {
  return PAN_REGEX.test(pan.trim().toUpperCase()) && panProblem(pan, ctx) === null;
}
