import { Blueprint } from './types';

export const PYTHAGOREAN_THEOREM: Blueprint = {
  title: 'Pythagorean Theorem',
  domain: 'geometry',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration: 'Start with a right triangle — the cornerstone of all geometry. Notice the right angle in the corner.',
      drawings: [
        {
          type: 'triangle',
          color: 'white',
          params: { x1: 200, y1: 450, x2: 500, y2: 450, x3: 200, y3: 200, fill: false },
          duration: 1400,
        },
        {
          type: 'angle_mark',
          color: 'cyan',
          params: { cx: 200, cy: 450, r: 20, startAngle: -Math.PI / 2, endAngle: 0 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 340, y: 470, content: 'a = 3', fontSize: 22 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 170, y: 330, content: 'b = 4', fontSize: 22 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 390, y: 330, content: 'c = ?', fontSize: 22 },
          duration: 700,
        },
      ],
    },
    {
      id: 2,
      narration: 'Now build a square on each side. The area of a square is its side length squared.',
      drawings: [
        {
          type: 'rect',
          color: 'blue',
          params: { x: 200, y: 450, width: 300, height: 90, fill: true },
          duration: 1200,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 350, y: 500, content: 'a²', fontSize: 28 },
          duration: 600,
        },
        {
          type: 'rect',
          color: 'green',
          params: { x: 110, y: 200, width: 90, height: 250, fill: true },
          duration: 1200,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 150, y: 330, content: 'b²', fontSize: 28 },
          duration: 600,
        },
      ],
    },
    {
      id: 3,
      narration: 'Now build the square on the hypotenuse — the longest side, opposite the right angle.',
      drawings: [
        {
          type: 'rect',
          color: 'yellow',
          params: { x: 500, y: 170, width: 260, height: 280, fill: true },
          duration: 1500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 630, y: 315, content: 'c²', fontSize: 32 },
          duration: 800,
        },
      ],
    },
    {
      id: 4,
      narration: 'The magic: the two smaller squares together have exactly the same area as the big one.',
      drawings: [
        {
          type: 'arrow',
          color: 'white',
          params: { x1: 340, y1: 490, x2: 580, y2: 380 },
          duration: 900,
        },
        {
          type: 'arrow',
          color: 'white',
          params: { x1: 145, y1: 340, x2: 550, y2: 280 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 165, content: 'Area(a²) + Area(b²) = Area(c²)', fontSize: 20 },
          duration: 1500,
        },
      ],
    },
    {
      id: 5,
      narration: 'Let\'s plug in numbers: 3² + 4² = 9 + 16 = 25, so c = √25 = 5.',
      drawings: [
        {
          type: 'text',
          color: 'orange',
          params: { x: 400, y: 120, content: '3² + 4² = c²', fontSize: 26 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 400, y: 90, content: '9 + 16 = 25', fontSize: 26 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 370, y: 60, content: 'c = 5  ✓', fontSize: 30 },
          duration: 900,
        },
      ],
    },
    {
      id: 6,
      narration: 'a² + b² = c². Always. For every right triangle in the universe.',
      drawings: [
        {
          type: 'rect',
          color: 'yellow',
          params: { x: 220, y: 530, width: 360, height: 55, fill: false },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 558, content: 'a² + b² = c²', fontSize: 34 },
          duration: 1200,
        },
      ],
    },
  ],
};

