# GymBuddy MVP — Feature Inventory

> AI fitness coach for budget / society-gym beginners in India. The hero action is the user tapping **"I trained today."**

**Live URLs**

- Primary: https://prototype-harshkumarsharma.web.app
- Alt: https://gymbuddy-prod-9ef54.web.app
- Repo: https://github.com/hksvibe/gymbuddy

Both URLs point at the same Firebase project (same Firestore, same Cloud Functions, same auth). Works on any mobile browser, no install required.

---

## 1 · Authentication & Identity

| Feature | Status | Notes |
|---|---|---|
| Google sign-in | ✅ Live | One-tap OAuth via Firebase Auth. UID persists across devices. |
| Guest mode | ✅ Live | Firebase Anonymous auth with graceful fallback to a local-only UID if anon isn't enabled. |
| Guest → Google upgrade | ✅ Live | `linkWithPopup` preserves progress; falls back cleanly if the Google account is already used. |
| Identity strip on Progress | ✅ Live | Shows Google avatar + email or "Guest mode" with a one-tap Sign-in nudge. |
| Sign out | ✅ Live | Clears local state + Firebase session. |
| Auth-ready gate | ✅ Live | Screens wait for Firebase Auth to restore session before firing Firestore reads (prevents empty state on refresh). |

## 2 · Onboarding (11–13 steps)

Every field is a single question per screen with a progress bar. Under ~90 seconds for a healthy user.

| Step | Field | Notes |
|---|---|---|
| 1 | Name + age + city | City optional. |
| 2 | Height (cm) + weight (kg) | Live BMI shown as a non-medical guide. |
| 3 | Goal | Fat loss · Muscle gain · General fitness · Get strong. |
| 4 | Experience | Never · <1m · 1–3m · 3–12m · >1y. |
| 5 | Days/week | 2–6, tap-to-select grid. |
| 6 | Session length | **25 · 30 · 45 min** (25 is the enforced floor). |
| 7 | Equipment | Photo capture (Firebase Storage → Groq vision) OR manual chips. Confirmed list is the source of truth. |
| 8 | Diet preference | Veg · Egg-veg · Non-veg. |
| 9 | Injuries | Multi-select — mandatory. |
| 10 | Medical conditions | Multi-select — mandatory. |
| 11 | Other constraints | Free-text (e.g. "no jumping", "evenings only"). |
| 12 | **General AI consent** | Mandatory checkbox. Logged. |
| 13 | **Chronic-condition consent** | Only shown if any medical condition selected. Mandatory checkbox. Logged. |

## 3 · Consent & Safety Log

Full audit trail per user for every acceptance.

- Firestore subcollection `users/{uid}/consents/{id}`
- Each record: `kind`, `version`, `accepted_at`, `text_hash`, `medical_conditions_at_accept[]`, `injuries_at_accept[]`
- Two consent kinds:
  - **General AI** — everyone. "GymBuddy is not medical advice, consult a doctor before starting."
  - **Chronic condition** — only if heart / high_bp / diabetes / asthma / pregnancy declared. "I will consult my doctor before starting."
- Text is versioned (`v1-2026-07-02`); version bumps if wording changes.
- `text_hash` = short deterministic hash of the exact text shown, for tamper-evident audit.

## 4 · Persistent Disclaimers

- Dismissible first-plan disclaimer on Home (`GymBuddy gives general fitness guidance, not medical advice…`).
- Non-medical disclaimer on the diet block.
- "Stop if you feel sharp pain" reminder inside every exercise card's form-cue disclosure.
- Amber safety-note banner referencing the user's own conditions ("we've kept heavy spinal loading out for your lower back").

## 5 · AI Plan Generation (Groq)

**Model:** `llama-3.3-70b-versatile` with `response_format: { type: "json_object" }` — JSON mode enforced.

Cloud Function `generatePlan` (region `asia-south1`) sends every profile field: age, height, weight, goal, experience, days/week, session length, equipment, diet, injuries, medical conditions, free-text constraints, and (from Week 2 onward) a full `last_week` summary.

**Server-side validation (`tryParse`)** — the response is rejected + retried once if:
- Fewer than 4 main-phase exercises on any day
- Missing warm-up or cool-down groups (checked implicitly)
- Any meal missing `ingredients` or `recipe`
- Any exercise missing `name`, `sets`, or `youtube_search_query`

**Client-side scrub** — even after LLM output passes, `filterUnavailableEquipment()` drops any main-phase exercise referencing gear the user doesn't have. Bodyweight is treated as universally available.

**Auto-regeneration** — if a stored plan looks stale (no phase tags, meals without recipes, etc.), Today silently regenerates on load with a subtle "Updating your plan…" banner.

## 6 · The Day (Today screen)

Every training day is split into three phase groups:

