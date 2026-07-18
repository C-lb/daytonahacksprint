// Scrape Workday postings through Oxylabs residential proxy.
// Workday CXS API: POST {site}/wday/cxs/{tenant}/{siteName}/jobs {"limit":20,"offset":0,"searchText":""}
import { execFile } from 'node:child_process';
import { env } from './sponsors.mjs';
import { load, save } from './store.mjs';

function oxylabsPost(url, body) {
  return new Promise((resolve, reject) => {
    execFile('curl', ['-s', '--max-time', '40', '-x', env.OXYLABS_PROXY, '-U', `${env.OXYLABS_USERNAME}:${env.OXYLABS_PASSWORD}`,
      '-X', 'POST', '-H', 'Content-Type: application/json', '-d', JSON.stringify(body), url],
      (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout)));
  });
}

// https://nvidia.wd5.myworkdayjobs.com/SiteName -> cxs jobs endpoint
const cxsUrl = (siteUrl) => {
  const u = new URL(siteUrl);
  const tenant = u.hostname.split('.')[0];
  const site = u.pathname.split('/').filter(Boolean).pop();
  return `${u.origin}/wday/cxs/${tenant}/${site}/jobs`;
};

export async function scrapeAll() {
  if (process.env.MOCK_MODE === '1') { console.log('mock mode: scrape skipped, seeded deck only'); return 0; }
  const jobs = load('jobs');
  const seen = new Set(jobs.map((j) => j.url));
  let added = 0;
  for (const site of load('sites')) {
    try {
      const raw = await oxylabsPost(cxsUrl(site.url), { limit: 20, offset: 0, searchText: '', appliedFacets: {} });
      for (const p of JSON.parse(raw).jobPostings ?? []) {
        const url = new URL(site.url).origin + new URL(site.url).pathname + p.externalPath;
        if (seen.has(url)) continue;
        seen.add(url); added++;
        jobs.push({ id: `job-${Date.now()}-${added}`, company: site.company, title: p.title,
          location: p.locationsText ?? '', salary: null, url, industry: site.industry ?? 'Software & Developer Tools',
          description: p.title, match: null });
      }
      console.log(`${site.company}: ok`);
    } catch (e) { console.log(`${site.company}: ${e.message}`); }
  }
  save('jobs', jobs);
  return added;
}

if (import.meta.url === `file://${process.argv[1]}`) scrapeAll().then((n) => console.log(`${n} new jobs`));
