import { Blueprint } from './types';

export const BUBBLE_SORT: Blueprint = {
  title: 'Bubble Sort',
  domain: 'algebra',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'Start with an unsorted array of 5 numbers. Each element lives in a labeled box — the index is its address in memory.',
      drawings: [
        { type: 'rect', color: 'white', params: { x: 80,  y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'rect', color: 'white', params: { x: 200, y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'rect', color: 'white', params: { x: 320, y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'rect', color: 'white', params: { x: 440, y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'rect', color: 'white', params: { x: 560, y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'text', color: 'orange', params: { x: 130, y: 290, content: '5', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'orange', params: { x: 250, y: 290, content: '3', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'orange', params: { x: 370, y: 290, content: '8', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'orange', params: { x: 490, y: 290, content: '1', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'orange', params: { x: 610, y: 290, content: '4', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'white',  params: { x: 130, y: 350, content: '[0]', fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'white',  params: { x: 250, y: 350, content: '[1]', fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'white',  params: { x: 370, y: 350, content: '[2]', fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'white',  params: { x: 490, y: 350, content: '[3]', fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'white',  params: { x: 610, y: 350, content: '[4]', fontSize: 16 }, duration: 400 },
      ],
    },
    {
      id: 2,
      narration:
        'Compare neighbors at [0] and [1]. Is 5 > 3? Yes — they\'re out of order. Highlight them in yellow to show we\'re looking here.',
      drawings: [
        { type: 'rect', color: 'yellow', params: { x: 80,  y: 240, width: 100, height: 80, fill: true }, duration: 700 },
        { type: 'rect', color: 'yellow', params: { x: 200, y: 240, width: 100, height: 80, fill: true }, duration: 700 },
        { type: 'text', color: 'white',  params: { x: 130, y: 290, content: '5', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'white',  params: { x: 250, y: 290, content: '3', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'yellow', params: { x: 400, y: 180, content: '5 > 3 → SWAP', fontSize: 22 }, duration: 800 },
      ],
    },
    {
      id: 3,
      narration:
        'Swap! An arrow arcs over the two boxes showing the values exchange places. After the swap, 3 is now left of 5.',
      drawings: [
        { type: 'arrow', color: 'red', params: { x1: 130, y1: 235, x2: 250, y2: 235 }, duration: 900 },
        { type: 'arrow', color: 'red', params: { x1: 250, y1: 245, x2: 130, y2: 245 }, duration: 900 },
        { type: 'rect', color: 'green', params: { x: 80,  y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'rect', color: 'green', params: { x: 200, y: 240, width: 100, height: 80, fill: false }, duration: 600 },
        { type: 'text', color: 'green', params: { x: 130, y: 290, content: '3', fontSize: 30 }, duration: 500 },
        { type: 'text', color: 'green', params: { x: 250, y: 290, content: '5', fontSize: 30 }, duration: 500 },
      ],
    },
    {
      id: 4,
      narration:
        'Continue comparing pairs: 5 vs 8 (no swap), 8 vs 1 (swap!), 8 vs 4 (swap!). The largest value "bubbles up" to the end.',
      drawings: [
        { type: 'rect', color: 'green', params: { x: 560, y: 240, width: 100, height: 80, fill: true }, duration: 800 },
        { type: 'text', color: 'white', params: { x: 610, y: 290, content: '8', fontSize: 30 }, duration: 500 },
        { type: 'arrow', color: 'yellow', params: { x1: 130, y1: 430, x2: 610, y2: 430 }, duration: 1200 },
        { type: 'text', color: 'yellow', params: { x: 370, y: 460, content: '8 bubbles to end →', fontSize: 18 }, duration: 800 },
      ],
    },
    {
      id: 5,
      narration:
        'After each full pass, one more element is locked in place at the right. Repeat until no swaps occur — sorted!',
      drawings: [
        { type: 'rect', color: 'green', params: { x: 80,  y: 240, width: 100, height: 80, fill: true }, duration: 600 },
        { type: 'rect', color: 'green', params: { x: 200, y: 240, width: 100, height: 80, fill: true }, duration: 600 },
        { type: 'rect', color: 'green', params: { x: 320, y: 240, width: 100, height: 80, fill: true }, duration: 600 },
        { type: 'rect', color: 'green', params: { x: 440, y: 240, width: 100, height: 80, fill: true }, duration: 600 },
        { type: 'text', color: 'white', params: { x: 130, y: 290, content: '1', fontSize: 30 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 250, y: 290, content: '3', fontSize: 30 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 370, y: 290, content: '4', fontSize: 30 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 490, y: 290, content: '5', fontSize: 30 }, duration: 400 },
        { type: 'text', color: 'yellow', params: { x: 400, y: 160, content: 'O(n²) comparisons — every pass finds the next max', fontSize: 18 }, duration: 1200 },
      ],
    },
  ],
};

export const BFS_TRAVERSAL: Blueprint = {
  title: 'BFS Graph Traversal',
  domain: 'algebra',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'A graph is just nodes (circles) connected by edges (lines). BFS explores layer by layer, starting from one source node.',
      drawings: [
        { type: 'circle', color: 'white', params: { cx: 400, cy: 100, r: 30 }, duration: 700 },
        { type: 'circle', color: 'white', params: { cx: 220, cy: 240, r: 30 }, duration: 700 },
        { type: 'circle', color: 'white', params: { cx: 580, cy: 240, r: 30 }, duration: 700 },
        { type: 'circle', color: 'white', params: { cx: 140, cy: 400, r: 30 }, duration: 700 },
        { type: 'circle', color: 'white', params: { cx: 340, cy: 400, r: 30 }, duration: 700 },
        { type: 'line', color: 'white', params: { x1: 400, y1: 130, x2: 220, y2: 210 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 400, y1: 130, x2: 580, y2: 210 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 220, y1: 270, x2: 140, y2: 370 }, duration: 600 },
        { type: 'line', color: 'white', params: { x1: 220, y1: 270, x2: 340, y2: 370 }, duration: 600 },
        { type: 'text', color: 'white', params: { x: 400, y: 107, content: 'A', fontSize: 18 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 220, y: 247, content: 'B', fontSize: 18 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 580, y: 247, content: 'C', fontSize: 18 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 140, y: 407, content: 'D', fontSize: 18 }, duration: 400 },
        { type: 'text', color: 'white', params: { x: 340, y: 407, content: 'E', fontSize: 18 }, duration: 400 },
      ],
    },
    {
      id: 2,
      narration:
        'Start at node A. Mark it yellow (current), push its neighbors B and C into the queue. The queue is our to-do list.',
      drawings: [
        { type: 'circle', color: 'yellow', params: { cx: 400, cy: 100, r: 30 }, duration: 800 },
        { type: 'text', color: 'white', params: { x: 400, y: 107, content: 'A', fontSize: 18 }, duration: 400 },
        { type: 'rect', color: 'cyan', params: { x: 550, y: 440, width: 200, height: 50, fill: false }, duration: 700 },
        { type: 'text', color: 'cyan', params: { x: 600, y: 472, content: 'Queue: [B, C]', fontSize: 18 }, duration: 700 },
      ],
    },
    {
      id: 3,
      narration:
        'Dequeue B. Mark it green (visited). Enqueue its unvisited neighbors D and E. A becomes green too — done with it.',
      drawings: [
        { type: 'circle', color: 'green', params: { cx: 400, cy: 100, r: 30 }, duration: 600 },
        { type: 'circle', color: 'yellow', params: { cx: 220, cy: 240, r: 30 }, duration: 800 },
        { type: 'text', color: 'white', params: { x: 400, y: 107, content: 'A', fontSize: 18 }, duration: 300 },
        { type: 'text', color: 'white', params: { x: 220, y: 247, content: 'B', fontSize: 18 }, duration: 300 },
        { type: 'arrow', color: 'yellow', params: { x1: 400, y1: 130, x2: 225, y2: 212 }, duration: 900 },
        { type: 'text', color: 'cyan', params: { x: 600, y: 472, content: 'Queue: [C, D, E]', fontSize: 18 }, duration: 700 },
      ],
    },
    {
      id: 4,
      narration:
        'Continue: dequeue C, then D, then E. Each time, mark the node green. BFS guarantees we visit nodes in order of distance from A.',
      drawings: [
        { type: 'circle', color: 'green', params: { cx: 220, cy: 240, r: 30 }, duration: 600 },
        { type: 'circle', color: 'green', params: { cx: 580, cy: 240, r: 30 }, duration: 600 },
        { type: 'circle', color: 'green', params: { cx: 140, cy: 400, r: 30 }, duration: 600 },
        { type: 'circle', color: 'green', params: { cx: 340, cy: 400, r: 30 }, duration: 600 },
        { type: 'text', color: 'white', params: { x: 220, y: 247, content: 'B', fontSize: 18 }, duration: 300 },
        { type: 'text', color: 'white', params: { x: 580, y: 247, content: 'C', fontSize: 18 }, duration: 300 },
        { type: 'text', color: 'white', params: { x: 140, y: 407, content: 'D', fontSize: 18 }, duration: 300 },
        { type: 'text', color: 'white', params: { x: 340, y: 407, content: 'E', fontSize: 18 }, duration: 300 },
        { type: 'text', color: 'cyan',  params: { x: 600, y: 472, content: 'Queue: []', fontSize: 18 }, duration: 700 },
      ],
    },
    {
      id: 5,
      narration:
        'BFS order: A → B → C → D → E. Every node at distance 1 before distance 2. This guarantees shortest paths in unweighted graphs.',
      drawings: [
        { type: 'text', color: 'yellow', params: { x: 400, y: 530, content: 'BFS visits: A → B → C → D → E', fontSize: 22 }, duration: 1200 },
        { type: 'text', color: 'white',  params: { x: 400, y: 560, content: 'Time: O(V + E)   Space: O(V)', fontSize: 16 }, duration: 1000 },
      ],
    },
  ],
};

export const BINARY_SEARCH: Blueprint = {
  title: 'Binary Search',
  domain: 'algebra',
  strategy: 'decomposition',
  steps: [
    {
      id: 1,
      narration:
        'Binary search only works on a sorted array. We have 7 elements. Place pointers: low at [0], high at [6]. We\'re hunting for target = 14.',
      drawings: [
        { type: 'rect', color: 'white', params: { x: 60,  y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 160, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 260, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 360, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 460, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 560, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'rect', color: 'white', params: { x: 660, y: 240, width: 90, height: 70, fill: false }, duration: 500 },
        { type: 'text', color: 'orange', params: { x: 105, y: 285, content:  '2',  fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 205, y: 285, content:  '5',  fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 305, y: 285, content:  '8',  fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 405, y: 285, content:  '11', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 505, y: 285, content:  '14', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 605, y: 285, content:  '18', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'orange', params: { x: 705, y: 285, content:  '22', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'blue',   params: { x: 105, y: 330, content: 'L',   fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'red',    params: { x: 705, y: 330, content: 'H',   fontSize: 16 }, duration: 400 },
        { type: 'text', color: 'yellow', params: { x: 400, y: 170, content: 'Target = 14', fontSize: 24 }, duration: 700 },
      ],
    },
    {
      id: 2,
      narration:
        'Compute mid = (0+6)/2 = 3. Look at index 3: value is 11. Target 14 > 11, so search the RIGHT half. Move low to mid+1.',
      drawings: [
        { type: 'rect', color: 'yellow', params: { x: 360, y: 240, width: 90, height: 70, fill: true }, duration: 700 },
        { type: 'text', color: 'white',  params: { x: 405, y: 285, content: '11', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'yellow', params: { x: 405, y: 330, content: 'M',  fontSize: 16 }, duration: 400 },
        { type: 'arrow', color: 'blue', params: { x1: 105, y1: 360, x2: 505, y2: 360 }, duration: 900 },
        { type: 'text', color: 'blue',  params: { x: 505, y: 390, content: 'L → 4', fontSize: 16 }, duration: 600 },
        { type: 'text', color: 'white', params: { x: 400, y: 480, content: '14 > 11 → go right', fontSize: 20 }, duration: 800 },
      ],
    },
    {
      id: 3,
      narration:
        'Now search [4..6]. Mid = 5, value is 18. Target 14 < 18 — search the LEFT half. Move high to mid-1.',
      drawings: [
        { type: 'rect', color: 'yellow', params: { x: 560, y: 240, width: 90, height: 70, fill: true }, duration: 700 },
        { type: 'text', color: 'white',  params: { x: 605, y: 285, content: '18', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'yellow', params: { x: 605, y: 330, content: 'M',  fontSize: 16 }, duration: 400 },
        { type: 'arrow', color: 'red', params: { x1: 705, y1: 360, x2: 505, y2: 360 }, duration: 900 },
        { type: 'text', color: 'red',  params: { x: 550, y: 390, content: 'H → 4', fontSize: 16 }, duration: 600 },
        { type: 'text', color: 'white', params: { x: 400, y: 480, content: '14 < 18 → go left', fontSize: 20 }, duration: 800 },
      ],
    },
    {
      id: 4,
      narration:
        'Low = High = 4. Mid = 4, value is 14. Found it! The key insight: each step halves the search space — that\'s O(log n).',
      drawings: [
        { type: 'rect', color: 'green', params: { x: 460, y: 240, width: 90, height: 70, fill: true }, duration: 800 },
        { type: 'text', color: 'white', params: { x: 505, y: 285, content: '14', fontSize: 26 }, duration: 400 },
        { type: 'text', color: 'green', params: { x: 505, y: 330, content: 'FOUND', fontSize: 14 }, duration: 600 },
        { type: 'text', color: 'yellow', params: { x: 400, y: 460, content: 'O(log n) — halvings until 1 element remains', fontSize: 18 }, duration: 1200 },
        { type: 'text', color: 'green',  params: { x: 400, y: 510, content: '7 elements → at most 3 steps', fontSize: 18 }, duration: 900 },
      ],
    },
  ],
};

export const CS_FIXTURES: Record<string, Blueprint> = {
  'bubble sort': BUBBLE_SORT,
  'bfs traversal': BFS_TRAVERSAL,
  'bfs': BFS_TRAVERSAL,
  'binary search': BINARY_SEARCH,
};
