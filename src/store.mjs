// Tiny JSON-file store. data/<name>.json ⇄ JS values. Sync on purpose (hackathon).
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const load = (name) => JSON.parse(readFileSync(join(dataDir, name + '.json'), 'utf8'));
export function save(name, value) {
  const p = join(dataDir, name + '.json');
  writeFileSync(p + '.tmp', JSON.stringify(value, null, 2));
  renameSync(p + '.tmp', p); // atomic-ish: no torn reads while collaborating
}