| Phase | Purpose | Duration |
|---|---|---|
| 🌅 **Warm-up (dynamic)** | Marching, arm circles, hip circles, squat-to-reach | ~4 min |
| 💪 **Main workout** | ≥ 4 exercises, sets × reps, RPE 6–7, beginner-safe compounds | 15–35 min |
| 🌬 **Cool-down (static stretch)** | Quad, hamstring, cross-body shoulder, child's pose | ~4 min |

- Big green "**I trained today**" hero button.
- Multi-day tab strip; each tab shows a ✓ if that day's session is logged.
- Felt capture (Easy / OK / Hard / Pain) shown before check-in.
- Pain response triggers a doctor-consult note + pattern swap next week.
- Express Workout toggle: trims the main phase to ~15 min; warm-up + cool-down stay.
- Per-exercise: name, sets × reps, RPE, plain-English "why", form cue, equipment chips, `Watch demo` + `Timer` buttons, done/skip toggle.

## 7 · Embedded YouTube Demos

- Cloud Function `resolveVideo` calls YouTube Data API v3 `search.list` with `videoEmbeddable=true`.
- Result cached back onto the plan's exercise (Firestore write via `updatePlanExerciseVideo`).
- Client renders `youtube.com/embed/<id>` in a full-screen IFrame modal.
- Graceful fallback to a YouTube search link if the API key is missing or returns nothing.

## 8 · Rest Timer per Exercise

Full-screen countdown modal with:

- Circular SVG countdown (green during hold phase, violet during rest)
- Set counter (`Set 2 of 3`)
- ±15s controls, reset, skip, play/pause
- 660Hz audible beep + haptic vibrate (`80-40-80` pattern) at each phase change
- Handles both rep-based (rest between sets) and hold-based (planks, stretches) exercises via `rest_seconds` / `hold_seconds` fields per exercise

## 9 · 10-Second Check-in

- Tap "I trained today" → saves a checkin doc immediately.
- Optional per-exercise done/skip toggles before check-in refine the payload.
- Optional felt tag (Easy / OK / Hard / Pain) recorded per session.
- Optional free-text note per check-in.
- Persisted to `users/{uid}/checkins/{id}`; survives refresh + cross-device.

## 10 · Diet with Ingredients + Recipes

Every meal card is expandable:

- Meal idea (e.g. "Rajma-chawal with cucumber salad")
- Approx protein grams (right-aligned)
- Prep minutes + approx kcal (subtitle)
- **Ingredients list** with quantities (e.g. "1 cup boiled rajma — soak overnight")
- **Numbered recipe steps** — beginner-friendly, budget-conscious Indian home cooking

Protein target is `weight_kg × goal-specific multiplier`, rounded to nearest 5g, clamped to `[40, 220]`:

- Muscle gain / strength: **1.7 g/kg**
- Fat loss: **1.8 g/kg** (higher to preserve lean mass in a deficit)
- General fitness: **1.4 g/kg**

Client mock planner + Cloud Function system prompt both apply the same formula.

## 11 · Weekly Review & Adaptive Next-Week

- Big completion ring (`67%`) with days-completed / days-planned.
- LLM-worthy summary line: "Solid effort last week. We swapped what you skipped."
- Stat cards: exercises done vs skipped.
- Felt-summary chips (💪 3 easy · 👍 2 ok · 😅 1 hard).
- Skipped exercises list — flags what next week will swap.
- Per-day status list with felt tag.

**"Generate Week N+1"** calls the Cloud Function with a full `last_week` payload including:

