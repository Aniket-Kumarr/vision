/** Suggestion chip labels for chemistry (order = UI left-to-right). */
export const CHEMISTRY_SUGGESTION_CHIPS = [
  'SP3 Hybrid Orbitals',
  'SN2 Reaction',
  'Titration Curve',
  'Periodic Trends',
  'Lewis Dot Structures',
  'Equilibrium',
  'Reaction Energy Diagram',
] as const;

/**
 * Rich prompts for chemistry suggestion chips so the model builds a
 * visualization for that exact topic.
 */
export const CHEMISTRY_SUGGESTION_TO_PROMPT: Record<
  (typeof CHEMISTRY_SUGGESTION_CHIPS)[number],
  string
> = {
  'SP3 Hybrid Orbitals':
    'Visual chalkboard lesson on sp3 hybridization in methane (CH4): start by drawing four equivalent lobes arranged tetrahedrally around a central carbon, with bond angles labeled at 109.5°. Show how one s orbital and three p orbitals mix to produce four identical sp3 lobes, each pointing toward a corner of a tetrahedron. Emphasize that hybridization is not a rule applied after the fact — the geometry is why the orbitals mix. Keep algebra-free; let the shapes do the talking.',
  'SN2 Reaction':
    'Visual chalkboard lesson on the SN2 mechanism: draw a carbon center with a leaving group (e.g. Br) attached and a nucleophile approaching from the back side at 180°. Use a curved arrow from the nucleophile to the carbon and another from the C–Br bond to Br to show electron flow. In a second step sketch the inverted product (Walden inversion), highlighting how the three remaining substituents have "flipped" like an umbrella inverting in wind. Focus on the back-attack geometry — that single constraint explains the stereochemistry.',
  'Titration Curve':
    'Visual chalkboard lesson on a strong-acid / strong-base titration curve: draw axes (x = volume NaOH added, y = pH), a slow-rising region before the equivalence point, a near-vertical jump at the equivalence point (pH 7), and a leveling-off region after. Mark the equivalence point with a point primitive and a horizontal dashed line at pH 7. Explain why the curve is nearly flat far from equivalence (buffer effect in weak-acid titrations) and nearly vertical at equivalence, where a tiny drop of base causes a huge pH change.',
  'Periodic Trends':
    'Visual chalkboard lesson on periodic trends: draw a simplified 4-period, 8-group periodic table grid and annotate it with arrows showing atomic radius decreasing left-to-right (more protons pull electrons in) and increasing top-to-bottom (new shells). Add a second set of arrows showing ionization energy trending the opposite way. Use color shading on the grid cells to reinforce high vs low. Stress the intuition that proton count and shielding are the two forces in tension.',
  'Lewis Dot Structures':
    'Visual chalkboard lesson on Lewis dot structures using water (H2O) as the example: first count valence electrons (2+6=8), then show electrons placed as pairs around oxygen with two hydrogen bonds. Highlight the two lone pairs on oxygen as the reason water is bent (not linear). Follow with a quick sketch of CO2 for contrast — linear because the double bonds push symmetrically. Emphasize counting electrons first, then arrange to satisfy octets.',
  Equilibrium:
    'Visual chalkboard lesson on chemical equilibrium using the reaction A ⇌ B: draw two curves on the same axes (x = time, y = reaction rate), one for the forward rate starting high and falling, one for the reverse starting low and rising. Where they meet, label it "equilibrium." Below the graph, draw a molecular population bar chart showing how [A] decreases and [B] increases until the ratio stabilizes. Stress that equilibrium is dynamic — both reactions continue; the concentrations just stop changing.',
  'Reaction Energy Diagram':
    'Visual chalkboard lesson on a reaction energy diagram (potential energy vs reaction coordinate): draw a smooth curve that starts at a reactant energy level, climbs to an activation energy peak, then drops to a lower product level. Label reactants, products, Ea (activation energy), and ΔH (energy released). Add a dotted line for a catalyzed path with a lower peak. Emphasize that Ea determines reaction rate while ΔH determines whether the reaction is energetically favorable — they are independent.',
};

export function chemistryPromptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in CHEMISTRY_SUGGESTION_TO_PROMPT)
    return CHEMISTRY_SUGGESTION_TO_PROMPT[t as keyof typeof CHEMISTRY_SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for this chemistry concept: ${t}. Use labeled structural diagrams, orbital shapes, reaction arrows, or energy diagrams as appropriate. Focus on visual intuition, not symbolic manipulation.`;
}

export function displayChemistryTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in CHEMISTRY_SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
