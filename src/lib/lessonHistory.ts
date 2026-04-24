import type { Blueprint } from './types';

export const HISTORY_KEY = 'visua_ai_history';
export const REPLAY_KEY = 'visua_ai_replay_blueprint';

const MAX_HISTORY = 50;
/** Hard cap on serialized history size (~3.5 MB, leaves room under 5 MB origin quota). */
const MAX_HISTORY_BYTES = 3_500_000;

export type LessonSubject = 'math' | 'physics' | 'chemistry' | 'biology' | 'music' | 'cs';

export interface LessonHistoryItem {
  id: string;
  topic: string;
  concept: string;
  /** The full lesson data. Optional on legacy entries written before the
   *  history schema stored blueprints — those entries are listed but cannot
   *  be replayed byte-for-byte (clicking them re-generates). */
  blueprint?: Blueprint;
  createdAt: number;
  /** Which subject this lesson belongs to. Older entries without this field
   *  default to 'math' since physics was added later. */
  subject?: LessonSubject;
}

function isHistoryItem(x: unknown): x is LessonHistoryItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const validSubject =
    o.subject === undefined ||
    o.subject === 'math' ||
    o.subject === 'physics' ||
    o.subject === 'chemistry' ||
    o.subject === 'biology' ||
    o.subject === 'music' ||
    o.subject === 'cs';
  return (
    typeof o.id === 'string' &&
    typeof o.topic === 'string' &&
    typeof o.concept === 'string' &&
    typeof o.createdAt === 'number' &&
    // blueprint is optional for legacy entries; when present it must be an object.
    (o.blueprint === undefined ||
      (typeof o.blueprint === 'object' && o.blueprint !== null)) &&
    validSubject
  );
}

export function subjectForLesson(item: LessonHistoryItem): LessonSubject {
  return item.subject ?? 'math';
}

export function getLessons(): LessonHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/**
 * Add a lesson to history. Dedupes by `concept` so re-running the same topic
 * replaces the older entry with a fresh blueprint and current timestamp.
 *
 * Caps the list at `MAX_HISTORY` entries AND at `MAX_HISTORY_BYTES` serialized
 * size (oldest evicted first) so blueprints — which can each be a few KB —
 * never blow the ~5 MB localStorage quota per origin.
 */
export function addLesson(item: Omit<LessonHistoryItem, 'id' | 'createdAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLessons().filter((e) => e.concept !== item.concept);
    const next: LessonHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    let updated = [next, ...existing].slice(0, MAX_HISTORY);
    // Evict oldest entries until the serialized payload fits the byte cap.
    // Keep at least the new entry even if it is huge by itself.
    let serialized = JSON.stringify(updated);
    while (updated.length > 1 && serialized.length > MAX_HISTORY_BYTES) {
      updated = updated.slice(0, -1);
      serialized = JSON.stringify(updated);
    }
    localStorage.setItem(HISTORY_KEY, serialized);
  } catch {
    /* localStorage quota or serialization error — silently ignore */
  }
}

export function removeLesson(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const filtered = getLessons().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

export function clearLessons(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/** Stash a blueprint to be picked up by /canvas instead of calling the API. */
export function setReplay(blueprint: Blueprint): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REPLAY_KEY, JSON.stringify(blueprint));
  } catch {
    /* ignore */
  }
}

/** Read AND clear the stashed replay blueprint. Returns null if none. */
export function takeReplay(): Blueprint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REPLAY_KEY);
    if (!raw) return null;
    localStorage.removeItem(REPLAY_KEY);
    return JSON.parse(raw) as Blueprint;
  } catch {
    return null;
  }
}

/**
 * Get lessons by ISO date string (YYYY-MM-DD in user's local timezone).
 * Returns all lessons created on that calendar day.
 */
export function getLessonsByDate(isoDate: string): LessonHistoryItem[] {
  const lessons = getLessons();
  return lessons.filter((lesson) => {
    const date = new Date(lesson.createdAt);
    const localDateStr = date.toISOString().split('T')[0];
    return localDateStr === isoDate;
  });
}

/**
 * Compute the current streak: number of consecutive calendar days (in user's local time)
 * with ≥1 lesson, ending today or yesterday.
 * - If today has lessons: streak ends today.
 * - Else if yesterday has lessons: streak ends yesterday, still counts.
 * - Else: streak = 0.
 */
export function getCurrentStreak(): number {
  const lessons = getLessons();
  if (lessons.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Check if today has any lessons
  const todayLessons = lessons.filter((l) => {
    const date = new Date(l.createdAt);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0] === todayStr;
  });

  let streak = 0;
  const checkDate = new Date(today);

  // If today has lessons, start streak count from today; otherwise start from yesterday
  if (todayLessons.length === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backwards through days, counting consecutive days with ≥1 lesson
  while (checkDate.getTime() <= today.getTime()) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayLessons = lessons.filter((l) => {
      const date = new Date(l.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split('T')[0] === dateStr;
    });

    if (dayLessons.length === 0) {
      break; // Streak broken
    }

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
