const express = require("express");
const cors = require("cors");
const { INFO, RUNNERS } = require("./algorithms");

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_SIZE = 200;

app.use(cors());              // allow the separately hosted frontend
app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// List all algorithms with metadata
app.get("/api/algorithms", (_req, res) => {
  res.json(Object.entries(INFO).map(([id, meta]) => ({ id, ...meta })));
});

// Generate a random shuffled array of a given size
app.get("/api/array", (req, res) => {
  const n = Math.min(Math.max(parseInt(req.query.size, 10) || 48, 4), MAX_SIZE);
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  res.json({ array: arr });
});

// Run an algorithm and return the full step trace
app.post("/api/sort", (req, res) => {
  const { algorithm, array } = req.body || {};
  if (!RUNNERS[algorithm]) return res.status(400).json({ error: "Unknown algorithm" });
  if (!Array.isArray(array) || array.length < 2 || array.length > MAX_SIZE ||
      !array.every(Number.isFinite)) {
    return res.status(400).json({ error: `array must hold 2-${MAX_SIZE} numbers` });
  }
  const work = array.slice();
  const t0 = process.hrtime.bigint();
  const steps = RUNNERS[algorithm](work);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  res.json({
    algorithm,
    steps,
    sorted: work,
    stats: {
      comparisons: steps.filter(s => s[0] === "c").length,
      swaps: steps.filter(s => s[0] === "s" || s[0] === "w").length,
      steps: steps.length,
      computeMs: +ms.toFixed(3),
    },
  });
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.listen(PORT, () => console.log(`AlgoViz API listening on http://localhost:${PORT}`));
