import { Blueprint } from './types';

export const CIRCLE_OF_FIFTHS: Blueprint = {
  title: 'Circle of Fifths',
  domain: 'geometry',
  strategy: 'relationship',
  steps: [
    {
      id: 1,
      narration:
        'Picture a clock face — but instead of hours we place the 12 musical keys. This is the circle of fifths, the most powerful map in all of music theory.',
      drawings: [
        {
          type: 'circle',
          color: 'white',
          params: { cx: 400, cy: 300, r: 220 },
          duration: 1600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 60, content: 'Circle of Fifths', fontSize: 28 },
          duration: 800,
        },
      ],
    },
    {
      id: 2,
      narration:
        'C sits at the top — no sharps, no flats, the cleanest key. Moving clockwise each key adds one sharp; counter-clockwise each key adds one flat.',
      drawings: [
        {
          type: 'point',
          color: 'yellow',
          params: { x: 400, y: 80, label: 'C', labelPosition: 'top' },
          duration: 500,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 590, y: 135, label: 'G', labelPosition: 'right' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 706, y: 300, label: 'D', labelPosition: 'right' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 590, y: 465, label: 'A', labelPosition: 'right' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 400, y: 520, label: 'E', labelPosition: 'bottom' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 210, y: 465, label: 'B', labelPosition: 'left' },
          duration: 400,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Continuing clockwise: F# (or G♭) is the tritone — the farthest key from C. Then the flat keys mirror the sharp keys on the left side.',
      drawings: [
        {
          type: 'point',
          color: 'orange',
          params: { x: 94, y: 300, label: 'F#/G♭', labelPosition: 'left' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 210, y: 135, label: 'F', labelPosition: 'left' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 320, y: 84, label: 'Bb', labelPosition: 'top' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 480, y: 84, label: 'Eb', labelPosition: 'top' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 590, y: 400, label: 'Ab', labelPosition: 'right' },
          duration: 400,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 210, y: 400, label: 'Db', labelPosition: 'left' },
          duration: 400,
        },
      ],
    },
    {
      id: 4,
      narration:
        'Adjacent keys on the circle share six of their seven notes — they are "closely related." Keys directly opposite each other share the fewest notes and create the most tension.',
      drawings: [
        {
          type: 'line',
          color: 'cyan',
          params: { x1: 400, y1: 80, x2: 400, y2: 520 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 400, y: 565, content: 'Opposite keys = maximum contrast', fontSize: 18 },
          duration: 900,
        },
      ],
    },
    {
      id: 5,
      narration:
        'Each step clockwise is a perfect fifth (7 semitones up). Start at C: C → G → D → A → E → B → F# — that is the interval that generates the whole system.',
      drawings: [
        {
          type: 'arc',
          color: 'yellow',
          params: { cx: 400, cy: 300, r: 240, startAngle: -Math.PI / 2, endAngle: -Math.PI / 3 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 550, y: 200, content: '↑ perfect 5th', fontSize: 18 },
          duration: 800,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 550, content: 'C  G  D  A  E  B  F#  C#…', fontSize: 20 },
          duration: 1200,
        },
      ],
    },
    {
      id: 6,
      narration:
        'After 12 perfect fifths you land exactly back on C — a beautiful symmetry showing that our 12-tone system wraps perfectly around this circle. Memorise this map and harmony unlocks itself.',
      drawings: [
        {
          type: 'arc',
          color: 'pink',
          params: { cx: 400, cy: 300, r: 180, startAngle: 0, endAngle: 2 * Math.PI },
          duration: 2000,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 400, y: 300, content: '12 × P5 = octave', fontSize: 22 },
          duration: 1000,
        },
      ],
    },
  ],
};

