# jorkmate — apply field discovery + deterministic fill map

**Date:** 2026-07-18 · **Piece:** 2 (Sample job application) · **Source:** real live form,
scanned in-browser · **Profile:** `demo-maya-tan`

Reference application used to determine the fields an apply agent must fill:

> **Citadel — International Equities – Intern (Asia)** · Hong Kong, Singapore
> https://www.citadel.com/careers/details/international-equities-intern-asia/

## Key finding: not Workday

Citadel's form is a **custom Jobvite-style form**, not Workday. Field names follow
`profile[...]` (built-ins) and `answers[][<uuid>]` (per-posting screening questions):

- Built-in profile fields have **stable, human-readable** names (`profile[first_name]`,
  `profile[education][new0][school]`) — portable across Jobvite tenants.
- Screening questions are keyed by **per-posting UUIDs** (`answers[][478bcea7-…]`) — these
  change per job, so they must be scanned per posting, not hardcoded globally.

**Implication for the pipeline:** the design-spec assumption of one universal Workday
selector scheme is wrong in general. The correct model (and what the user asked for) is
**scan-once-per-posting → freeze `name`→value map → deterministic fill**. The `name`
attribute is the stable join key between scan and fill.

## Field inventory (19 questions / 28 controls)

`*` = required.

### Personal Information
| # | Req | Type | Prompt | `name` | Options |
|---|---|---|---|---|---|
| 1 | * | text | First Name | `profile[first_name]` | |
| 2 | * | text | Last Name | `profile[last_name]` | |
| 3 |   | text | Preferred Name | `profile[preferred_name]` | |
| 4 | * | email | Email | `email` | |
| 5 | * | tel | Phone Number | `profile[phones][]` | |
| 6 |   | text | Current or Most Recent Employer | `profile[current_employer]` | |
| 7 | * | file | Resume | `resume` | .pdf .doc .docx .txt, ≤10MB |

### Education History
| # | Req | Type | Prompt | `name` | Options |
|---|---|---|---|---|---|
| 8 | * | text | College / University / School | `profile[education][new0][school]` | |
| 9 | * | select | Degree | `profile[education][new0][degree_type]` | Associate, Bachelors, Certificate, Diploma, Doctorate, Post-Doctorate, Masters, J.D., M.D., LL.M., Other |
| 10 | * | select | Major | `profile[education][new0][degree_major]` | Computer Science, Engineering, Mathematics, Physics, Economics, Finance, Business, Statistics, Other |
| 11 | * | text | GPA | `profile[education][new0][degree_measure][value]` | |
| 12 | * | select | GPA Scale | `profile[education][new0][degree_measure][highest_value]` | 4.0, 5.0, 0-100 |
| 13 | * | date | Start Date | `profile[education][new0][from]` | |
| 14 | * | date | Graduation Date | `profile[education][new0][to]` | |

### Additional Questions
| # | Req | Type | Prompt | `name` | Options |
|---|---|---|---|---|---|
| 15 | * | radio | Which is your preferred office location? Choose one | `profile[preferred_office_location]` | Hong Kong, Singapore |
| 16 |   | checkbox | Select all other office locations you are willing to work from | `profile[other_office_locations][]` | Hong Kong, Singapore |
| 17 | * | radio | If you completed an internship this summer, indicate whether you received a return offer | `profile[internship_return_offer]` | Yes, No |
| 18 | * | radio | Are you in any late stage processes with competing companies, including offer stage? | `profile[has_competing_offers]` | Yes, No |
| 19 | * | select | Do you now, or will you in the future, need sponsorship from an employer to work in the country this job is posted in? | `answers[][478bcea7-8865-4e37-99cf-96e30b91f7cf]` | Yes, No |
| 20 |   | checkbox | Signature internship program runs Jun–Aug; indicate your timing preferences | `answers[][4147d252-83f9-4296-941e-ff3d4e0f6eff]` | June - August, September - December, January - April |
| 21 | * | select | Do you have family members currently employed at Citadel or Citadel Securities? | `answers[][365f8ceb-67e8-4f58-a40a-c1d832649592]` | Yes, No |
| 22 |   | text | Optional links (LinkedIn / portfolio / GitHub) | `profile[optional_links][]` | |

## Deterministic fill map — Maya Tan

The apply agent's contract: for each `name` key, `querySelector('[name="<key>"]')`, then fill
`value` (text/select) / click matching option(s) (radio/checkbox) / upload file (file).
Frozen — no per-apply LLM call needed once generated. (Kimi/ai& is what *generates* the
open-ended `value`s at build time; the frozen result is deterministic.)

