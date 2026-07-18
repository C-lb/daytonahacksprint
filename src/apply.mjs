// Right-swipe pipeline: Kimi field map -> Daytona sandbox -> Playwright -> SSE progress.
import { Daytona } from '@daytona/sdk';
import { readFileSync } from 'node:fs';
import { load } from './store.mjs';
import { buildFieldMap } from './formfill.mjs';
import { env } from './sponsors.mjs';

const SCRIPT = readFileSync(new URL('./apply_script.py', import.meta.url), 'utf8');

export function makeRunApply({ emitStep, setStatus }) {
  return async function runApply(application) {
    const job = load('jobs').find((j) => j.id === application.jobId);
    const profile = load('profile');
    setStatus(application.id, 'applying');

    emitStep(application.id, 'kimi is drafting your application…');
    const map = await buildFieldMap(profile, job);
    const b = profile.basics; // schema contract: demo-profile spec
    map.fields = { firstName: b.first_name, lastName: b.last_name, email: b.email, phone: b.phone, ...map.fields };

    emitStep(application.id, 'spinning up daytona sandbox…');
    const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY, apiUrl: env.DAYTONA_API_URL });
    const sandbox = await daytona.create({ language: 'python' });
    try {
      emitStep(application.id, 'installing browser in sandbox…');
      // NOTE: `playwright` CLI isn't on PATH after a --user pip install inside the
      // sandbox — must invoke it as `python -m playwright`. Verified against the
      // real sandbox (bare `playwright install` fails silently with exit 127).
      const install = await sandbox.process.executeCommand(
        'pip install playwright -q && python -m playwright install chromium --with-deps',
        undefined,
        undefined,
        600,
      );
      if (install.exitCode !== 0) {
        throw new Error(`browser install failed (exit ${install.exitCode}): ${(install.result || '').slice(-300)}`);
      }
      await sandbox.fs.uploadFile(Buffer.from(JSON.stringify({ fields: map.fields, answers: map.answers, url: job.url })), '/tmp/fieldmap.json');
      await sandbox.fs.uploadFile(Buffer.from(SCRIPT), '/tmp/apply_script.py');

      emitStep(application.id, 'agent is applying on workday…');
      const mode = env.APPLY_SUBMIT === '1' ? '--submit' : '';
      const result = await sandbox.process.executeCommand(`python /tmp/apply_script.py ${mode}`, undefined, undefined, 300);

      // Relay progress lines + screenshots produced by the script.
      for (const line of (result.result || '').split('\n').filter((l) => l.trim().startsWith('{'))) {
        try {
          const ev = JSON.parse(line);
          let shot = null;
          if (ev.shot) {
            const png = await sandbox.fs.downloadFile(ev.shot);
            shot = `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
          }
          emitStep(application.id, ev.message, shot);
        } catch { /* non-JSON noise */ }
      }
      if (result.exitCode !== 0) {
        throw new Error(`apply script crashed (exit ${result.exitCode}): ${(result.result || '').slice(-300)}`);
      }
      setStatus(application.id, 'submitted');
    } catch (e) {
      emitStep(application.id, `agent error: ${String(e.message).slice(0, 200)}`);
      setStatus(application.id, 'failed');
      throw e;
    } finally {
      await sandbox.delete().catch(() => {});
    }
  };
}
