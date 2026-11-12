// Each algorithm returns an array of steps. Step format: [kind, i, j]
//   "c" compare positions i, j      "s" swap positions i, j
//   "w" write value j at position i "p" mark pivot at i
//   "d" mark position i as sorted

function bubble(a) {
  const steps = [], n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push(["c", j, j + 1]);
      if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; steps.push(["s", j, j + 1]); }
    }
    steps.push(["d", n - 1 - i]);
  }
  steps.push(["d", 0]);
  return steps;
}

function selection(a) {
  const steps = [], n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) {
      steps.push(["c", m, j]);
      if (a[j] < a[m]) m = j;
    }
    if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; steps.push(["s", i, m]); }
    steps.push(["d", i]);
  }
  steps.push(["d", n - 1]);
  return steps;
}

function insertion(a) {
  const steps = [["d", 0]];
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      steps.push(["c", j - 1, j]);
      if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; steps.push(["s", j - 1, j]); j--; }
      else break;
    }
    steps.push(["d", i]);
  }
  return steps;
}

function merge(a) {
  const steps = [];
  (function sort(lo, hi) {
    if (lo >= hi) return;
    const m = (lo + hi) >> 1;
    sort(lo, m); sort(m + 1, hi);
    const L = a.slice(lo, m + 1), R = a.slice(m + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) {
      steps.push(["c", lo + i, m + 1 + j]);
      a[k] = L[i] <= R[j] ? L[i++] : R[j++];
      steps.push(["w", k, a[k]]); k++;
    }
    while (i < L.length) { a[k] = L[i++]; steps.push(["w", k, a[k]]); k++; }
    while (j < R.length) { a[k] = R[j++]; steps.push(["w", k, a[k]]); k++; }
  })(0, a.length - 1);
  a.forEach((_, i) => steps.push(["d", i]));
  return steps;
}

function quick(a) {
  const steps = [];
  (function sort(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { steps.push(["d", lo]); return; }
    steps.push(["p", hi]);
    let i = lo;
    for (let j = lo; j < hi; j++) {
      steps.push(["c", j, hi]);
      if (a[j] < a[hi]) {
        if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; steps.push(["s", i, j]); }
        i++;
      }
    }
    if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; steps.push(["s", i, hi]); }
    steps.push(["d", i]);
    sort(lo, i - 1); sort(i + 1, hi);
  })(0, a.length - 1);
  return steps;
}

function heap(a) {
  const steps = [], n = a.length;
  function sift(i, size) {
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let b = i;
      if (l < size) { steps.push(["c", b, l]); if (a[l] > a[b]) b = l; }
      if (r < size) { steps.push(["c", b, r]); if (a[r] > a[b]) b = r; }
      if (b === i) return;
      [a[i], a[b]] = [a[b], a[i]]; steps.push(["s", i, b]); i = b;
    }
  }
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  for (let e = n - 1; e > 0; e--) {
    [a[0], a[e]] = [a[e], a[0]]; steps.push(["s", 0, e]); steps.push(["d", e]);
    sift(0, e);
  }
  steps.push(["d", 0]);
  return steps;
}

const INFO = {
  bubble:    { name: "Bubble sort",    description: "Repeatedly swaps adjacent out-of-order items so the largest value bubbles to the end.", best: "O(n)", average: "O(n^2)", worst: "O(n^2)", space: "O(1)", stable: true },
  selection: { name: "Selection sort", description: "Finds the minimum of the unsorted part and places it at the front.", best: "O(n^2)", average: "O(n^2)", worst: "O(n^2)", space: "O(1)", stable: false },
  insertion: { name: "Insertion sort", description: "Grows a sorted prefix by inserting each new item into place.", best: "O(n)", average: "O(n^2)", worst: "O(n^2)", space: "O(1)", stable: true },
  merge:     { name: "Merge sort",     description: "Splits the array in halves, sorts each, then merges them.", best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true },
  quick:     { name: "Quick sort",     description: "Partitions around a pivot, then recurses on both sides.", best: "O(n log n)", average: "O(n log n)", worst: "O(n^2)", space: "O(log n)", stable: false },
  heap:      { name: "Heap sort",      description: "Builds a max-heap, then repeatedly extracts the root.", best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: false },
};

const RUNNERS = { bubble, selection, insertion, merge, quick, heap };

module.exports = { INFO, RUNNERS };
