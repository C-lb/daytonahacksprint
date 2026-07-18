# jorkmate — hardcoded demo user profile

**Date:** 2026-07-18 · **Piece:** 3 of 3 (User Profile) · **Consumes:** nothing · **Consumed by:** Deck/Highlights match rendering (frontend), Profile tab (frontend), apply pipeline (backend Workday autofill)

This is the **single source of truth** for the seeded demo candidate. It ships in the repo so
the demo boots straight past onboarding with a profile already "Kimi-parsed" and loaded.
The JSON block at the bottom is lifted verbatim into `data/profile.json`.

## Why two layers

The profile carries two kinds of data, because two consumers need different things:

1. **Résumé layer** — `summary`, `work_history[]`, `education[]`, `skills` — this is what Kimi
   produces from the uploaded resume PDF, and what the Profile tab renders.
2. **Application-answer layer** — `application_answers` — the screening/eligibility fields a
   Workday form actually asks (work authorization, sponsorship, notice period, expected
   salary, EEO). The apply agent maps profile → form fields including these. Without this
   layer the apply pipeline stalls on the first screening question.

Both are honest-but-favorable per the design spec.

## The candidate

**Maya Tan** — Singapore-based full-stack software engineer, ~5 years, product-focused
(fintech + developer tools). Strong TypeScript/React + Node, ships prototype → production,
has led a small team. Singapore citizen → **no visa sponsorship needed** (removes the most
common Workday auto-reject and keeps the rehearsed apply flow clean).

Chosen so she is a strong match for the curated Workday deck (senior SWE / product-eng roles
at strong companies) → high Nosana match scores → a compelling demo.

### Onboarding industry picks (drives deck filter)

`Software & Developer Tools` · `Fintech` · `E-commerce`

## Field reference

| Field                | Value                       | Used by                          |
|----------------------|-----------------------------|----------------------------------|
| Full name            | Maya Tan                    | Profile tab, Workday name fields |
| Email                | maya.tan.dev@gmail.com      | Profile tab, Workday contact     |
| Phone                | +65 8123 4567               | Workday contact                  |
| Location             | Singapore                   | deck filter, Workday address     |
| LinkedIn             | linkedin.com/in/mayatan-dev | Workday "LinkedIn URL"           |
| Portfolio            | mayatan.dev                 | Workday "Website"                |
| Work authorization   | Singapore Citizen           | **Workday screening (critical)** |
| Requires sponsorship | No                          | **Workday screening (critical)** |
| Notice period        | 1 month                     | Workday screening                |
| Expected salary      | SGD 120,000–140,000 / yr    | Workday screening                |
| Willing to relocate  | Open (SG / remote)          | Workday screening                |
| EEO fields           | Prefer not to disclose      | Workday EEO section              |

## Reusable cover blurb

> Full-stack engineer with 5 years shipping product-facing systems in fintech and developer
> tools. I move fast from prototype to production, care about reliability and DX, and have led
> a small team through it. Excited to bring that to your team.

## `data/profile.json` (source of truth)

```json
{
  "id": "demo-maya-tan",
  "seeded": true,
  "kimi_parsed": true,
  "basics": {
    "full_name": "Maya Tan",
    "first_name": "Maya",
    "last_name": "Tan",
    "email": "maya.tan.dev@gmail.com",
    "phone": "+65 8123 4567",
    "location": "Singapore",
    "links": {
      "linkedin": "https://linkedin.com/in/mayatan-dev",
      "github": "https://github.com/mayatan",
      "portfolio": "https://mayatan.dev"
    }
  },
  "industries": ["Software & Developer Tools", "Fintech", "E-commerce"],
  "summary": "Full-stack software engineer with 5 years building product-facing systems in fintech and developer tools. Ships from prototype to production in TypeScript/React and Node, with a bias for reliability and developer experience. Led a 4-engineer team on checkout reliability.",
  "work_history": [
    {
      "company": "Grab",
      "title": "Senior Software Engineer",
      "location": "Singapore",
      "start": "2023-01",
      "end": "present",
      "highlights": [
        "Led checkout reliability workstream for GrabPay, cutting p99 payment latency 38%.",
        "Mentored 4 engineers; owned on-call playbooks that halved payment incident MTTR.",
        "Shipped an idempotent refunds service (Go + PostgreSQL) handling 2M+ txns/day."
      ]
    },
    {
      "company": "Shopee",
      "title": "Software Engineer",
      "location": "Singapore",
      "start": "2020-06",
      "end": "2022-12",
      "highlights": [
        "Built seller-analytics dashboards (React, Node, ClickHouse) used by 300k+ sellers.",
        "Cut dashboard load time from 6s to under 1s with query + caching redesign.",
        "Drove adoption of TypeScript and CI test gates across the seller-tools squad."
      ]
    },
    {
      "company": "GovTech Singapore",
      "title": "Software Engineer Intern",
      "location": "Singapore",
      "start": "2019-05",
      "end": "2019-11",
      "highlights": [
        "Prototyped an accessibility linter adopted into an internal design system."
      ]
    }
  ],
  "education": [
    {
      "school": "National University of Singapore",
      "degree": "B.Comp (Hons), Computer Science",
      "start": "2015-08",
      "end": "2019-05",
      "notes": "First Class Honours"
    }
  ],
  "skills": {
    "languages": ["TypeScript", "JavaScript", "Python", "Go", "SQL"],
    "frontend": ["React", "Next.js", "Tailwind CSS"],
    "backend": ["Node.js", "Express", "PostgreSQL", "Redis"],
    "cloud": ["AWS", "Docker", "Kubernetes"],
    "practices": ["CI/CD", "TDD", "Observability"]
  },
  "application_answers": {
    "work_authorization": "Authorized to work in Singapore (Singapore Citizen)",
    "requires_sponsorship": false,
    "willing_to_relocate": "Open to relocation (Singapore or remote)",
    "notice_period": "1 month",
    "earliest_start_date": "1 month from offer",
    "expected_salary": "SGD 120,000–140,000 per year",
    "salary_negotiable": true,
    "how_did_you_hear": "Company website",
    "gender": "Prefer not to disclose",
    "veteran_status": "Prefer not to disclose",
    "disability_status": "Prefer not to disclose",
    "cover_blurb": "Full-stack engineer with 5 years shipping product-facing systems in fintech and developer tools. I move fast from prototype to production, care about reliability and DX, and have led a small team through it. Excited to bring that to your team."
  },
  "resume_file": "data/resume-maya-tan.pdf"
}
```

## Notes for downstream pieces

- `resume_file` points at a PDF the apply agent uploads to Workday. Not yet created — a
  1-page PDF matching this profile is a small follow-up (or the apply flow can skip upload on
  tenants that allow it).
- `requires_sponsorship: false` is deliberate — the rehearsed apply target must not gate on
  sponsorship, or the demo dies on a screening dropdown.
- Field **names** here are the contract. Frontend renders `basics`/`work_history`/etc.;
  backend reads `application_answers`. Change a key → update both sides.
