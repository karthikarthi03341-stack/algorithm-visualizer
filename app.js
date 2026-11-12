// ---- Configuration: point this at your deployed backend ----
const API = window.ALGOVIZ_API || "http://localhost:4000";

const $ = id => document.getElementById(id);
const state = {
  algos: [], current: "bubble", array: [], original: [],
  steps: [], pos: 0, playing: false, hl: {}, done: new Set(), pivot: -1,
  stats: { c: 0, w: 0, t: 0 }, acc: 0, last: 0,
};

async function api(path, options) {
  const res = await fetch(API + path, options);
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

async function init() {
  try {
    state.algos = await api("/api/algorithms");
    $("conn").textContent = "API connected";
  } catch (e) {
    $("conn").textContent = "API offline - start the backend";
    return;
  }
  $("algos").innerHTML = state.algos.map(a => `<button data-k="${a.id}">${a.name}</button>`).join("");
  $("algos").onclick = e => e.target.dataset.k && select(e.target.dataset.k);
  await select("bubble", true);
  requestAnimationFrame(loop);
}

async function newArray() {
  const { array } = await api("/api/array?size=" + $("size").value);
  state.array = array.slice();
  state.original = array.slice();
}

async function select(id, fresh) {
  state.current = id;
  document.querySelectorAll("#algos button").forEach(b => b.classList.toggle("on", b.dataset.k === id));
  const m = state.algos.find(a => a.id === id);
  $("aname").textContent = m.name;
  $("adesc").textContent = m.description;
  $("cx").innerHTML = [["Best", m.best], ["Average", m.average], ["Worst", m.worst],
    ["Space", m.space], ["Stable", m.stable ? "Yes" : "No"]]
    .map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("");
  await reset(fresh);
}

// Ask the backend for the full step trace, then replay it locally
async function reset(fresh) {
  state.playing = false;
  $("play").textContent = "Play";
  if (fresh || !state.original.length) await newArray();
  state.array = state.original.slice();
  const data = await api("/api/sort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ algorithm: state.current, array: state.original }),
  });
  state.steps = data.steps;
  state.pos = 0; state.hl = {}; state.done = new Set(); state.pivot = -1;
  state.stats = { c: 0, w: 0, t: 0 };
  $("status").textContent = `Ready - ${data.steps.length} steps computed in ${data.stats.computeMs} ms`;
  render();
}

function stepOnce() {
  const a = state.array, s = state.steps[state.pos];
  if (!s) {
    for (let i = 0; i < a.length; i++) state.done.add(i);
    state.hl = {}; state.pivot = -1; state.playing = false;
    $("play").textContent = "Play"; $("status").textContent = "Sorted";
    return false;
  }
  state.pos++; state.stats.t++; state.hl = {};
  const [k, i, j] = s;
  if (k === "c") { state.stats.c++; state.hl = { [i]: "c", [j]: "c" }; $("status").textContent = `Comparing ${i} and ${j}`; }
  else if (k === "s") { state.stats.w++; [a[i], a[j]] = [a[j], a[i]]; state.hl = { [i]: "s", [j]: "s" }; $("status").textContent = `Swapping ${i} and ${j}`; }
  else if (k === "w") { state.stats.w++; a[i] = j; state.hl = { [i]: "s" }; $("status").textContent = `Writing ${j} at ${i}`; }
  else if (k === "p") { state.pivot = i; $("status").textContent = `Pivot: ${a[i]}`; }
  else if (k === "d") { state.done.add(i); if (i === state.pivot) state.pivot = -1; }
  return true;
}

function render() {
  const { stats } = state;
  $("sc").textContent = stats.c; $("sw").textContent = stats.w; $("st").textContent = stats.t;
  const cv = $("cv"), dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const x = cv.getContext("2d"); x.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const col = { c: cs.getPropertyValue("--cmp"), s: cs.getPropertyValue("--swp"),
    b: cs.getPropertyValue("--bar"), o: cs.getPropertyValue("--ok"), p: cs.getPropertyValue("--piv") };
  const a = state.array, n = a.length, bw = (w - 16) / n, gap = n > 70 ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const bh = a[i] / n * (h - 20);
    x.fillStyle = state.hl[i] ? col[state.hl[i]] : i === state.pivot ? col.p : state.done.has(i) ? col.o : col.b;
    x.beginPath(); x.roundRect(8 + i * bw, h - bh - 6, Math.max(bw - gap, 1), bh, Math.min(3, bw / 3)); x.fill();
  }
}

function loop(t) {
  const dt = Math.min(t - state.last, 100); state.last = t;
  if (state.playing) {
    state.acc += dt / 1000 * Math.pow(10, $("speed").value * 3.3 / 100);
    while (state.acc >= 1 && state.playing) { state.acc--; stepOnce(); }
  }
  render();
  requestAnimationFrame(loop);
}

$("play").onclick = async () => {
  if (state.pos >= state.steps.length) await reset(true);
  state.playing = !state.playing;
  $("play").textContent = state.playing ? "Pause" : "Play";
};
$("step").onclick = () => { state.playing = false; $("play").textContent = "Play"; stepOnce(); };
$("shuf").onclick = () => reset(true);
$("size").onchange = () => reset(true);
$("theme").onclick = () => {
  const d = document.documentElement;
  d.dataset.theme = (d.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark" ? "light" : "dark";
};
init();
