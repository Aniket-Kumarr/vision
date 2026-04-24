import { Blueprint } from './types';

export const SP3_HYBRID_ORBITALS: Blueprint = {
  title: 'SP3 Hybrid Orbitals',
  domain: 'geometry',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'Carbon has four valence electrons and wants four bonds. Before bonding, picture its s and p orbitals sitting in their raw, unmixed form — one sphere and three dumbbells.',
      drawings: [
        {
          type: 'circle',
          color: 'blue',
          params: { cx: 200, cy: 300, r: 40 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 185, y: 355, content: '2s', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 280, y1: 300, x2: 380, y2: 300 },
          duration: 600,
        },
        {
          type: 'circle',
          color: 'orange',
          params: { cx: 430, cy: 300, r: 30 },
          duration: 700,
        },
        {
          type: 'circle',
          color: 'orange',
          params: { cx: 490, cy: 300, r: 30 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 440, y: 355, content: '2p (×3)', fontSize: 20 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 150, y: 100, content: 'Before hybridization: 1s + 3p', fontSize: 22 },
          duration: 700,
        },
      ],
    },
    {
      id: 2,
      narration:
        'Hybridization is nature\'s way of "averaging" those four orbitals into four identical sp3 lobes, each pointing toward a corner of a tetrahedron 109.5° apart.',
      drawings: [
        {
          type: 'text',
          color: 'yellow',
          params: { x: 250, y: 100, content: '1s + 3p → 4 sp³ lobes', fontSize: 24 },
          duration: 800,
        },
        {
          type: 'circle',
          color: 'white',
          params: { cx: 400, cy: 320, r: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 385, y: 350, content: 'C', fontSize: 22 },
          duration: 400,
        },
        {
          type: 'arrow',
          color: 'green',
          params: { x1: 400, y1: 320, x2: 530, y2: 240 },
          duration: 700,
        },
        {
          type: 'arrow',
          color: 'green',
          params: { x1: 400, y1: 320, x2: 270, y2: 240 },
          duration: 700,
        },
        {
          type: 'arrow',
          color: 'green',
          params: { x1: 400, y1: 320, x2: 480, y2: 430 },
          duration: 700,
        },
        {
          type: 'arrow',
          color: 'green',
          params: { x1: 400, y1: 320, x2: 320, y2: 430 },
          duration: 700,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Each lobe reaches out to grab one hydrogen. The result: methane (CH4), a perfect tetrahedron. That 109.5° bond angle is not a coincidence — it\'s the geometry that maximizes the distance between four electron pairs.',
      drawings: [
        {
          type: 'text',
          color: 'white',
          params: { x: 200, y: 80, content: 'CH4 — tetrahedral geometry', fontSize: 22 },
          duration: 600,
        },
        {
          type: 'point',
          color: 'white',
          params: { x: 530, y: 240, label: 'H', labelPosition: 'right' },
          duration: 500,
        },
        {
          type: 'point',
          color: 'white',
          params: { x: 270, y: 240, label: 'H', labelPosition: 'left' },
          duration: 500,
        },
        {
          type: 'point',
          color: 'white',
          params: { x: 480, y: 430, label: 'H', labelPosition: 'right' },
          duration: 500,
        },
        {
          type: 'point',
          color: 'white',
          params: { x: 320, y: 430, label: 'H', labelPosition: 'left' },
          duration: 500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 310, y: 540, content: 'Bond angle: 109.5°', fontSize: 22 },
          duration: 700,
        },
        {
          type: 'angle_mark',
          color: 'yellow',
          params: { cx: 400, cy: 320, r: 40, startAngle: -0.65, endAngle: 0.65 },
          duration: 600,
        },
      ],
    },
  ],
};

