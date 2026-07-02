# GymBuddy

AI fitness coach for budget gym beginners in India. The hero action is the user tapping **"I trained today."** Everything else serves that.

Built against the *GymBuddy MVP Build Spec (for Claude)* — the four required capabilities (equipment-by-photo, full-constraint plan generation, embedded YouTube demos, weekly adaptive regeneration) all work end-to-end.

## Stack

- **Frontend** — React 19 + Vite + TypeScript + Tailwind v4 (mobile-first, 390px-target). React Router for screens. YouTube IFrame embed.
- **Backend** — Firebase Auth (anonymous + email/phone), Firestore, Storage, Cloud Functions v2 (TypeScript, region `asia-south1`).
- **LLM** — **Groq** for both text plans (`llama-3.3-70b-versatile` with JSON mode) and equipment-photo vision (`llama-4-scout-17b-16e-instruct`, multimodal). Same provider, single key.
- **Videos** — YouTube Data API v3 `search.list` → cached `video_id` → in-app embedded player. Search-link fallback when the key is missing.

## What runs without any backend

The app boots and runs end-to-end with **zero** Firebase config or API keys:

- Auth becomes a guest-only local UID.
- Data persists in `localStorage` (profile, plans, check-ins, weekly reviews).
- Plan generation runs the offline **mock planner** in [src/lib/api.ts](src/lib/api.ts) which honours equipment + injuries + medical + session length + the "no jumping" constraint.
- Photo capture stores data URLs and detection returns a sensible starter pack.
- Video demos fall back to YouTube-search links (still in-app via IFrame attempt).

The moment `.env.local` is set with Firebase config, the app switches to Firestore/Storage/Functions automatically — no code change.

## Setup

```bash
npm install
cp .env.example .env.local                 # fill from Firebase Console once project exists
npm run dev                                # http://localhost:5173
```

Tests:

```bash
npm test                                   # 33 unit tests covering the mock planner,
                                           # adaptive logic, canonical equipment vocab,
                                           # and the session-length trimmer
```

## Firebase project setup (one-time)

