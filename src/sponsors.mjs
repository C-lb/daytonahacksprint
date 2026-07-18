// Thin clients for each Daytona HackSprint sponsor. All read from .env.
// Node 18+ (global fetch). No deps.
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const env = (() => {
  const e = { ...process.env };
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !e[m[1]]) e[m[1]] = m[2].trim();
    }
  } catch {}
  return e;
})();

// Generic OpenAI-compatible chat — works for ai&, Kimi, and any /v1 endpoint.
export async function chat({ base, key, model, messages, max_tokens = 512 }) {
  const r = await fetch(base.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  if (!r.ok) throw new Error(`chat ${r.status}: ${await r.text()}`);
  return (await r.json()).choices[0].message;
}

export const aiand = (messages, opts = {}) =>
  chat({ base: env.AIAND_BASE_URL, key: env.AIAND_API_KEY, model: opts.model || env.AIAND_MODEL, messages, ...opts });

export const kimi = (messages, opts = {}) =>
  chat({ base: env.KIMI_BASE_URL, key: env.KIMI_API_KEY, model: opts.model || env.KIMI_MODEL, messages, ...opts });

// Daytona — list sandboxes (auth probe / control-plane call).
export async function daytona(path = '/sandbox', init = {}) {
  const r = await fetch(env.DAYTONA_API_URL.replace(/\/$/, '') + path, {
    ...init, headers: { Authorization: 'Bearer ' + env.DAYTONA_API_KEY, ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`daytona ${r.status}: ${await r.text()}`);
  return r.json();
}

// Nosana — job/deployment API.
export async function nosana(path = '/deployments', init = {}) {
  const r = await fetch(env.NOSANA_BASE_URL.replace(/\/$/, '') + path, {
    ...init, headers: { Authorization: 'Bearer ' + env.NOSANA_API_KEY, ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`nosana ${r.status}: ${await r.text()}`);
  return r.json();
}

// Oxylabs — fetch a URL through the residential proxy (shells to curl; fetch has no proxy support).
export function oxylabsGet(targetUrl, geo = 'US') {
  const user = geo ? `${env.OXYLABS_USERNAME}-cc-${geo}` : env.OXYLABS_USERNAME;
  return new Promise((resolve, reject) => {
    execFile('curl', ['-s', '--max-time', '30', '-x', env.OXYLABS_PROXY, '-U', `${user}:${env.OXYLABS_PASSWORD}`, targetUrl],
      (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout)));
  });
}
