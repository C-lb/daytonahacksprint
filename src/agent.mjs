// Starter: an autonomous-researcher agent that exercises the full sponsor loop.
//   Oxylabs (ingest) -> ai&/Kimi (reason) -> Daytona (execute) -> [Nosana for heavy compute]
//
// Run:  node src/agent.mjs "your question" [url-to-scrape]
//   e.g. node src/agent.mjs "What is Daytona's sandbox cold-start latency?" https://www.daytona.io/docs/en/
//
// This is a TEMPLATE. Swap the question/URL logic for whatever you actually build.
import { reason, reasonSource, oxylabsGet, daytona, nosana, env } from './sponsors.mjs';

const question = process.argv[2] || 'Summarize the Daytona HackSprint sponsor stack.';
const url = process.argv[3]; // optional page to scrape for grounding

const htmlToText = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
   .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000);

async function main() {
  console.log(`\n❓ ${question}\n🧠 reasoning via ${reasonSource()}\n`);

  // 1) INGEST — grab live context through Oxylabs (skip if no URL given).
  let context = '';
  if (url) {
    try {
      console.log(`🌐 scraping ${url} via Oxylabs...`);
      context = htmlToText(await oxylabsGet(url));
      console.log(`   got ${context.length} chars of text\n`);
    } catch (e) { console.log(`   scrape failed (${e.message}); continuing without it\n`); }
  }

  // 2) REASON — ask the model to answer, and optionally emit a python snippet to run.
  const messages = [
    { role: 'system', content: 'You are a research agent. Answer concisely. If a calculation or data check would help, put runnable Python inside a single ```python fenced block; otherwise omit code.' },
    { role: 'user', content: context ? `Context:\n${context}\n\nQuestion: ${question}` : question },
  ];
  const answer = (await reason(messages, { max_tokens: 4096 })) || '(no content)';
  console.log('💬 answer:\n' + answer + '\n');

  // 3) EXECUTE — if the model produced code, run it safely in a Daytona sandbox.
  const code = (answer.match(/```python\s*([\s\S]*?)```/) || [])[1];
  if (code) {
    console.log('🏗️  executing generated code in a Daytona sandbox...');
    try {
      const { Daytona } = await import('@daytona/sdk'); // npm i @daytona/sdk
      const dt = new Daytona({ apiKey: env.DAYTONA_API_KEY, apiUrl: env.DAYTONA_API_URL });
      const sandbox = await dt.create();
      try {
        const res = await sandbox.process.codeRun(code);
        console.log('   output:\n' + (res.result || res.stdout || JSON.stringify(res)));
      } finally { await sandbox.delete?.(); }
    } catch (e) {
      console.log(`   Daytona exec skipped: ${e.message}`);
      console.log('   (run `npm i @daytona/sdk` to enable sandboxed execution)');
    }
  }

  // 4) HEAVY COMPUTE — dispatch GPU-bound work to Nosana here when you need it.
  //    const dep = await nosana('/deployments', { method: 'POST', body: JSON.stringify(jobSpec) });
  //    (needs SOL/NOS in the execution vault — see README.)
  void daytona; void nosana;

  console.log('\n✅ loop complete');
}

main().catch((e) => { console.error('agent error:', e.message); process.exit(1); });