```json
{
  "job": {
    "company": "Citadel",
    "title": "International Equities – Intern (Asia)",
    "location": "Hong Kong, Singapore",
    "url": "https://www.citadel.com/careers/details/international-equities-intern-asia/",
    "ats": "custom Jobvite-style (profile[...] + answers[][uuid])",
    "scanned": "2026-07-18"
  },
  "profile_ref": "demo-maya-tan",
  "fields": {
    "profile[first_name]":        { "type": "text",  "required": true,  "value": "Maya" },
    "profile[last_name]":         { "type": "text",  "required": true,  "value": "Tan" },
    "profile[preferred_name]":    { "type": "text",  "required": false, "value": "Maya" },
    "email":                      { "type": "email", "required": true,  "value": "maya.tan.dev@gmail.com" },
    "profile[phones][]":          { "type": "tel",   "required": true,  "value": "+65 8123 4567" },
    "profile[current_employer]":  { "type": "text",  "required": false, "value": "Grab" },
    "resume":                     { "type": "file",  "required": true,  "value": "data/resume-maya-tan.pdf" },
    "profile[education][new0][school]": { "type": "text", "required": true, "value": "National University of Singapore" },
    "profile[education][new0][degree_type]":  { "type": "select", "required": true, "value": "Bachelors",
      "options": ["Associate","Bachelors","Certificate","Diploma","Doctorate","Post-Doctorate","Masters","J.D.","M.D.","LL.M.","Other"] },
    "profile[education][new0][degree_major]": { "type": "select", "required": true, "value": "Computer Science",
      "options": ["Computer Science","Engineering","Mathematics","Physics","Economics","Finance","Business","Statistics","Other"] },
    "profile[education][new0][degree_measure][value]":         { "type": "text",   "required": true, "value": "4.8" },
    "profile[education][new0][degree_measure][highest_value]": { "type": "select", "required": true, "value": "5.0",
      "options": ["4.0","5.0","0-100"] },
    "profile[education][new0][from]": { "type": "date", "required": true, "value": "2015-08-01" },
    "profile[education][new0][to]":   { "type": "date", "required": true, "value": "2019-05-01" },
    "profile[preferred_office_location]": { "type": "radio", "required": true, "value": "Singapore",
      "options": ["Hong Kong","Singapore"] },
    "profile[other_office_locations][]": { "type": "checkbox", "required": false, "value": ["Hong Kong"],
      "options": ["Hong Kong","Singapore"] },
    "profile[internship_return_offer]": { "type": "radio", "required": true, "value": "No",
      "options": ["Yes","No"] },
    "profile[has_competing_offers]": { "type": "radio", "required": true, "value": "No",
      "options": ["Yes","No"] },
    "answers[][478bcea7-8865-4e37-99cf-96e30b91f7cf]": { "type": "select", "required": true, "value": "No",
      "options": ["Yes","No"], "prompt": "sponsorship needed to work in posting country" },
    "answers[][4147d252-83f9-4296-941e-ff3d4e0f6eff]": { "type": "checkbox", "required": false, "value": ["June - August"],
      "options": ["June - August","September - December","January - April"], "prompt": "internship timing preference" },
    "answers[][365f8ceb-67e8-4f58-a40a-c1d832649592]": { "type": "select", "required": true, "value": "No",
      "options": ["Yes","No"], "prompt": "family employed at Citadel" },
    "profile[optional_links][]": { "type": "text", "required": false, "value": "https://linkedin.com/in/mayatan-dev" }
  }
}
```

### Mapping rationale (honest-but-favorable)
- **Sponsorship = No** — Maya is a Singapore citizen; job is posted in HK/SG. Removes the top auto-reject.
- **GPA 4.8 / 5.0** — NUS uses a 5.0 CAP; First Class Honours ≈ 4.5+. Truthful to the profile.
- **Preferred office = Singapore**, willing to also work Hong Kong.
- **Return offer = No, Competing offers = No, Family at Citadel = No** — clean, honest defaults.
- **Degree = Bachelors, Major = Computer Science** — from the profile's NUS B.Comp.

## Testability

Deterministic because the map is keyed by the form's own `name` attributes. Two checks:
1. **Static (runs now):** every `required:true` field has a non-empty `value`; every
   select/radio `value` ∈ its `options`; every checkbox `value[]` ⊆ `options`. Validated on
   commit (see below).
2. **Live (apply pipeline):** Playwright in a Daytona sandbox loads this map, fills each
   `[name=…]`, screenshots, and stops before final submit in dev — the rehearsed apply.

## Follow-ups
- `data/resume-maya-tan.pdf` still needs generating (1-page PDF matching the profile).
- When the backend apply lane starts, promote this JSON to `data/apply-maps/citadel-intl-equities.json`.
- Screening-question UUIDs are Citadel-posting-specific; re-scan per posting.
