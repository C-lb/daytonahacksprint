// Kimi does the thinking: resume -> structured profile, profile+job -> Workday field map.
import { reason } from './sponsors.mjs';

const json = (text) => JSON.parse(text.match(/\{[\s\S]*\}/)[0]);

// Kimi via ai& sometimes degenerates into repetitive garbage. Fall back to ai& default model once.
async function askJson(content) {
  try {
    return json(await reason([{ role: 'user', content }], { kimi: true, max_tokens: 4096 }));
  } catch {
    return json(await reason([{ role: 'user', content }], { kimi: false, max_tokens: 1500 }));
  }
}

export async function parseResume(text) {
  return askJson(
    `Extract from this resume. Reply ONLY JSON {"work_history":[{"company","title","years"}],"education":[{"school","degree","years"}],"skills":["..."],"summary":"2 sentences"}.\n\nRESUME:\n${text.slice(0, 8000)}`);
}

export async function buildFieldMap(profile, job) {
  return askJson(
    `Candidate is applying to "${job.title}" at ${job.company} via Workday. Build the application payload. Reply ONLY JSON:
{"fields":{"firstName":"","lastName":"","email":"","phone":"","country":"Singapore","source":"Company website"},
 "answers":[{"question":"Why this role?","answer":"2-3 honest, favorable sentences"}]}
Use CANDIDATE.application_answers verbatim for screening questions (work authorization, sponsorship, notice period, salary, EEO) and CANDIDATE.application_answers.cover_blurb as the base for "why this role".
CANDIDATE: ${JSON.stringify(profile)}`);
}
