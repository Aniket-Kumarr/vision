/** Suggestion chip labels (order = UI left-to-right). */
export const PHYSICS_SUGGESTION_CHIPS = [
  'Free Body Diagram',
  'Projectile Motion',
  "Newton's Second Law",
  'Conservation of Energy',
  'Momentum Collision',
  'Circular Motion',
  'Simple Harmonic Motion',
  'Waves',
] as const;

/**
 * Rich prompts for suggestion chips so the model builds a visualization for that
 * exact topic (not a fuzzy fixture match).
 */
export const PHYSICS_SUGGESTION_TO_PROMPT: Record<
  (typeof PHYSICS_SUGGESTION_CHIPS)[number],
  string
> = {
  'Free Body Diagram':
    'Visual chalkboard lesson on free body diagrams: draw a block resting on a horizontal surface (or a gentle incline) and isolate it as a labeled rectangle. Add vector arrows for gravity (mg downward), normal force (perpendicular to surface), an applied push, and friction opposing motion, with each arrow clearly labeled. Emphasize the intuition that forces balance when the object is in equilibrium, and show how the arrows add tip-to-tail rather than writing heavy algebra.',
  'Projectile Motion':
    'Visual chalkboard lesson on projectile motion: draw axes and a parabolic trajectory of a ball launched at an angle θ, marking the launch point, peak, and landing. At several points along the curve, decompose the velocity into horizontal (constant) and vertical (changing) component arrows using arrow primitives. Convey the intuition that horizontal motion is uniform while vertical motion is shaped by gravity, without resorting to long kinematic derivations.',
  "Newton's Second Law":
    "Visual chalkboard lesson on Newton's second law, F = ma: draw two mass blocks of different sizes on a frictionless surface with identical applied-force arrows pushing them. Use shorter and longer acceleration arrows to show the smaller mass accelerating more, and label each force, mass, and resulting acceleration. Focus on the intuition that force causes acceleration proportional to 1/m, using pictures rather than symbolic manipulation.",
  'Conservation of Energy':
    'Visual chalkboard lesson on conservation of energy: draw a pendulum (or a simple roller-coaster track) with the bob shown at three positions — highest, middle, lowest. Beside each position, draw a pair of stacked bars for KE and PE whose total height stays constant, or a small KE/PE-vs-position graph using curve primitives. Emphasize the intuition that energy trades form but the sum is preserved, avoiding heavy algebra.',
  'Momentum Collision':
    'Visual chalkboard lesson on momentum in a 1D collision: draw two blocks on a horizontal line in a "before" frame with labeled velocity/momentum arrows (p = mv) of different lengths, then an "after" frame showing the new arrows once they collide. Use a bracket or dashed line to separate the two frames and annotate that total momentum arrows sum to the same length before and after. Stress the intuition of momentum conservation through arrow lengths rather than equations.',
  'Circular Motion':
    'Visual chalkboard lesson on uniform circular motion: draw a circle with an object marked as a point on the rim, a radius line to the center, a centripetal force arrow pointing inward along that radius, and a velocity arrow tangent to the circle (perpendicular to the radius). Add an angle mark for the swept angle and label r, v, and F_c. Emphasize the intuition that the inward force constantly bends the velocity without changing its speed, keeping algebra minimal.',
  'Simple Harmonic Motion':
    'Visual chalkboard lesson on simple harmonic motion: on the left half of the canvas draw a mass attached to a horizontal spring against a wall, with arrows showing restoring force when displaced left and right of equilibrium. On the right half draw axes and a sine curve of position vs time, marking amplitude A, period T, and equilibrium as a dashed line. Connect the two visually so students see the oscillating mass traces out the sine curve, without diving into differential equations.',
  Waves:
    'Visual chalkboard lesson on transverse waves: draw a horizontal string as a smooth sine-like curve using the curve primitive, with a dashed equilibrium line through the middle. Use brackets to label one full wavelength λ between crests and the amplitude A from equilibrium to a crest, and add an arrow showing the direction of wave propagation. Emphasize the intuition that each point of the string moves up and down while the pattern travels sideways, avoiding heavy algebra.',
};

export function physicsPromptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in PHYSICS_SUGGESTION_TO_PROMPT)
    return PHYSICS_SUGGESTION_TO_PROMPT[t as keyof typeof PHYSICS_SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for: ${t}. Use labeled drawings, free-body diagrams where relevant, vector arrows for forces/velocities, and physical intuition, not heavy algebra.`;
}

export function displayPhysicsTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in PHYSICS_SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
