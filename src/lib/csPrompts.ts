/** Suggestion chip labels for the CS / algorithms workspace (order = UI left-to-right). */
export const CS_SUGGESTION_CHIPS = [
  'Bubble Sort',
  'Quicksort Partition',
  'BFS Traversal',
  'DFS Traversal',
  'Recursion Tree',
  'Hash Collision',
  'Red-Black Insert',
  'Merge Sort',
] as const;

/**
 * Rich prompts for CS suggestion chips so the model builds a detailed
 * visualization for each topic.
 */
export const CS_SUGGESTION_TO_PROMPT: Record<(typeof CS_SUGGESTION_CHIPS)[number], string> = {
  'Bubble Sort':
    'Visual chalkboard lesson on bubble sort: draw a row of 5-6 labeled rectangles representing an unsorted array. Animate one full pass highlighting adjacent pairs with yellow boxes, swap arrows in red for out-of-order pairs, and show the largest element "bubbling" to the end in green. Mark the sorted suffix with green fills. Narrate: colors encode state — yellow = comparing, red-arrow = swap, green = settled. End with O(n²) complexity intuition.',
  'Quicksort Partition':
    'Visual chalkboard lesson on quicksort partition: draw an array of 7 elements, mark the rightmost as pivot in red. Show a left pointer (blue L arrow) and right pointer scanning inward, swapping elements larger than pivot to the right side. Highlight each comparison in yellow, draw swap arrows in orange, and finally place the pivot into its correct sorted position in green. Narrate the divide-and-conquer intuition: pivot lands in its exact final spot, splitting the problem.',
  'BFS Traversal':
    'Visual chalkboard lesson on Breadth-First Search: draw a small graph of 6 nodes as white circles connected by lines. Start at a source node, color it yellow (current). Show the queue as a row of labeled boxes. Step through each level: enqueue neighbors (blue), dequeue and mark visited (green), draw the BFS tree edges as bold arrows. Narrate: BFS explores layer by layer — nodes at distance 1 before distance 2 — guaranteeing shortest path in unweighted graphs.',
  'DFS Traversal':
    'Visual chalkboard lesson on Depth-First Search: draw a tree (5-6 nodes as circles). Show the recursion stack as a column of labeled boxes on the side. DFS dives deep first — color the current node yellow, visited nodes green, and draw tree-edge arrows. When backtracking, show nodes popping off the stack in red. Narrate: DFS explores one full branch before backtracking — uses O(depth) stack space versus BFS\'s O(width).',
  'Recursion Tree':
    'Visual chalkboard lesson on recursion trees using fib(4) as example: draw each recursive call as a labeled box. Show fib(4) splitting into fib(3) and fib(2), each splitting further. Color repeated subproblems in red to show overlapping work. Draw indented levels showing the call stack depth. Narrate: without memoization, fib(n) recomputes the same values exponentially. Add a note showing how memoization (green checkmarks) prunes the tree to O(n).',
  'Hash Collision':
    'Visual chalkboard lesson on hash table collisions: draw an array of 7 "bucket" rectangles numbered 0-6 as the hash table. Insert 4 keys using hash(key) = key mod 7, showing arrows from each key to its bucket. Then insert a key that collides with an existing one (same bucket). Show chaining: draw a small linked list of circles hanging below the bucket. Narrate: a good hash function distributes keys uniformly; chaining lets us handle any number of collisions at the cost of O(n/k) lookup in the worst case.',
  'Red-Black Insert':
    'Visual chalkboard lesson on red-black tree insertion: draw a small BST with nodes as circles, coloring each node red or black as per RB rules. Insert a new node (yellow), show it landing as a red leaf. Then trigger a "uncle is red" case — recolor parent and uncle black, grandparent red. Draw rotation arrows if needed for the "uncle is black" case. Narrate: red-black trees maintain balance via color invariants, guaranteeing O(log n) height without costly full rebalancing on every insertion.',
  'Merge Sort':
    'Visual chalkboard lesson on merge sort: draw an array of 6 elements. Show the divide phase splitting it into halves recursively (draw a binary split tree top-down with dashed lines). Then show the merge phase: two sorted sub-arrays side by side, with a pointer in each and arrows showing which smaller element gets picked into the result array. Color merged elements green. Narrate: divide-and-conquer — split in O(log n) levels, merge in O(n) per level, total O(n log n). This is optimal for comparison-based sorting.',
};

export function csPromptForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return t;
  if (t in CS_SUGGESTION_TO_PROMPT)
    return CS_SUGGESTION_TO_PROMPT[t as keyof typeof CS_SUGGESTION_TO_PROMPT];
  return `Create a step-by-step visual chalkboard explanation (800×600 canvas) for the computer science concept: ${t}. Use labeled diagrams (arrays as rows of rectangles, trees as circles connected by lines, graphs as points+lines). Colors encode state: visited=green, current=yellow, pivot/key=red, unvisited=white. Each step narrates the algorithmic intuition.`;
}

export function displayCsTopicForUserConcept(input: string): string {
  const t = input.trim();
  if (!t) return '';
  if (t in CS_SUGGESTION_TO_PROMPT) return t;
  return t.length > 64 ? `${t.slice(0, 62)}…` : t;
}