- `completion_pct` (unique day-labels checked in / days planned)
- `days_completed`
- Deduped `exercises_skipped`
- `felt_summary` counts (`easy`, `ok`, `hard`, `pain`)
- `equipment_changed` bool (comparing plan's `equipment_snapshot` to current profile)

**Adaptive rules enforced (client mock + server prompt):**

- `completion_pct < 60%` → simplify, keep volume flat, encouraging summary
- `60–85%` → keep difficulty, swap what was skipped
- `≥ 85%` → small progression on compounds only (add ~1 set)
- Any `pain` reported → remove/replace that movement pattern + caution note
- `equipment_changed = true` → full rebuild around the new list

## 12 · Progress Screen

- **KPI cards:** 🔥 week streak · 🏆 full weeks · 📈 total check-ins
- **Body tracker section** with big "Log today" button
- **Bar chart** of check-ins per week (violet done bars over lavender planned guides)
- **Motivational footer** copy tuned to streak length
- **Identity strip** — signed-in avatar + email, or guest with sign-in nudge

## 13 · Body Measurements Tracker

Daily/weekly logging of physical metrics.

- Bottom-sheet modal with:
  - Weight (kg) — primary
  - Collapsible tape: waist, chest, arms, thighs, hips (cm)
  - Body fat %
  - Free-text notes
- All fields optional per entry (log weight daily, tape measurements weekly)
- Persisted to `users/{uid}/measurements/{id}` with ISO timestamp + `logged_date`
- **Latest snapshot cards** show current value + delta since start (green ↓ for down, amber ↑ for up)
- **Weight trend chart** — custom SVG line chart with area fill (no external chart library)
- **History list** with per-row delete
- Saving a new weight **auto-updates** `users/{uid}.weight_kg` so next week's plan uses the current weight for its protein target

## 14 · My Gym (Equipment Editor)

- Photo re-scan or manual chip editing
- Live preview of canonical equipment list
- Equipment-source pill (`photo` / `manual` / `both`)
- Save → sets `equipment_changed = true` for the next week's adaptive plan build

## 15 · Equipment Detection (Vision AI)

- Cloud Function `detectEquipment` accepts up to 6 image URLs
- Each image sent to Groq `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal MoE)
- Prompt returns a JSON array of standard equipment names
- Results passed through `canonicalize()` — maps free-form aliases like "cable machine" → `cables`, "kb" → `kettlebell`, etc.
- Deduplicated + merged across all photos
- User confirms/edits before save

## 16 · Demo Seed

- One-tap "See a demo with sample data" link on Welcome
- Creates a fully populated user matching the spec's example: Rohan, 26, Pune, 172cm/78kg, fat loss goal, 3 days/week, 30-min sessions, dumbbells+bench+cables+treadmill, veg, lower_back injury, high_bp, "no jumping" constraint
- Also seeds 2 check-ins + a real plan
- Reviewers/graders can experience the populated state without doing full onboarding

---

## Data Model (Firestore)

```
users/{uid}
  profile fields — name, age, city, height_cm, weight_kg,
    goal, experience, days_per_week, session_length,
    equipment[], equipment_source, equipment_photo_urls[],
    diet_pref, injuries[], medical_conditions[],
    other_constraints, current_week, created_at

users/{uid}/plans/{planId}
  week_number, source (initial | adaptive), created_at,
  equipment_snapshot[], plan_json (see below)

users/{uid}/checkins/{checkinId}
  plan_id, week_number, day_label, checked_in_at,
  exercises_done[], exercises_skipped[], felt, note

users/{uid}/weekly_reviews/{reviewId}
  week_number, days_planned, days_completed,
  completion_pct, summary_text

users/{uid}/measurements/{id}
  logged_at, logged_date,
  weight_kg?, waist_cm?, chest_cm?, arms_cm?,
  thighs_cm?, hips_cm?, body_fat_pct?, notes?

users/{uid}/consents/{id}
  kind (general_ai | chronic_condition),
  version, accepted, accepted_at, text_hash,
  medical_conditions_at_accept[], injuries_at_accept[]
```

Storage bucket: `equipment_photos/{uid}/**` — owner-only read/write.

Per-user isolation enforced by `firestore.rules` and `storage.rules`:

```
allow read, write: if request.auth != null && request.auth.uid == uid;
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · Vite · TypeScript · Tailwind v4 · React Router |
| Backend | Firebase — Auth, Firestore, Storage, Cloud Functions v2 (asia-south1) |
| LLM (text) | Groq — `llama-3.3-70b-versatile` with JSON mode |
| LLM (vision) | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal) |
| Videos | YouTube Data API v3 (search + embedded IFrame) |
| Testing | Vitest — 39 unit tests |
| CI/Deploy | Firebase CLI (`firebase deploy`) |
| Secrets | Firebase Secret Manager (GROQ_API_KEY, YOUTUBE_API_KEY) |

---

## Explicitly out of scope (v2 backlog)

- Anti-boredom variety engine
- Push notifications / WhatsApp reminders
- Detailed calorie tracking
- Wearable integrations (Fitbit / Watch)
- Payments / subscriptions
- Social feed / community
- Trainer marketplace

---

## Testing

39 tests passing across 4 files. Coverage includes:

- **Mock planner contracts** — days count matches `days_per_week` clamp, min 4 mains per day, warm-up + cool-down always present, 25-min floor
- **Safety guardrails** — no overhead press for shoulder injury or high_bp, no deadlift for lower_back injury, "no jumping" constraint honored, doctor-consult mention on safety_note for high_bp
- **Adaptive logic** — no progression when completion <60%, small bump when ≥85%, pain-in-summary trigger, equipment-changed messaging
- **Weight-scaled protein** — heavier user gets higher target, muscle_gain in 1.5–2.0 g/kg range, fat_loss in 1.6–2.1 range, always rounded to 5g
- **Canonical equipment vocabulary** — alias mapping, dedup, whitespace/case handling
- **Session-length trimmer** — preserves compounds, drops accessories first, honors minimum-kept floor
- **Adaptive summary builder** — completion_pct math, felt_summary counts, equipment_changed detection independent of array order

Run with `npm test` from repo root.
