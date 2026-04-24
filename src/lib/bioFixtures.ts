import { Blueprint } from './types';

export const ACTION_POTENTIAL: Blueprint = {
  title: 'Action Potential',
  domain: 'calculus',
  strategy: 'relationship',
  steps: [
    {
      id: 1,
      narration:
        'At rest, the inside of the neuron is about −70 mV compared to the outside. This resting potential is maintained by the sodium-potassium pump — think of it as a tiny battery constantly being recharged.',
      drawings: [
        {
          type: 'axes',
          color: 'white',
          params: { cx: 100, cy: 350, xRange: 680, yRange: 280, step: 120 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 340, y: 560, content: 'Time →', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 20, y: 240, content: 'mV', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'dashed_line',
          color: 'blue',
          params: { x1: 100, y1: 420, x2: 780, y2: 420, dashLength: 10 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 700, y: 438, content: '−70 mV', fontSize: 16 },
          duration: 500,
        },
        {
          type: 'line',
          color: 'blue',
          params: { x1: 100, y1: 420, x2: 230, y2: 420 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 200, y: 60, content: 'Resting Potential: −70 mV', fontSize: 22 },
          duration: 600,
        },
      ],
    },
    {
      id: 2,
      narration:
        'A stimulus nudges the voltage up to the threshold — about −55 mV. That\'s the point of no return. Once the membrane reaches threshold, voltage-gated Na⁺ channels snap open and the spike fires on its own — all-or-nothing.',
      drawings: [
        {
          type: 'dashed_line',
          color: 'orange',
          params: { x1: 100, y1: 378, x2: 780, y2: 378, dashLength: 8 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 700, y: 365, content: '−55 mV', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 240, y: 80, content: 'Threshold', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'line',
          color: 'cyan',
          params: { x1: 230, y1: 420, x2: 270, y2: 378 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 200, y: 450, content: 'Stimulus', fontSize: 18 },
          duration: 500,
        },
        {
          type: 'arrow',
          color: 'yellow',
          params: { x1: 238, y1: 455, x2: 250, y2: 425 },
          duration: 500,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Na⁺ floods in — the membrane rockets to +40 mV in less than a millisecond. This rapid depolarization is the "spike" you see on any neuroscience recording. The cell goes from negatively charged to positively charged, inside-out.',
      drawings: [
        {
          type: 'line',
          color: 'yellow',
          params: { x1: 270, y1: 378, x2: 320, y2: 90 },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'red',
          params: { x1: 100, y1: 90, x2: 780, y2: 90, dashLength: 8 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'red',
          params: { x: 700, y: 78, content: '+40 mV', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 280, y: 110, content: 'Na⁺ rush in!', fontSize: 18 },
          duration: 500,
        },
      ],
    },
    {
      id: 4,
      narration:
        'K⁺ channels open (they\'re slower) and potassium rushes out, repolarizing the membrane. It briefly overshoots below −70 mV — the hyperpolarization — before the pump restores balance. During this refractory period, the neuron literally cannot fire again.',
      drawings: [
        {
          type: 'line',
          color: 'green',
          params: { x1: 320, y1: 90, x2: 410, y2: 420 },
          duration: 700,
        },
        {
          type: 'line',
          color: 'green',
          params: { x1: 410, y1: 420, x2: 460, y2: 460 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 360, y: 490, content: 'K⁺ out — hyperpolarization', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 460, y1: 460, x2: 560, y2: 420 },
          duration: 600,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 560, y1: 420, x2: 780, y2: 420 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 500, y: 380, content: 'Refractory', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'bracket',
          color: 'cyan',
          params: { x1: 410, y1: 360, x2: 560, y2: 360, type: 'square' },
          duration: 600,
        },
      ],
    },
  ],
};

export const KREBS_CYCLE: Blueprint = {
  title: 'Krebs Cycle (Citric Acid Cycle)',
  domain: 'algebra',
  strategy: 'accumulation',
  steps: [
    {
      id: 1,
      narration:
        'The Krebs cycle is the cell\'s central accounting ledger for carbon and energy. Every turn starts when a 2-carbon fragment (Acetyl-CoA, from glucose breakdown) latches onto a 4-carbon molecule called oxaloacetate, producing a 6-carbon citrate.',
      drawings: [
        {
          type: 'arc',
          color: 'white',
          params: { cx: 400, cy: 310, r: 200, startAngle: 0, endAngle: Math.PI * 2 },
          duration: 1200,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 310, y: 60, content: 'Krebs Cycle', fontSize: 28 },
          duration: 600,
        },
        {
          type: 'point',
          color: 'cyan',
          params: { x: 400, y: 110, label: 'Citrate (6C)', labelPosition: 'top' },
          duration: 600,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 600, y: 310, label: 'Isocitrate (6C)', labelPosition: 'right' },
          duration: 600,
        },
        {
          type: 'circle',
          color: 'yellow',
          params: { cx: 400, cy: 310, r: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 362, y: 316, content: 'Acetyl-CoA', fontSize: 14 },
          duration: 500,
        },
        {
          type: 'arrow',
          color: 'yellow',
          params: { x1: 400, y1: 292, x2: 400, y2: 132 },
          duration: 600,
        },
      ],
    },
    {
      id: 2,
      narration:
        'Two carbons are released as CO₂ — this is literally how your body exhales carbon atoms from glucose. These decarboxylation steps also hand off electrons to NAD⁺, converting it to NADH, the cell\'s main electron currency.',
      drawings: [
        {
          type: 'point',
          color: 'red',
          params: { x: 570, y: 170, label: 'CO₂ released', labelPosition: 'right' },
          duration: 600,
        },
        {
          type: 'arrow',
          color: 'red',
          params: { x1: 570, y1: 200, x2: 540, y2: 240 },
          duration: 500,
        },
        {
          type: 'point',
          color: 'red',
          params: { x: 565, y: 430, label: '2nd CO₂', labelPosition: 'right' },
          duration: 600,
        },
        {
          type: 'point',
          color: 'orange',
          params: { x: 530, y: 490, label: 'NADH', labelPosition: 'right' },
          duration: 600,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 140, y: 490, content: 'Electrons →', fontSize: 16 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 140, y: 510, content: 'NAD⁺ → NADH', fontSize: 16 },
          duration: 500,
        },
      ],
    },
    {
      id: 3,
      narration:
        'One ATP is produced directly per turn — not much, but reliable. Also one FADH2 is generated. Both NADH and FADH2 carry electrons to the electron transport chain, where most of the ATP is ultimately made.',
      drawings: [
        {
          type: 'point',
          color: 'green',
          params: { x: 200, y: 310, label: 'ATP produced!', labelPosition: 'left' },
          duration: 600,
        },
        {
          type: 'point',
          color: 'pink',
          params: { x: 260, y: 460, label: 'FADH₂', labelPosition: 'left' },
          duration: 600,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 130, y: 200, content: 'Per turn:', fontSize: 18 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 130, y: 225, content: '3 NADH', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'pink',
          params: { x: 130, y: 248, content: '1 FADH₂', fontSize: 16 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 130, y: 270, content: '1 ATP', fontSize: 16 },
          duration: 400,
        },
      ],
    },
    {
      id: 4,
      narration:
        'Oxaloacetate is regenerated at the end of each turn — that\'s what makes it a cycle. The cell runs two turns per glucose molecule (one per pyruvate), so double all those yields. The cycle is the hub; the electron transport chain is where the real ATP jackpot happens.',
      drawings: [
        {
          type: 'point',
          color: 'cyan',
          params: { x: 200, y: 160, label: 'Oxaloacetate (4C)', labelPosition: 'left' },
          duration: 600,
        },
        {
          type: 'arrow',
          color: 'cyan',
          params: { x1: 200, y1: 183, x2: 200, y2: 290 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 250, y: 570, content: '× 2 per glucose molecule', fontSize: 20 },
          duration: 700,
        },
      ],
    },
  ],
};

export const PUNNETT_SQUARE: Blueprint = {
  title: 'Punnett Square — Monohybrid Cross',
  domain: 'statistics',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'Genetics starts with alleles — two copies of a gene, one from each parent. Capital letters mean dominant (trait shows up), lowercase means recessive (only shows if you have two copies). Here we cross two carriers: Bb × Bb.',
      drawings: [
        {
          type: 'text',
          color: 'white',
          params: { x: 200, y: 60, content: 'Monohybrid Cross: Bb × Bb', fontSize: 26 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 130, y: 130, content: 'B = Brown (dominant)', fontSize: 20 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 130, y: 158, content: 'b = Blue (recessive)', fontSize: 20 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 130, y: 220, content: 'Parent 1: Bb (carrier — brown eyes)', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 130, y: 250, content: 'Parent 2: Bb (carrier — brown eyes)', fontSize: 18 },
          duration: 600,
        },
      ],
    },
    {
      id: 2,
      narration:
        'Draw the grid. Each parent contributes one allele to each offspring — the grid shows every possible combination. This is just organized probability: each square has a 25% chance of occurring.',
      drawings: [
        {
          type: 'rect',
          color: 'white',
          params: { x: 240, y: 300, width: 300, height: 220, fill: false },
          duration: 700,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 390, y1: 300, x2: 390, y2: 520 },
          duration: 600,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 240, y1: 410, x2: 540, y2: 410 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 305, y: 280, content: 'B', fontSize: 24 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 435, y: 280, content: 'b', fontSize: 24 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 210, y: 365, content: 'B', fontSize: 24 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 210, y: 475, content: 'b', fontSize: 24 },
          duration: 500,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Fill in the boxes. BB (top-left) = homozygous dominant. Bb (top-right and bottom-left) = heterozygous carriers. bb (bottom-right) = homozygous recessive — the only one that shows blue eyes.',
      drawings: [
        {
          type: 'text',
          color: 'yellow',
          params: { x: 290, y: 368, content: 'BB', fontSize: 24 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 420, y: 368, content: 'Bb', fontSize: 24 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 290, y: 478, content: 'Bb', fontSize: 24 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 420, y: 478, content: 'bb', fontSize: 24 },
          duration: 600,
        },
      ],
    },
    {
      id: 4,
      narration:
        'Result: 1 BB : 2 Bb : 1 bb genotype ratio. But phenotype is 3 brown : 1 blue — because BB and Bb both express brown. The "3:1 ratio" is Mendel\'s most famous observation, and it all comes from this simple grid.',
      drawings: [
        {
          type: 'text',
          color: 'white',
          params: { x: 590, y: 320, content: 'Genotype:', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 590, y: 348, content: '1 BB', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 590, y: 372, content: '2 Bb', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 590, y: 396, content: '1 bb', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 590, y: 440, content: 'Phenotype:', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 590, y: 465, content: '3 Brown', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 590, y: 489, content: '1 Blue', fontSize: 18 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 200, y: 565, content: 'Phenotype ratio: 3 : 1', fontSize: 24 },
          duration: 700,
        },
      ],
    },
  ],
};

export const BIO_FIXTURES: Record<string, Blueprint> = {
  'action potential': ACTION_POTENTIAL,
  'krebs cycle': KREBS_CYCLE,
  'citric acid cycle': KREBS_CYCLE,
  'punnett square': PUNNETT_SQUARE,
  'monohybrid cross': PUNNETT_SQUARE,
};
