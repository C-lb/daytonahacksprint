// Ask the ai& gateway a question straight from the terminal.
// Spends the ai& SPONSOR budget, not your Claude plan — use it to offload
// generation/Q&A off Claude.
//
//   node src/ask.mjs "your question"           # fast ai& model (deepseek) — quick
//   node src/ask.mjs --kimi "your question"    # route through Kimi via ai& (slow ~50s, big budget)
//   USE_KIMI=1 node src/ask.mjs "question"     # same, via env flag
//
// Reads keys from .env via sponsors.mjs. No deps.
import { reason, reasonSource } from './sponsors.mjs';

const args = process.argv.slice(2);
const useKimi = args[0] === '--kimi' ? (args.shift(), true) : false;
const question = args.join(' ').trim();

if (!question) {
  console.error('usage: node src/ask.mjs [--kimi] "your question"');
  process.exit(1);
}

const source = useKimi ? 'Kimi via ai&' : reasonSource();
process.stderr.write(`↳ asking ${source}${useKimi ? ' (reasoning model, ~50s)…' : '…'}\n`);

try {
  const answer = await reason([{ role: 'user', content: question }], useKimi ? { kimi: true } : {});
  console.log(answer || '(empty response — try --kimi with a real question, or raise max_tokens)');
} catch (e) {
  console.error(`ask failed: ${e.message}`);
  process.exit(1);
}