1. Create project `gymbuddy-prod` at https://console.firebase.google.com.
2. Add a Web app → copy the config values into `.env.local` (the keys in `.env.example`).
3. Enable Auth → Anonymous + Email Link (or Phone).
4. Enable Firestore in production mode (rules will be deployed below).
5. Enable Storage (rules will be deployed below).
6. Install the Firebase CLI:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use gymbuddy-prod
   ```

## Secrets (Cloud Functions only)

Never commit. Set on the project, not in any `.env`:

```bash
firebase functions:secrets:set GROQ_API_KEY        # required — plans + vision
firebase functions:secrets:set YOUTUBE_API_KEY     # optional — embedded YouTube demos
```

Get the Groq key from https://console.groq.com/keys (free tier — 30 req/min, no card required for demo usage).
Without `YOUTUBE_API_KEY` the app gracefully falls back to a YouTube search URL.

## Local emulator suite

```bash
cd functions && npm install && npm run build && cd ..
firebase emulators:start
```

This brings up Auth (9099), Firestore (8080), Functions (5001), Storage (9199), and the UI.

## Deploy

```bash
npm run build
cd functions && npm run build && cd ..
firebase deploy --only firestore:rules,storage,functions,hosting
```

That ships:

- Firestore rules ([firestore.rules](firestore.rules)) — per-user isolation.
- Storage rules ([storage.rules](storage.rules)) — only the owner can read/write `equipment_photos/{uid}/**`.
- Three Cloud Functions: `generatePlan`, `detectEquipment`, `resolveVideo` (region `asia-south1`).
- The Vite SPA to Firebase Hosting (with SPA rewrite to `/index.html`).

The Hosting URL becomes the live capstone link — works on any phone browser.

## Repo layout

```
src/
  pages/             # Welcome · Onboarding · Today · WeeklyReview · Progress · MyGym
  components/        # MobileShell · BottomNav · PrimaryButton · ExerciseCard
                     # EquipmentCapture · PhotoUpload · YouTubeEmbed · FeltPrompt · Disclaimer
  lib/
    firebase.ts      # client init (no-op when env not set)
    storage.ts       # Firestore + Storage wrapper with localStorage fallback
    api.ts           # generatePlan / detectEquipment / resolveVideo callable wrappers + mock
    adaptive.ts      # buildLastWeekSummary, feltSummary
    seed.ts          # one-tap demo user
    types.ts         # shared data model
  data/
    equipment.ts     # canonical equipment vocabulary + canonicalize()
    exercises.ts     # offline exercise library (mock planner)
    meals.ts         # diet idea library (mock planner)

functions/
  src/
    index.ts             # exports
    groq.ts              # thin OpenAI-compatible client for Groq
    generatePlan.ts      # callable — llama-3.3-70b + JSON mode + verbatim system prompt + retry
    detectEquipment.ts   # callable — llama-4-scout vision per image + JSON parse + merge
    resolveVideo.ts      # callable — YouTube Data API v3 + null fallback

firebase.json · .firebaserc · firestore.rules · firestore.indexes.json · storage.rules
.env.example · README.md
```

## Data model (Firestore)

```
users/{uid}
  name age city goal experience days_per_week session_length
  equipment[] equipment_source equipment_photo_urls[]
  diet_pref injuries[] medical_conditions[] other_constraints
  current_week created_at

users/{uid}/plans/{planId}
  week_number created_at source(initial|adaptive)
  equipment_snapshot[]
  plan_json: { week_number, summary, days[], diet, safety_note }

users/{uid}/checkins/{checkinId}
  plan_id week_number day_label checked_in_at
  exercises_done[] exercises_skipped[]
  felt(easy|ok|hard|pain) note?

users/{uid}/weekly_reviews/{reviewId}
  week_number days_planned days_completed completion_pct summary_text
```

Per spec, both Firestore and Storage rules block any cross-user access — the unit of access control is `request.auth.uid == uid`.

## How the four required capabilities are wired

**REQ 1 — Equipment by photo OR text.** [EquipmentCapture.tsx](src/components/EquipmentCapture.tsx) combines [PhotoUpload.tsx](src/components/PhotoUpload.tsx) (camera + gallery, multi-image, Firebase Storage upload) with the canonical equipment chip list. Photo uploads call `detectEquipment` (vision Cloud Function), free-form detections pass through [canonicalize()](src/data/equipment.ts) into the typed `Equipment[]`. `equipment_source` records `photo | manual | both`.

**REQ 2 — Plan from full constraint set.** [generatePlan](functions/src/generatePlan.ts) sends the verbatim system prompt + a JSON payload of `{age, goal, experience, days_per_week, session_length, equipment, diet_pref, injuries, medical_conditions, other_constraints, week_number, last_week?}` to `llama-3.3-70b-versatile` on Groq with `response_format: { type: "json_object" }`. Output is parsed strictly via `tryParse()` with a markdown-fence-tolerant slice; one retry on malformed JSON. The client-side scrub `filterUnavailableEquipment()` in [src/lib/api.ts](src/lib/api.ts) drops any exercise whose `uses_equipment` doesn't intersect the user's list — second line of defence against hallucinated gear.

**REQ 3 — Embedded YouTube demos.** [YouTubeEmbed.tsx](src/components/YouTubeEmbed.tsx) is a full-screen modal. On first open it calls [resolveVideo](functions/src/resolveVideo.ts) (YouTube Data API `search.list`, `videoEmbeddable=true`, `maxResults=1`), caches `video_id` back onto the plan via `updatePlanExerciseVideo()`, and renders `https://www.youtube.com/embed/<id>?rel=0&modestbranding=1&playsinline=1`. If the key is missing or YouTube returns nothing, the modal shows the search link.

**REQ 4 — Adaptive weekly regeneration.** [WeeklyReview.tsx](src/pages/WeeklyReview.tsx) calls [buildLastWeekSummary()](src/lib/adaptive.ts) which computes `completion_pct`, unique skipped exercises, a `felt_summary` (easy/ok/hard/pain counts), and `equipment_changed` (comparing `plan.equipment_snapshot` to the current profile). That payload feeds `generatePlan`. The system prompt enforces: `<60%` → no progression; repeated `hard` → ease off; any `pain` → remove pattern + caution; `easy` → small progression on compounds only; equipment changed → rebuild around the new list. The mock planner enforces the same rules so the offline demo behaves identically.

## Safety guardrails (implemented)

- Mandatory injuries + medical-conditions steps in onboarding **before** any plan generation.
- Both fields are passed into every LLM call (text and vision).
- Persistent dismissible first-plan disclaimer on Home (`gymbuddy.disclaimer.dismissed`).
- Diet block carries its own non-medical disclaimer.
- Every exercise card has an inline "Stop if you feel sharp pain" reminder behind the form-cue disclosure.
- Pain reported on check-in shows an immediate red note prompting doctor consult and triggers a pattern swap in the next plan.
- Malformed LLM JSON never crashes the UI — the function retries once, then surfaces a friendly "Try again" button.

## Notes / known decisions

- **Region** — Functions deployed to `asia-south1` (Mumbai) for lowest latency to India.
- **YouTube fallback** — Better than blocking the user: if the key is unset, every exercise still opens a real YouTube demo in a new tab.
- **localStorage demo path** — keeps the app fully demoable without Firebase. Once `.env.local` is set, all data lives in Firestore.
- **No payments / wearables / push reminders** — explicitly out of MVP scope.
- **Seed demo** — the "See a demo with sample data" link on the Welcome screen instantly populates a fully realistic Week 1 + 2 check-ins (`seedDemo` in [src/lib/seed.ts](src/lib/seed.ts)).
