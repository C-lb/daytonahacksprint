// Hinge-style matchmaking: score profile↔job on the Nosana-deployed model.
// Falls back to reason() (ai&) so the deck never blocks on Nosana.
import { chat, reason, env } from './sponsors.mjs';
import { load, save } from './store.mjs';

const PROMPT = (p, j) => `You are a job matchmaker. Given CANDIDATE and JOB, reply ONLY with JSON {"score": 0-100, "blurb": "<one flirty-but-professional sentence on why they match, no em dashes>"}.
CANDIDATE: ${JSON.stringify({ skills: p.skills, summary: p.summary, work_history: p.work_history })}
JOB: ${JSON.stringify({ title: j.title, company: j.company, description: j.description?.slice(0, 800) })}`;

const parse = (text) => {
  const m = text.match(/\{[\s\S]*\}/);
  const o = JSON.parse(m[0]);
  return { score: Math.max(0, Math.min(100, Number(o.score) || 0)), blurb: String(o.blurb || '').slice(0, 140) };
};

export async function scoreJob(profile, job) {
  if (process.env.MOCK_MODE === '1') { // fallback: deterministic pseudo-score, no network
    const h = [...(job.id + job.title)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
    return { score: 62 + (h % 35), blurb: `Your ${profile.skills.languages?.[0] ?? 'stack'} background fits ${job.company}.`, via: 'mock' };
  }
  const messages = [{ role: 'user', content: PROMPT(profile, job) }];
  try {
    if (!env.NOSANA_INFERENCE_URL) throw new Error('no nosana inference url');
    const m = await chat({ base: env.NOSANA_INFERENCE_URL, key: env.NOSANA_API_KEY, model: env.NOSANA_INFERENCE_MODEL || 'llama3', messages, max_tokens: 200, temperature: 0.4 });
    return { ...parse(m.content), via: 'nosana' };
  } catch {
    return { ...parse(await reason(messages, { max_tokens: 300 })), via: 'fallback' };
  }
}

export async function scoreAll() {
  const profile = load('profile');
  const jobs = load('jobs');
  for (const job of jobs.filter((j) => !j.match)) {
    try { job.match = await scoreJob(profile, job); save('jobs', jobs); console.log(`scored ${job.id}: ${job.match.score} (${job.match.via})`); }
    catch (e) { console.log(`score failed ${job.id}: ${e.message}`); }
  }
}
