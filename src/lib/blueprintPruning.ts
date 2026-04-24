import type { Blueprint } from './types';

/**
 * Mutates a blueprint in place to remove overlapping text primitives.
 *
 * The system prompt asks the model to keep label bounding boxes disjoint, but
 * even Sonnet sometimes emits stacked text (duplicate summaries, label
 * repeated across steps, overlapping annotations). This is the last-mile
 * guard: walks every text primitive in drawing order across all steps and
 * drops any whose axis-aligned bounding box intersects an earlier kept
 * label, plus any exact-duplicate content.
 *
 * Box sizes are estimated with `fontSize * 0.55 * charCount` — intentionally
 * a slight overestimate so near-misses also get pruned, since visually
 * near-touching chalk text still reads as a mess.
 */
export function pruneOverlappingText(bp: Blueprint): void {
  interface KeptBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    content: string;
  }
  const kept: KeptBox[] = [];
  for (const step of bp.steps) {
    const newDrawings: typeof step.drawings = [];
    for (const d of step.drawings) {
      if (d.type !== 'text') {
        newDrawings.push(d);
        continue;
      }
      const p = d.params as {
        x?: number;
        y?: number;
        content?: string;
        fontSize?: number;
        anchor?: 'start' | 'middle' | 'end';
      };
      const content = typeof p.content === 'string' ? p.content : '';
      const fontSize = typeof p.fontSize === 'number' ? p.fontSize : 18;
      const x = typeof p.x === 'number' ? p.x : 0;
      const y = typeof p.y === 'number' ? p.y : 0;
      const anchor = p.anchor ?? 'start';
      if (!content.trim()) continue;

      const width = content.length * fontSize * 0.55;
      const height = fontSize * 1.2;
      const x1 =
        anchor === 'middle'
          ? x - width / 2
          : anchor === 'end'
            ? x - width
            : x;
      const y1 = y - height / 2;
      const x2 = x1 + width;
      const y2 = y1 + height;

      // Dedupe by exact content.
      if (kept.some((k) => k.content === content)) continue;

      // Reject if this box intersects any earlier kept box.
      const intersects = kept.some(
        (k) => x1 < k.x2 && x2 > k.x1 && y1 < k.y2 && y2 > k.y1,
      );
      if (intersects) continue;

      kept.push({ x1, y1, x2, y2, content });
      newDrawings.push(d);
    }
    step.drawings = newDrawings;
  }
}