export const MAJOR_SCALE: Blueprint = {
  title: 'Major Scale on the Staff',
  domain: 'algebra',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        "The staff is music's coordinate system — five parallel lines where each line and space is a distinct pitch. Higher on the staff means higher in pitch.",
      drawings: [
        { type: 'line', color: 'white', params: { x1: 60, y1: 200, x2: 740, y2: 200 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 230, x2: 740, y2: 230 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 260, x2: 740, y2: 260 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 290, x2: 740, y2: 290 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 320, x2: 740, y2: 320 }, duration: 600 },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 400, y: 120, content: 'Staff: 5 lines, 4 spaces', fontSize: 22 },
          duration: 700,
        },
      ],
    },
    {
      id: 2,
      narration:
        'The treble clef anchors note G on the second line. Each line and space from bottom to top spells: E-G-B-D-F (lines) and F-A-C-E (spaces).',
      drawings: [
        {
          type: 'text',
          color: 'yellow',
          params: { x: 70, y: 275, content: '𝄞', fontSize: 100 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 680, y: 336, content: 'E', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 680, y: 307, content: 'F', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 680, y: 277, content: 'G', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 680, y: 247, content: 'A', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 680, y: 218, content: 'B', fontSize: 16 },
          duration: 400,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Now place 8 notes stepping up the C major scale: C-D-E-F-G-A-B-C. Each note is a small filled circle placed on the correct line or space.',
      drawings: [
        { type: 'circle', color: 'green', params: { cx: 160, cy: 335, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 152, y: 375, content: 'C', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 220, cy: 320, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 212, y: 360, content: 'D', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 280, cy: 305, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 272, y: 345, content: 'E', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 340, cy: 290, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 332, y: 330, content: 'F', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 400, cy: 275, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 392, y: 315, content: 'G', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 460, cy: 260, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 452, y: 300, content: 'A', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'green', params: { cx: 520, cy: 245, r: 10 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 512, y: 285, content: 'B', fontSize: 16 }, duration: 300 },
        { type: 'circle', color: 'yellow', params: { cx: 580, cy: 230, r: 10 }, duration: 400 },
        { type: 'text', color: 'yellow', params: { x: 572, y: 270, content: "C'", fontSize: 16 }, duration: 300 },
      ],
    },
    {
      id: 4,
      narration:
        'The key insight: the major scale follows a fixed pattern of whole (W) and half (H) steps — W W H W W W H. This pattern is the DNA of the major sound.',
      drawings: [
        {
          type: 'text',
          color: 'orange',
          params: { x: 400, y: 420, content: 'W  W  H  W  W  W  H', fontSize: 22 },
          duration: 1000,
        },
        {
          type: 'bracket',
          color: 'orange',
          params: { x1: 160, y1: 410, x2: 580, y2: 410, type: 'square' },
          duration: 800,
        },
      ],
    },
    {
      id: 5,
      narration:
        'Half steps happen between E–F and B–C — the only adjacent white keys with no black key between them. Every other neighbouring pair is a whole step apart.',
      drawings: [
        {
          type: 'arrow',
          color: 'red',
          params: { x1: 280, y1: 395, x2: 340, y2: 395 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'red',
          params: { x: 290, y: 445, content: 'H', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'arrow',
          color: 'red',
          params: { x1: 520, y1: 395, x2: 580, y2: 395 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'red',
          params: { x: 530, y: 445, content: 'H', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 490, content: 'E–F and B–C: no black key in between', fontSize: 18 },
          duration: 900,
        },
      ],
    },
  ],
};

export const CHORD_TRIAD: Blueprint = {
  title: 'Chord Triad',
  domain: 'algebra',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'A chord is three or more notes played simultaneously. The simplest chord — the triad — stacks three notes by skipping every other note of the scale. Think of it as a three-story building.',
      drawings: [
        { type: 'line', color: 'white', params: { x1: 60, y1: 200, x2: 740, y2: 200 }, duration: 500 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 230, x2: 740, y2: 230 }, duration: 500 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 260, x2: 740, y2: 260 }, duration: 500 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 290, x2: 740, y2: 290 }, duration: 500 },
        { type: 'line', color: 'white', params: { x1: 60, y1: 320, x2: 740, y2: 320 }, duration: 500 },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 120, content: 'Building a C Major Triad', fontSize: 26 },
          duration: 800,
        },
      ],
    },
    {
      id: 2,
      narration:
        'Root note: C. This is the foundation — the first floor. We place it just below the staff on a ledger line.',
      drawings: [
        {
          type: 'line',
          color: 'white',
          params: { x1: 310, y1: 335, x2: 370, y2: 335 },
          duration: 500,
        },
        {
          type: 'circle',
          color: 'yellow',
          params: { cx: 340, cy: 335, r: 12 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 370, y: 340, content: '← Root: C', fontSize: 20 },
          duration: 700,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Third: E. We skip D and land on E — two steps up, sitting on the first line of the staff. This interval (C to E) is a major third: 4 semitones.',
      drawings: [
        {
          type: 'circle',
          color: 'green',
          params: { cx: 340, cy: 305, r: 12 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 370, y: 310, content: '← Third: E  (4 semitones)', fontSize: 20 },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'green',
          params: { x1: 340, y1: 323, x2: 340, y2: 317, dashLength: 4 },
          duration: 500,
        },
      ],
    },
    {
      id: 4,
      narration:
        'Fifth: G. Skip F and land on G — two more steps up, sitting in the second space. C to G is a perfect fifth: 7 semitones. Together C-E-G ring out as a major chord.',
      drawings: [
        {
          type: 'circle',
          color: 'cyan',
          params: { cx: 340, cy: 275, r: 12 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 370, y: 280, content: '← Fifth: G  (7 semitones)', fontSize: 20 },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'cyan',
          params: { x1: 340, y1: 293, x2: 340, y2: 287, dashLength: 4 },
          duration: 500,
        },
      ],
    },
    {
      id: 5,
      narration:
        'Minor triads follow the same skip-a-note rule but use a minor third (3 semitones) on the bottom and a major third (4 semitones) on top. Change one note, change the emotional colour completely.',
      drawings: [
        {
          type: 'shade',
          color: 'blue',
          params: {
            points: [[160, 260], [310, 260], [310, 360], [160, 360]],
            opacity: 0.12,
          },
          duration: 700,
        },
        {
          type: 'circle',
          color: 'blue',
          params: { cx: 220, cy: 335, r: 12 },
          duration: 500,
        },
        {
          type: 'circle',
          color: 'blue',
          params: { cx: 220, cy: 308, r: 12 },
          duration: 500,
        },
        {
          type: 'circle',
          color: 'blue',
          params: { cx: 220, cy: 275, r: 12 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 185, y: 400, content: 'C minor', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 305, y: 400, content: 'C major', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 560, y: 300, content: 'Major = m3 + M3', fontSize: 20 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 560, y: 340, content: 'Minor = M3 + m3', fontSize: 20 },
          duration: 700,
        },
      ],
    },
    {
      id: 6,
      narration:
        'Every triad is just two stacked thirds — swap the order and you swap major for minor. The whole Western harmony system of happy/sad, bright/dark is built on this one flip.',
      drawings: [
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 450, content: 'Major: 4 + 3 semitones = bright', fontSize: 22 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 400, y: 490, content: 'Minor: 3 + 4 semitones = dark', fontSize: 22 },
          duration: 900,
        },
        {
          type: 'rect',
          color: 'green',
          params: { x: 120, y: 430, width: 560, height: 80, fill: false },
          duration: 800,
        },
      ],
    },
  ],
};
