/** Suggestion chip labels for the music subject (order = UI left-to-right). */
export const MUSIC_SUGGESTION_CHIPS = [
  'Circle of Fifths',
  'Pentatonic Scale',
  'Perfect Fifth',
  'Chord Inversion',
  'Time Signatures',
  'Enharmonic Notes',
  'Modes',
] as const;

/**
 * Rich prompts for music suggestion chips so the model builds a clear
 * visual chalkboard lesson for that exact topic.
 */
export const MUSIC_SUGGESTION_TO_PROMPT: Record<
  (typeof MUSIC_SUGGESTION_CHIPS)[number],
  string
> = {
  'Circle of Fifths':
    'Visual chalkboard lesson on the circle of fifths: draw a large circle and place the 12 key names (C G D A E B F# C# Ab Eb Bb F) as labeled points around it like a clock. Use arcs and arrows to show that moving clockwise adds one sharp and counter-clockwise adds one flat. Label the interval between adjacent keys as a perfect fifth (7 semitones). Keep it visual — no staff notation needed.',
  'Pentatonic Scale':
    'Visual chalkboard lesson on the pentatonic scale: draw a short staff and place 5 notes stepping up for C major pentatonic (C D E G A). Below the staff, show a number line of 12 semitones and highlight the 5 chosen ones. Use brackets to mark the gaps (whole step, whole step, minor third, whole step, minor third). Emphasise that removing the two "tension" notes (4th and 7th) leaves a scale that sounds good over almost anything.',
  'Perfect Fifth':
    'Visual chalkboard lesson on the perfect fifth interval: place two notes on a staff (C and G) and label the distance as 7 semitones. Draw a horizontal number line of 12 chromatic semitones and mark C at 0 and G at 7 with a bracket. Show how the frequency ratio 3:2 creates the nearly-pure overtone. Then show the same interval stacked 12 times around a small circle to hint at the circle of fifths.',
  'Chord Inversion':
    'Visual chalkboard lesson on chord inversions: on a staff, draw a C major triad in root position (C-E-G stacked bottom to top) on the left, first inversion (E-G-C) in the middle, and second inversion (G-C-E) on the right. Label each with arrows showing which note moved to the top. Use a bracket below each chord to label "Root", "1st inv.", "2nd inv." and emphasise that the notes are identical — only the order changes.',
  'Time Signatures':
    'Visual chalkboard lesson on time signatures: draw a staff and show two large stacked numbers (4 over 4) at the start. Use brackets and text to explain: top number = beats per bar, bottom number = which note value gets one beat (4 = quarter note). Then show a bar filled with four quarter-note circles and a second bar filled with two half-notes to illustrate 4/4. Below, show 3/4 with three quarter notes, labelling the waltz feel.',
  'Enharmonic Notes':
    'Visual chalkboard lesson on enharmonic equivalents: draw a piano keyboard diagram using rectangles for white keys (C D E F G A B C) and smaller filled rectangles for black keys. Point to the black key between C and D and label it both "C#" and "Db" with arrows. Repeat for F#/Gb. Use a bracket to show the same pitch, two names. Emphasise that on a piano they are the same key; in notation the name depends on context/key signature.',
  Modes:
    'Visual chalkboard lesson on modes: draw a staff and write out the 7 notes of the C major scale (C D E F G A B). Below it, show how starting the same 7 notes from a different root creates a new mode — draw D Dorian starting on D, and A Aeolian (natural minor) starting on A. Label each mode name and its characteristic interval compared to major. Use arrows and colour to show which note shifts to give each mode its distinct flavour.',
};

export function musicPromptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in MUSIC_SUGGESTION_TO_PROMPT)
    return MUSIC_SUGGESTION_TO_PROMPT[t as keyof typeof MUSIC_SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for the music theory concept: ${t}. Use staff notation (5 parallel horizontal lines), note circles with stems, labeled intervals with arcs, and chord diagrams. Focus on visual intuition — this is NOT audio, it is a drawn diagram.`;
}

export function displayMusicTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in MUSIC_SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
