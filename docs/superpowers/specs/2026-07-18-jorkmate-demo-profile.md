# jorkmate — hardcoded demo user profile

**Date:** 2026-07-18 · **Piece:** 3 of 3 (User Profile) · **Consumed by:** Deck/Highlights match rendering (frontend), Profile tab (frontend), apply pipeline (backend autofill)

Single source of truth for the seeded demo candidate. Ships in the repo so the demo boots
straight past onboarding with a profile already "Kimi-parsed" and loaded. The JSON block at the
bottom is lifted verbatim into `data/profile.json`.

> **Status:** core identity locked (below); background fields marked **`TBD → interview`** are
> pending the interview at the end of this doc. Fill them from the user's answers next.

## Why two layers

1. **Résumé layer** — `summary`, `education[]`, `work_history[]`, `projects[]`, `skills` —
   what Kimi produces from the resume PDF, and what the Profile tab renders.
2. **Application-answer layer** — `application_answers` — the screening/eligibility fields an
   ATS form actually asks (work authorization, sponsorship, EEO/demographics, availability).
   The apply agent maps profile → form fields. Without it the pipeline stalls on the first
   screening question. (See the field discovery in `2026-07-18-jorkmate-apply-fields.md`.)

## The candidate

**Nadine Park** — Singapore-based NUS Computer Science undergraduate (Class of 2027),
First Class Honours track, **4.99 / 5.00 GPA**. Singapore citizen → **no visa sponsorship
needed**. Now a clean fit for real **internship** postings (e.g., the Citadel *International
Equities – Intern (Asia)* form scanned in piece 2): student, GPA, graduation-date, and
availability fields all line up.

Email handle `nadine.aibuilder@gmail.com` suggests an AI focus — **confirm specialization +
flagship projects in the interview.**

### Locked facts (from user)

| Field | Value |
|---|---|
| Full name | Nadine Park |
| Email | nadine.aibuilder@gmail.com |
| Phone | +65 8800 1983 |
| School | National University of Singapore |
| Programme | Computer Science (Bachelor of Computing, Honours) |
| Duration | Aug 2023 – 31 May 2027 (expected) |
| GPA | 4.99 / 5.00 — First Class Honours |
| Spoken languages | English, Mandarin, Korean |
| Programming languages | Python, C++, JavaScript |
| Citizenship | Singapore Citizen |
| Nationality | Singaporean |
| Ethnicity | Korean |
| Requires sponsorship | No |

### Onboarding industry picks (drives deck filter) — DRAFT, confirm in interview

`Software & Developer Tools` · `Artificial Intelligence / ML` · `Quantitative Finance`

## What else to add (recommended fields)

Grouped by how much they help the demo / apply flow:

**High value (ATS forms ask these):**
- Online links — **LinkedIn, GitHub, portfolio/website** (Citadel form has an "optional links" field)
- **Internship / work experience** history (even one prior internship)
- **Availability window** for the internship (which months, e.g., Summer 2026)
- **Gender** for EEO sections (or "prefer not to disclose")
- Residential address in Singapore (some ATS require; can keep generic)

**Strong for match score + résumé:**
- **Flagship projects** (esp. AI — matches the handle)
- **Hackathon / competition** results (this is literally a hackathon — a win reads great)
- **Awards / scholarships** (Dean's List, merit/ASEAN scholarship, olympiads)
- **Frameworks & tools** beyond languages (React, PyTorch, TensorFlow, Node, cloud, etc.)
- **Relevant coursework / specialization track** (AI systems, ML, algorithms)
- **Extracurriculars / leadership** (NUS Hackers, teaching assistant, clubs)

**Optional / nice-to-have:**
- Certifications, publications/research, references, expected stipend, date of birth.

## `data/profile.json` (source of truth)

```json
{
  "id": "demo-nadine-park",
  "seeded": true,
  "kimi_parsed": true,
  "basics": {
    "full_name": "Nadine Park",
    "first_name": "Nadine",
    "last_name": "Park",
    "preferred_name": "Nadine",
    "email": "nadine.aibuilder@gmail.com",
    "phone": "+65 8800 1983",
    "location": "Singapore",
    "links": {
      "linkedin": "TBD → interview",
      "github": "TBD → interview",
      "portfolio": "TBD → interview"
    }
  },
  "demographics": {
    "citizenship": "Singapore Citizen",
    "nationality": "Singaporean",
    "ethnicity": "Korean",
    "gender": "TBD → interview",
    "date_of_birth": "TBD → interview (only if a form requires it)"
  },
  "languages": {
    "spoken": ["English", "Mandarin", "Korean"],
    "programming": ["Python", "C++", "JavaScript"]
  },
  "industries": ["Software & Developer Tools", "Artificial Intelligence / ML", "Quantitative Finance"],
  "summary": "DRAFT → interview: NUS Computer Science undergraduate (First Class Honours, 4.99/5.00 GPA), Class of 2027, building AI-driven software. Confirm focus, flagship work, and voice in the interview.",
  "education": [
    {
      "school": "National University of Singapore",
      "degree": "Bachelor of Computing (Honours), Computer Science",
      "start": "2023-08",
      "end": "2027-05-31",
      "expected_graduation": "2027-05-31",
      "gpa": "4.99",
      "gpa_scale": "5.0",
      "notes": "First Class Honours (on track)"
    }
  ],
  "skills": {
    "programming": ["Python", "C++", "JavaScript"],
    "frameworks_tools": ["TBD → interview"],
    "focus_areas": ["TBD → interview (AI/ML? confirm)"]
  },
  "work_history": [],
  "projects": [],
  "awards": [],
  "extracurriculars": [],
  "application_answers": {
    "work_authorization": "Authorized to work in Singapore (Singapore Citizen)",
    "requires_sponsorship": false,
    "nationality": "Singaporean",
    "ethnicity": "Korean",
    "gender": "TBD → interview",
    "veteran_status": "Prefer not to disclose",
    "disability_status": "Prefer not to disclose",
    "internship_availability": "TBD → interview",
    "earliest_start_date": "TBD → interview",
    "expected_salary": "TBD → interview (intern stipend; often left blank)",
    "how_did_you_hear": "TBD → interview",
    "cover_blurb": "DRAFT → interview"
  },
  "resume_file": "data/resume-nadine-park.pdf"
}
```

## Pending interview (fill these next)

`links` · `demographics.gender` · `skills.frameworks_tools` · `skills.focus_areas` ·
`summary` · `work_history[]` · `projects[]` · `awards[]` · `extracurriculars[]` ·
`application_answers.{gender, internship_availability, earliest_start_date, expected_salary, how_did_you_hear, cover_blurb}`

## Notes for downstream pieces

- **Apply map needs re-sync:** `2026-07-18-jorkmate-apply-fields.md` still maps the old
  `demo-maya-tan` (senior eng) → Citadel. Re-point it to `demo-nadine-park` after the
  interview: education becomes NUS 2023–2027, GPA 4.99/5.0, student intern answers. Nadine
  fits the intern form better than Maya did.
- `resume_file` → `data/resume-nadine-park.pdf` still needs generating.
- `requires_sponsorship: false` is deliberate — keeps the rehearsed apply off the top
  auto-reject.
- Field **names** here are the contract. Change a key → update frontend + backend.
