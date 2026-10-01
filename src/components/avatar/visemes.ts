/* ── Visemes ────────────────────────────────────────────────────────────────
   The mouth runs off a timeline of mouth shapes built from the text. Width is
   the brief's table exactly ("oo" purses at 0.62, "ah" gapes at 1.16); open is
   how far the lens parts for that shape. */

export type Viseme =
  | 'aa' | 'E' | 'I' | 'O' | 'U'
  | 'PP' | 'FF' | 'TH' | 'DD' | 'SS' | 'CH' | 'nn' | 'RR'
  | 'sil';

export interface MouthShape { width: number; open: number }

export const VISEMES: Record<Viseme, MouthShape> = {
  aa:  { width: 1.16, open: 0.86 },
  E:   { width: 1.12, open: 0.52 },
  I:   { width: 1.06, open: 0.32 },
  SS:  { width: 1.08, open: 0.1 },
  sil: { width: 1.0,  open: 0 },
  TH:  { width: 0.95, open: 0.16 },
  DD:  { width: 0.95, open: 0.22 },
  nn:  { width: 0.92, open: 0.12 },
  FF:  { width: 0.9,  open: 0.07 },
  PP:  { width: 0.78, open: 0 },
  RR:  { width: 0.76, open: 0.24 },
  CH:  { width: 0.72, open: 0.2 },
  O:   { width: 0.72, open: 0.64 },
  U:   { width: 0.62, open: 0.4 },
};

/** Start moving toward the next shape at 55% of the current one. */
export const COARTICULATION = 0.55;

export interface VisemeItem {
  v: Viseme;
  /** position on the weighted-character axis where this shape starts */
  pos: number;
  /** length on that axis (≈ characters; pauses are weighted heavier) */
  weight: number;
}

export interface VisemeTimeline {
  items: VisemeItem[];
  /** total length on the weighted-character axis */
  total: number;
  /** weighted position of every source character — how synthesiser word
      boundaries (reported as character indices) are mapped onto the timeline */
  posAtChar: Float32Array;
}

const DIGRAPHS: Record<string, Viseme> = {
  th: 'TH', ch: 'CH', sh: 'CH', ph: 'FF', ng: 'nn', oo: 'U', ee: 'I', ea: 'E', ou: 'O', ai: 'E',
};

const LETTERS: Record<string, Viseme> = {
  a: 'aa', e: 'E', i: 'I', o: 'O', u: 'U', y: 'I', w: 'U',
  b: 'PP', m: 'PP', p: 'PP',
  f: 'FF', v: 'FF',
  s: 'SS', z: 'SS', x: 'SS',
  d: 'DD', t: 'DD', l: 'DD', n: 'nn', k: 'DD', g: 'DD', q: 'DD',
  r: 'RR', j: 'CH',
};

export function buildTimeline(text: string): VisemeTimeline {
  const lower = text.toLowerCase();
  const n = lower.length;
  const posAtChar = new Float32Array(n + 1);
  const items: VisemeItem[] = [];
  let pos = 0;

  const push = (v: Viseme, weight: number) => {
    const last = items[items.length - 1];
    if (last && last.v === v) last.weight += weight;
    else items.push({ v, pos, weight });
    pos += weight;
  };

  // settle from rest into the first shape
  push('sil', 0.4);

  for (let i = 0; i < n; ) {
    posAtChar[i] = pos;
    const c = lower[i];
    const pair = lower.slice(i, i + 2);

    if (DIGRAPHS[pair]) {
      push(DIGRAPHS[pair], 2);
      posAtChar[i + 1] = pos - 1;
      i += 2;
      continue;
    }
    if (/\s/.test(c)) push('sil', 0.6);
    else if (',;:'.includes(c)) push('sil', 3);
    else if ('.!?'.includes(c)) push('sil', 5);
    else if (c === 'c') push('ceiy'.includes(lower[i + 1] ?? '') ? 'SS' : 'DD', 1);
    else if (c === 'h') push('sil', 0.7);
    else if (/[0-9]/.test(c)) { push('E', 1.1); push('nn', 0.6); }
    else if (LETTERS[c]) push(LETTERS[c], 1);
    else push('sil', 0.4);
    i++;
  }
  posAtChar[n] = pos;
  // let the mouth close before it stops
  push('sil', 1.2);

  return { items, total: pos, posAtChar };
}

const smoothstep = (v: number) => { const t = v < 0 ? 0 : v > 1 ? 1 : v; return t * t * (3 - 2 * t); };

/** The co-articulated mouth shape at weighted position `pos`. */
export function sampleTimeline(tl: VisemeTimeline, pos: number, out: MouthShape): MouthShape {
  const items = tl.items;
  if (!items.length || pos <= 0 || pos >= tl.total) {
    out.width = VISEMES.sil.width;
    out.open = VISEMES.sil.open;
    return out;
  }
  // binary search for the item containing pos
  let lo = 0, hi = items.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (items[mid].pos <= pos) lo = mid; else hi = mid - 1;
  }
  const item = items[lo];
  const cur = VISEMES[item.v];
  const next = VISEMES[items[lo + 1]?.v ?? 'sil'];
  const p = (pos - item.pos) / item.weight;
  const k = p < COARTICULATION ? 0 : smoothstep((p - COARTICULATION) / (1 - COARTICULATION));
  out.width = cur.width + (next.width - cur.width) * k;
  out.open = cur.open + (next.open - cur.open) * k;
  return out;
}