export const UNIT_CIRCLE: Blueprint = {
  title: 'The Unit Circle',
  domain: 'trigonometry',
  strategy: 'relationship',
  steps: [
    {
      id: 1,
      narration: 'Draw a circle of radius 1 centered at the origin. This is the unit circle — the key to all of trigonometry.',
      drawings: [
        {
          type: 'axes',
          color: 'white',
          params: { cx: 400, cy: 300, xRange: 200, yRange: 200, step: 50 },
          duration: 1200,
        },
        {
          type: 'circle',
          color: 'white',
          params: { cx: 400, cy: 300, r: 150 },
          duration: 1800,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 165, content: 'radius = 1', fontSize: 18 },
          duration: 700,
        },
      ],
    },
    {
      id: 2,
      narration: 'Pick any point on the circle and draw a line from the center to it — this line makes an angle θ with the x-axis.',
      drawings: [
        {
          type: 'line',
          color: 'yellow',
          params: { x1: 400, y1: 300, x2: 506, y2: 194 },
          duration: 900,
        },
        {
          type: 'arc',
          color: 'cyan',
          params: { cx: 400, cy: 300, r: 35, startAngle: -Math.PI / 2, endAngle: -Math.PI / 4 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'cyan',
          params: { x: 445, y: 265, content: 'θ', fontSize: 22 },
          duration: 400,
        },
        {
          type: 'point',
          color: 'yellow',
          params: { x: 506, y: 194, label: 'P', labelPosition: 'top' },
          duration: 500,
        },
      ],
    },
    {
      id: 3,
      narration: 'Drop a perpendicular line down to the x-axis. The horizontal distance is cos(θ), the vertical distance is sin(θ).',
      drawings: [
        {
          type: 'dashed_line',
          color: 'blue',
          params: { x1: 506, y1: 194, x2: 506, y2: 300, dashLength: 8 },
          duration: 800,
        },
        {
          type: 'dashed_line',
          color: 'green',
          params: { x1: 400, y1: 194, x2: 506, y2: 194, dashLength: 8 },
          duration: 800,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 525, y: 248, content: 'sin θ', fontSize: 18 },
          duration: 700,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 455, y: 180, content: 'cos θ', fontSize: 18 },
          duration: 700,
        },
      ],
    },
    {
      id: 4,
      narration: 'So every point on the circle has coordinates (cos θ, sin θ). The circle encodes all values of sine and cosine at once.',
      drawings: [
        {
          type: 'point',
          color: 'green',
          params: { x: 506, y: 300, label: 'cos θ', labelPosition: 'bottom' },
          duration: 600,
        },
        {
          type: 'point',
          color: 'blue',
          params: { x: 400, y: 194, label: 'sin θ', labelPosition: 'left' },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 490, content: 'P = (cos θ, sin θ)', fontSize: 24 },
          duration: 1000,
        },
      ],
    },
    {
      id: 5,
      narration: 'And by the Pythagorean theorem — since the radius is 1 — we always have cos²θ + sin²θ = 1.',
      drawings: [
        {
          type: 'triangle',
          color: 'orange',
          params: { x1: 400, y1: 300, x2: 506, y2: 300, x3: 506, y3: 194, fill: true },
          duration: 1200,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 535, content: 'cos²θ + sin²θ = 1', fontSize: 26 },
          duration: 1200,
        },
      ],
    },
    {
      id: 6,
      narration: 'As θ rotates around the full circle, sin and cos oscillate between -1 and 1 — generating the sine wave.',
      drawings: [
        {
          type: 'curve',
          color: 'pink',
          params: { fn: 'Math.sin(x) * 80', xMin: 220, xMax: 780, yScale: 1, yOffset: 520 },
          duration: 2000,
        },
        {
          type: 'text',
          color: 'pink',
          params: { x: 660, y: 505, content: 'sin wave →', fontSize: 16 },
          duration: 600,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 100, content: 'The unit circle IS trigonometry.', fontSize: 22 },
          duration: 1100,
        },
      ],
    },
  ],
};

