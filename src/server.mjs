// jorkmate server: serves the PWA + API, orchestrates the sponsor loop.
import express from 'express';
import { randomUUID } from 'node:crypto';
import { load, save } from './store.mjs';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(new URL('../web', import.meta.url).pathname));

// --- SSE plumbing: per-application event buffer + live subscribers ---
const buffers = new Map();   // appId -> [{step, message, screenshot?}]
const subscribers = new Map(); // appId -> Set<res>
export function emitStep(appId, message, screenshot = null) {
  const ev = { t: Date.now(), message, screenshot };
  (buffers.get(appId) ?? buffers.set(appId, []).get(appId)).push(ev);
  const apps = load('applications');
  const a = apps.find((x) => x.id === appId);
  if (a) { a.steps.push({ t: ev.t, message }); if (screenshot) a.screenshot = screenshot; save('applications', apps); }
  for (const res of subscribers.get(appId) ?? []) res.write(`data: ${JSON.stringify(ev)}\n\n`);
}
export function setStatus(appId, status) {
  const apps = load('applications');
  const a = apps.find((x) => x.id === appId);
  if (a) { a.status = status; save('applications', apps); }
  emitStep(appId, `status:${status}`);
}

app.get('/api/profile', (_q, res) => res.json(load('profile')));
app.post('/api/profile', (req, res) => { save('profile', { ...load('profile'), ...req.body }); res.json(load('profile')); });

app.post('/api/profile/resume', async (req, res) => {
  const { parseResume } = await import('./formfill.mjs');
  const parsed = await parseResume(req.body.text || '');
  const profile = { ...load('profile'), ...parsed, resumeText: req.body.text || '' };
  save('profile', profile);
  res.json(profile);
});

app.get('/api/deck', (_q, res) => {
  const p = load('profile');
  const applied = new Set(load('applications').map((a) => a.jobId));
  res.json(load('jobs').filter((j) => !applied.has(j.id) && (!p.industries.length || p.industries.includes(j.industry))));
});

app.get('/api/applications', (_q, res) => res.json(load('applications')));

app.post('/api/swipe', async (req, res) => {
  const { jobId, direction } = req.body;
  if (direction !== 'right') return res.json({ ok: true });
  const application = { id: randomUUID(), jobId, status: 'queued', steps: [], screenshot: null, createdAt: Date.now() };
  save('applications', [...load('applications'), application]);
  res.json({ ok: true, applicationId: application.id });
  runApply(application).catch((e) => { emitStep(application.id, `error: ${e.message}`); setStatus(application.id, 'failed'); });
});

// MOCK pipeline: same event shape as the real Daytona pipeline (Task 6).
// Kept forever behind MOCK_MODE=1 as the out-of-time / dead-wifi fallback.
const MOCK_STAGES = [
  [400, 'kimi is drafting your application…'],
  [1600, 'spinning up daytona sandbox…'],
  [3200, 'agent opening the posting…'],
  [5000, 'filling contact info…'],
  [7000, 'answering screening questions…'],
  [9000, 'submitted (mock mode)'],
];
async function mockRunApply(application) {
  setStatus(application.id, 'applying');
  let prev = 0;
  for (const [at, message] of MOCK_STAGES) {
    await new Promise((r) => setTimeout(r, at - prev)); prev = at;
    emitStep(application.id, message);
  }
  setStatus(application.id, 'submitted');
}
// Task 6 swaps in the real pipeline; MOCK_MODE=1 forces the mock regardless.
let realRunApply = null;
const runApply = (application) =>
  (process.env.MOCK_MODE === '1' || !realRunApply) ? mockRunApply(application) : realRunApply(application);
export const setRunApply = (fn) => { realRunApply = fn; };

app.post('/api/scrape', async (_q, res) => {
  const { scrapeAll } = await import('./scrape.mjs');
  const { scoreAll } = await import('./match.mjs');
  const added = await scrapeAll();
  scoreAll(); // fire-and-forget: new cards get scores as they compute
  res.json({ added });
});

app.get('/api/apply/:id/stream', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  for (const ev of buffers.get(req.params.id) ?? []) res.write(`data: ${JSON.stringify(ev)}\n\n`); // replay
  const set = subscribers.get(req.params.id) ?? subscribers.set(req.params.id, new Set()).get(req.params.id);
  set.add(res);
  req.on('close', () => set.delete(res));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`jorkmate on http://localhost:${port} (LAN: your-ip:${port})`));

import('./match.mjs').then(({ scoreAll }) => scoreAll()).catch(() => {});
