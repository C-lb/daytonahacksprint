// Pings every sponsor with your .env keys. Run: node src/smoke.mjs
import { env, aiand, kimi, daytona, nosana, oxylabsGet } from './sponsors.mjs';

const ok = (s) => `\x1b[32m${s}\x1b[0m`, bad = (s) => `\x1b[31m${s}\x1b[0m`, dim = (s) => `\x1b[90m${s}\x1b[0m`;
const line = (name, good, msg) =>
  console.log(`[${good === null ? dim('SKIP') : good ? ok(' OK ') : bad('FAIL')}] ${name.padEnd(9)} ${msg}`);

async function run(name, need, fn) {
  if (need.some((k) => !env[k])) return line(name, null, `set ${need.filter((k) => !env[k]).join(', ')} in .env`);
  try { line(name, true, await fn()); } catch (e) { line(name, false, String(e.message).slice(0, 120)); }
}

console.log('\ndaytonahacksprint — key smoke test\n' + '-'.repeat(40));
await run('ai&', ['AIAND_API_KEY', 'AIAND_BASE_URL', 'AIAND_MODEL'],
  async () => `chat OK (${(await aiand([{ role: 'user', content: 'say pong' }], { max_tokens: 8 })) && env.AIAND_MODEL})`);
await run('Kimi', ['KIMI_API_KEY', 'KIMI_BASE_URL', 'KIMI_MODEL'],
  async () => `chat OK (${(await kimi([{ role: 'user', content: 'say pong' }], { max_tokens: 8 })) && env.KIMI_MODEL})`);
await run('Daytona', ['DAYTONA_API_KEY', 'DAYTONA_API_URL'],
  async () => `auth OK, ${(await daytona()).items.length} sandboxes`);
await run('Nosana', ['NOSANA_API_KEY', 'NOSANA_BASE_URL'],
  async () => `auth OK, ${(await nosana()).deployments.length} deployments`);
await run('Oxylabs', ['OXYLABS_USERNAME', 'OXYLABS_PASSWORD', 'OXYLABS_PROXY'],
  async () => { const j = JSON.parse(await oxylabsGet('https://ip.oxylabs.io/location')); return `IP ${j.ip || '?'}`; });
console.log('-'.repeat(40) + '\n');
