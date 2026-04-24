/**
 * Quiz deck — localStorage-backed spaced-repetition flashcard store.
 * Follows SM-2-lite scheduling.
 */

export const QUIZ_DECK_KEY = 'visua_ai_quiz_deck';

const MS_PER_DAY = 86_400_000;

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  sourceConceptTitle: string;
  createdAt: number;
  /** Timestamp (ms) when this card is next due for review. */
  due: number;
  /** Current interval in days. 0 = new/re-learning. */
  interval: number;
  /** SM-2 ease factor (default 2.5). */
  ease: number;
}

export type ReviewQuality = 0 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isDeckCard(x: unknown): x is DeckCard {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.front === 'string' &&
    typeof o.back === 'string' &&
    typeof o.sourceConceptTitle === 'string' &&
    typeof o.createdAt === 'number' &&
    typeof o.due === 'number' &&
    typeof o.interval === 'number' &&
    typeof o.ease === 'number'
  );
}

function readDeck(): DeckCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUIZ_DECK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDeckCard);
  } catch {
    return [];
  }
}

function writeDeck(cards: DeckCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUIZ_DECK_KEY, JSON.stringify(cards));
  } catch {
    /* localStorage quota or serialization error — silently ignore */
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Merge new cards into the deck. Cards whose `id` already exists are skipped
 * (idempotent). Each card starts with `due = now, interval = 0, ease = 2.5`.
 */
export function addCards(
  cards: Array<{ id: string; front: string; back: string }>,
  sourceConceptTitle: string,
): void {
  if (typeof window === 'undefined') return;
  const existing = readDeck();
  const existingIds = new Set(existing.map((c) => c.id));
  const now = Date.now();
  const newCards: DeckCard[] = cards
    .filter((c) => !existingIds.has(c.id))
    .map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      sourceConceptTitle,
      createdAt: now,
      due: now,
      interval: 0,
      ease: 2.5,
    }));
  writeDeck([...existing, ...newCards]);
}

/** Returns cards whose `due` timestamp is <= now, sorted oldest-due first. */
export function listDue(): DeckCard[] {
  const now = Date.now();
  return readDeck()
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due);
}

/** Returns all cards in the deck, newest-first. */
export function listAll(): DeckCard[] {
  return readDeck().sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Apply SM-2-lite scheduling after a review.
 *
 * quality 0 — Again: reset interval to 0, schedule immediately.
 * quality 3 — Hard:  keep interval as-is, schedule tomorrow if interval=0.
 * quality 4 — Good:  double interval (min 1 day).
 * quality 5 — Easy:  double interval * ease (min 1 day).
 */
export function review(cardId: string, quality: ReviewQuality): void {
  if (typeof window === 'undefined') return;
  const deck = readDeck();
  const idx = deck.findIndex((c) => c.id === cardId);
  if (idx === -1) return;

  const card = { ...deck[idx] };
  const now = Date.now();

  if (quality === 0) {
    card.interval = 0;
    card.due = now;
  } else if (quality === 3) {
    // Hard: keep interval but ensure at least 1 day next time
    const nextInterval = card.interval <= 0 ? 1 : card.interval;
    card.interval = nextInterval;
    card.due = now + nextInterval * MS_PER_DAY;
  } else if (quality === 4) {
    // Good: double interval
    const nextInterval = Math.max(1, card.interval * 2);
    card.interval = nextInterval;
    card.due = now + nextInterval * MS_PER_DAY;
  } else {
    // Easy: double interval * ease
    const nextInterval = Math.max(1, Math.round(card.interval * 2 * card.ease));
    card.interval = nextInterval;
    card.due = now + nextInterval * MS_PER_DAY;
  }

  deck[idx] = card;
  writeDeck(deck);
}

/** Delete a card by id. */
export function deleteCard(id: string): void {
  if (typeof window === 'undefined') return;
  writeDeck(readDeck().filter((c) => c.id !== id));
}
