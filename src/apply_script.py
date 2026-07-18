# Workday apply agent. Workday renders stable data-automation-id attributes across tenants.
import json, sys, time
from playwright.sync_api import sync_playwright

job = json.load(open('/tmp/fieldmap.json'))
fields, url = job['fields'], job['url']
step_n = 0
def step(msg, page=None):
    global step_n; step_n += 1
    shot = None
    if page:
        shot = f'/tmp/shot_{step_n}.png'
        page.screenshot(path=shot)
    print(json.dumps({'message': msg, 'shot': shot}), flush=True)
    open('/tmp/progress.jsonl', 'a').write(json.dumps({'message': msg, 'shot': shot}) + '\n')

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    step('opening posting')
    page.goto(url, timeout=60000)
    step('posting loaded', page)
    page.click('[data-automation-id="adventureButton"]', timeout=30000)  # "Apply"
    step('apply clicked', page)
    # Apply manually / autofill path varies; guest apply flow:
    try:
        page.click('[data-automation-id="applyManually"]', timeout=15000)
        step('apply manually selected', page)
    except Exception:
        step('no apply-manually step, continuing', page)
    # Account creation / sign-in wall: create throwaway from fields
    try:
        page.fill('[data-automation-id="email"]', fields['email'], timeout=15000)
        page.fill('[data-automation-id="password"]', 'JorkmateDemo!24')
        page.fill('[data-automation-id="verifyPassword"]', 'JorkmateDemo!24')
        page.check('[data-automation-id="createAccountCheckbox"]', timeout=5000)
        page.click('[data-automation-id="createAccountSubmitButton"]')
        step('account created', page)
    except Exception as e:
        step(f'account wall variant: {e.args[0][:80] if e.args else e}', page)
    # Contact info page
    for fid, key in [('legalNameSection_firstName','firstName'), ('legalNameSection_lastName','lastName'), ('phone-number','phone')]:
        try: page.fill(f'[data-automation-id="{fid}"]', fields.get(key, ''), timeout=10000)
        except Exception: step(f'skip field {fid}')
    step('contact info filled', page)
    if '--submit' in sys.argv:
        page.click('[data-automation-id="bottom-navigation-next-button"]')
        step('submitted (next page reached)', page)
    else:
        step('stopped before submit (rehearsal mode)', page)
    browser.close()
step('done')