export const WHAT_IS_A_DERIVATIVE: Blueprint = {
  title: 'What is a Derivative?',
  domain: 'calculus',
  strategy: 'transformation',
  steps: [
    {
      id: 1,
      narration: 'Start with a curve — the function f(x) = x². The derivative asks: how steep is this curve at any given point?',
      drawings: [
        {
          type: 'axes',
          color: 'white',
          params: { cx: 400, cy: 480, xRange: 320, yRange: 420, step: 80 },
          duration: 1200,
        },
        {
          type: 'curve',
          color: 'blue',
          params: { fn: 'x * x', xMin: 80, xMax: 720, yScale: 0.004, yOffset: 480 },
          duration: 1600,
        },
        {
          type: 'text',
          color: 'blue',
          params: { x: 670, y: 130, content: 'f(x) = x²', fontSize: 22 },
          duration: 800,
        },
      ],
    },
    {
      id: 2,
      narration: 'Pick two points on the curve. The slope of the line connecting them is called the secant line — a rough average rate of change.',
      drawings: [
        {
          type: 'point',
          color: 'orange',
          params: { x: 320, y: 340, label: 'A', labelPosition: 'left' },
          duration: 500,
        },
        {
          type: 'point',
          color: 'orange',
          params: { x: 480, y: 222, label: 'B', labelPosition: 'right' },
          duration: 500,
        },
        {
          type: 'line',
          color: 'orange',
          params: { x1: 220, y1: 410, x2: 580, y2: 150 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'orange',
          params: { x: 180, y: 390, content: 'secant line', fontSize: 18 },
          duration: 700,
        },
      ],
    },
    {
      id: 3,
      narration: 'Now slide point B closer and closer to A. Watch what happens to the secant line.',
      drawings: [
        {
          type: 'point',
          color: 'yellow',
          params: { x: 360, y: 314, label: 'B closer', labelPosition: 'right' },
          duration: 500,
        },
        {
          type: 'line',
          color: 'yellow',
          params: { x1: 240, y1: 395, x2: 500, y2: 220 },
          duration: 900,
        },
        {
          type: 'point',
          color: 'green',
          params: { x: 340, y: 331, label: 'B closer still', labelPosition: 'right' },
          duration: 500,
        },
        {
          type: 'line',
          color: 'green',
          params: { x1: 260, y1: 387, x2: 480, y2: 245 },
          duration: 900,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 555, content: 'As B → A, slope converges...', fontSize: 20 },
          duration: 1000,
        },
      ],
    },
    {
      id: 4,
      narration: 'In the limit, the secant becomes the tangent — a line touching the curve at exactly one point. That\'s the derivative.',
      drawings: [
        {
          type: 'line',
          color: 'yellow',
          params: { x1: 200, y1: 378, x2: 560, y2: 218 },
          duration: 1100,
        },
        {
          type: 'point',
          color: 'yellow',
          params: { x: 320, y: 340, label: 'tangent at A', labelPosition: 'top' },
          duration: 500,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 555, content: "tangent line = the derivative", fontSize: 20 },
          duration: 1100,
        },
      ],
    },
    {
      id: 5,
      narration: 'For f(x) = x², the derivative is f\'(x) = 2x — at any point x, the slope of the tangent is exactly 2x.',
      drawings: [
        {
          type: 'shade',
          color: 'yellow',
          params: {
            points: [[240, 500], [560, 500], [560, 390], [240, 390]],
            opacity: 0.08,
          },
          duration: 800,
        },
        {
          type: 'text',
          color: 'yellow',
          params: { x: 400, y: 430, content: "f'(x) = 2x", fontSize: 32 },
          duration: 1000,
        },
        {
          type: 'text',
          color: 'green',
          params: { x: 400, y: 470, content: 'slope at x=2 is 4, at x=3 is 6', fontSize: 18 },
          duration: 1100,
        },
        {
          type: 'text',
          color: 'white',
          params: { x: 400, y: 80, content: 'Derivative = instantaneous rate of change', fontSize: 20 },
          duration: 1200,
        },
      ],
    },
  ],
};

export const FIXTURES: Record<string, Blueprint> = {
  'pythagorean theorem': PYTHAGOREAN_THEOREM,
  'unit circle': UNIT_CIRCLE,
  'derivative': WHAT_IS_A_DERIVATIVE,
  'what is a derivative': WHAT_IS_A_DERIVATIVE,
};
