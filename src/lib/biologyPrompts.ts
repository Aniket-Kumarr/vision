/** Suggestion chip labels for biology (order = UI left-to-right). */
export const BIOLOGY_SUGGESTION_CHIPS = [
  'Action Potential',
  'Krebs Cycle',
  'Punnett Square',
  'Cell Membrane',
  'Photosynthesis',
  'DNA Replication',
  'Natural Selection',
  'Osmosis',
] as const;

/**
 * Rich prompts for biology suggestion chips so the model builds a
 * visualization for that exact topic.
 */
export const BIOLOGY_SUGGESTION_TO_PROMPT: Record<
  (typeof BIOLOGY_SUGGESTION_CHIPS)[number],
  string
> = {
  'Action Potential':
    'Visual chalkboard lesson on the action potential in a neuron: draw axes (x = time, y = membrane voltage in mV), a resting potential line at −70 mV, then a rapid upswing to +40 mV (Na+ rushing in), a falling phase back past resting (K+ rushing out), and an undershoot (hyperpolarization) before returning to rest. Mark threshold at −55 mV with a horizontal dashed line. Below the graph sketch the neuron membrane with channel icons opening and closing at the right phases. Stress the "all-or-nothing" principle — once threshold is reached, the spike always fires the same way.',
  'Krebs Cycle':
    'Visual chalkboard lesson on the Krebs (citric acid) cycle: draw a circular arrow diagram with 8 labeled steps arranged clockwise. Start with Acetyl-CoA (2C) entering and combining with oxaloacetate (4C) to form citrate (6C). Mark the two CO2 release steps, the three NADH harvesting steps, the one FADH2 step, and the single ATP/GTP step. Color-code the electron carriers in yellow to show where the energy is captured. Finish by emphasizing that oxaloacetate is regenerated — that is what makes it a cycle.',
  'Punnett Square':
    'Visual chalkboard lesson on a monohybrid Punnett square for a dominant-recessive trait (e.g. brown vs blue eyes): draw a 2×2 grid, label the parental alleles (Bb × Bb) above and beside the grid, and fill in all four boxes. Identify each genotype (BB, Bb, bb) and explain phenotype ratios: 3 brown : 1 blue. Then sketch a second 2×2 for a carrier cross (Bb × bb) and show the 1:1 phenotype ratio. Emphasize that the square is just organized probability — each box has the same 25% chance.',
  'Cell Membrane':
    'Visual chalkboard lesson on the fluid-mosaic model of the cell membrane: draw a cross-section showing two rows of phospholipids arranged tail-to-tail, with hydrophilic heads facing outward and hydrophobic tails sandwiched in the middle. Embed channel proteins, carrier proteins, and a glycoprotein sticking up. Label the bilayer thickness and indicate which side faces the cytoplasm vs extracellular fluid. Emphasize that the "fluid" part means lipids and proteins can drift laterally — the membrane is not a rigid wall.',
  Photosynthesis:
    'Visual chalkboard lesson on photosynthesis divided into two stages: on the left half of the canvas draw a thylakoid membrane with arrows showing light being absorbed, water (H2O) split, O2 released, and ATP + NADPH produced (the Light Reactions). On the right half draw the Calvin cycle as a circular arrow loop: CO2 entering, RuBP regenerated, and G3P (glucose precursor) exiting. Connect the two halves with arrows showing ATP and NADPH flowing from left to right. Stress that the two stages are coupled — the light reactions power the sugar factory.',
  'DNA Replication':
    'Visual chalkboard lesson on DNA replication: draw the double helix as two parallel horizontal lines with short rung-like lines (base pairs) between them. Show the helix "unzipping" at a replication fork, with DNA polymerase drawn as a blob moving along each template strand and adding new complementary bases. Label the leading strand (continuous synthesis) and lagging strand (Okazaki fragments drawn as short segments). End with two identical double helixes, each holding one old and one new strand. Stress that this semi-conservative mechanism is how errors are minimized.',
  'Natural Selection':
    'Visual chalkboard lesson on natural selection using a classic example (e.g. peppered moths): draw a tree trunk background with three moth shapes at different shades. Show predator arrows hitting the least-camouflaged moths more often, and a "next generation" panel where surviving moths have reproduced, shifting the population toward the camouflaged variant. Label variation, selection pressure, heritability, and differential reproduction. Emphasize that no individual evolves — the population does, generation by generation.',
  Osmosis:
    'Visual chalkboard lesson on osmosis: draw two chambers separated by a semipermeable membrane (shown as a dotted vertical line with small circles = pores too small for solute). Fill the left side with a high-solute concentration (large dots) and the right with a low-solute concentration. Use arrows of different sizes to show net water movement from right (dilute) to left (concentrated), and show the water level on the left rising while the right drops. Label osmotic pressure as the force needed to stop that flow. Stress the intuition: water moves toward where it is relatively scarce.',
};

export function biologyPromptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in BIOLOGY_SUGGESTION_TO_PROMPT)
    return BIOLOGY_SUGGESTION_TO_PROMPT[t as keyof typeof BIOLOGY_SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for this biology concept: ${t}. Use process diagrams, labeled organelles, cycles, or comparison charts as appropriate. Focus on visual intuition and biological mechanisms.`;
}

export function displayBiologyTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in BIOLOGY_SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