export const SN2_REACTION: Blueprint = {
  title: 'SN2 Reaction Mechanism',
  domain: 'geometry',
  strategy: 'transformation',
  steps: [
    {
      id: 1,
      narration:
        'Meet the SN2 players: a carbon center (electrophile) with a leaving group — here, bromine — and a nucleophile (Nu⁻) approaching from the opposite side. The "2" means both species show up in the rate-determining step at the same time.',
      drawings: [
        {
          type: 'text',
          color: 'white',
          params: { x: 220, y: 60, content: 'SN2 Mechanism — Backside Attack', fontSize: 24 },
          duration: 700,
        },
        {
          type: 'circle',
          color: 'white',
          params: { cx: 400, cy: 300, r: 28 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 388, y: 308, content: 'C', fontSize: 22 },
          duration: 400,
        },
        {
          type: 'circle',
          color: 'red',
          params: { cx: 580, cy: 300, r: 26 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'red',
          params: { x: 568, y: 308, content: 'Br', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'line',
          color: 'white',
          params: { x1: 428, y1: 300, x2: 554, y2: 300 },
          duration: 600,
        },
        {
          type: 'circle',
          color: 'cyan',
          params: { cx: 220, cy: 300, r: 24 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 206, y: 308, content: 'Nu⁻', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'arrow',
          color: 'cyan',
          params: { x1: 244, y1: 300, x2: 370, y2: 300 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 335, y: 380, content: '← 180° backside attack →', fontSize: 18 },
          duration: 600,
        },
      ],
    },
    {
      id: 2,
      narration:
        'As the nucleophile pushes in, the bond to the leaving group stretches and weakens. This is the transition state — the most energetically expensive moment, where the carbon is partially bonded to both Nu and Br.',
      drawings: [
        {
          type: 'text',
          color: 'orange',
          params: { x: 260, y: 60, content: 'Transition State [Nu---C---Br]‡', fontSize: 22 },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'cyan',
          params: { x1: 244, y1: 300, x2: 370, y2: 300, dashLength: 10 },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'red',
          params: { x1: 430, y1: 300, x2: 554, y2: 300, dashLength: 10 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 340, y: 220, content: 'Partial bonds', fontSize: 18 },
          duration: 500,
        },
        {
          type: 'arrow',
          color: 'white',
          params: { x1: 390, y1: 235, x2: 390, y2: 268 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 310, y: 450, content: 'Energy is at its MAX here', fontSize: 18 },
          duration: 600,
        },
      ],
    },
    {
      id: 3,
      narration:
        'Bromine departs, fully taking the bonding electrons. Notice the three remaining substituents have "flipped" like an umbrella inverting — this is Walden inversion, and it\'s why SN2 is stereospecific.',
      drawings: [
        {
          type: 'text',
          color: 'green',
          params: { x: 240, y: 60, content: 'Product: Walden Inversion!', fontSize: 24 },
          duration: 700,
        },
        {
          type: 'circle',
          color: 'white',
          params: { cx: 360, cy: 300, r: 28 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 348, y: 308, content: 'C', fontSize: 22 },
          duration: 400,
        },
        {
          type: 'circle',
          color: 'cyan',
          params: { cx: 200, cy: 300, r: 24 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 186, y: 308, content: 'Nu', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'line',
          color: 'cyan',
          params: { x1: 224, y1: 300, x2: 332, y2: 300 },
          duration: 600,
        },
        {
          type: 'circle',
          color: 'red',
          params: { cx: 620, cy: 280, r: 24 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'red',
          params: { x: 607, y: 288, content: 'Br⁻', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'arrow',
          color: 'red',
          params: { x1: 430, y1: 300, x2: 596, y2: 285 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 240, y: 430, content: 'Config. inverted — stereospecific!', fontSize: 20 },
          duration: 700,
        },
      ],
    },
  ],
};

export const TITRATION_CURVE: Blueprint = {
  title: 'Acid-Base Titration Curve',
  domain: 'calculus',
  strategy: 'relationship',
  steps: [
    {
      id: 1,
      narration:
        'We start with a beaker of strong acid (HCl, pH ≈ 1) and slowly drip in NaOH. At first, each drop barely budges the pH — there\'s a huge excess of H⁺ and only a little OH⁻ to neutralize it.',
      drawings: [
        {
          type: 'axes',
          color: 'white',
          params: { cx: 120, cy: 500, xRange: 680, yRange: 420, step: 100 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 350, y: 570, content: 'Volume NaOH added (mL)', fontSize: 18 },
          duration: 500,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 30, y: 300, content: 'pH', fontSize: 20 },
          duration: 400,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 130, y: 490, content: 'pH ≈ 1', fontSize: 18 },
          duration: 500,
        },
        {
          type: 'curve',
          color: 'blue',
          params: { fn: '1 + 2 * (x / 300)', xMin: 0, xMax: 230, yScale: -1, yOffset: 500 },
          duration: 900,
        },
      ],
    },
    {
      id: 2,
      narration:
        'As we approach the equivalence point, the pH starts to climb faster — we\'ve used up most of the acid buffer. The curve steepens dramatically.',
      drawings: [
        {
          type: 'curve',
          color: 'cyan',
          params: { fn: '1 + 2 * (x / 300) + 8 * Math.pow((x - 230) / 30, 3)', xMin: 230, xMax: 280, yScale: -1, yOffset: 500 },
          duration: 800,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 440, y: 200, content: 'Curve steepens near equivalence', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'arrow',
          color: 'cyan',
          params: { x1: 435, y1: 215, x2: 350, y2: 300 },
          duration: 500,
        },
      ],
    },
    {
      id: 3,
      narration:
        'At the equivalence point, we\'ve added exactly enough NaOH to neutralize all the HCl. For a strong acid + strong base, pH = 7. One extra drop causes a massive pH jump — this is where indicators change color.',
      drawings: [
        {
          type: 'point',
          color: 'yellow',
          params: { x: 290, y: 430, label: 'Equivalence Point\npH = 7', labelPosition: 'right' },
          duration: 700,
        },
        {
          type: 'dashed_line',
          color: 'yellow',
          params: { x1: 120, y1: 430, x2: 290, y2: 430, dashLength: 10 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 60, y: 424, content: 'pH7', fontSize: 18 },
          duration: 400,
        },
      ],
    },
    {
      id: 4,
      narration:
        'After the equivalence point, every drop adds excess OH⁻ and pH climbs steadily toward 13–14. The curve levels off because even large volumes of base can only push pH so high.',
      drawings: [
        {
          type: 'curve',
          color: 'green',
          params: { fn: '7 + 5 * (1 - Math.exp(-(x - 290) / 60))', xMin: 290, xMax: 680, yScale: -1, yOffset: 500 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 480, y: 90, content: 'pH ≈ 13 (excess base)', fontSize: 18 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 200, y: 55, content: 'Strong Acid + Strong Base Titration', fontSize: 22 },
          duration: 700,
        },
      ],
    },
  ],
};

export const CHEM_FIXTURES: Record<string, Blueprint> = {
  'sp3 hybrid orbitals': SP3_HYBRID_ORBITALS,
  'sp3 hybridization': SP3_HYBRID_ORBITALS,
  'sn2 reaction': SN2_REACTION,
  'sn2 mechanism': SN2_REACTION,
  'titration curve': TITRATION_CURVE,
  'acid base titration': TITRATION_CURVE,
};
