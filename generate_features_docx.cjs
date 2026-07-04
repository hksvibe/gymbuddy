// Generates GymBuddy_MVP_Features.docx from the FEATURES.md content.
// Run once — the .docx is the artefact; this script isn't shipped.

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber,
} = require('docx');

// ---------- Style tokens ----------
const VIOLET_DEEP = '5B21B6';
const VIOLET_LIGHT = 'EDE9FE';
const INK = '1E1B2E';
const INK_SOFT = '4B475A';
const BORDER = 'CCCCCC';
const BORDER_LIGHT = 'E5E4E7';
const AMBER_BG = 'FEF3C7';
const SUCCESS = '15803D';

const FONT = 'Arial';
const MONO = 'Consolas';

const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

// ---------- Helpers ----------
function p(opts) {
  return new Paragraph({ ...opts });
}

function text(str, opts = {}) {
  return new TextRun({ text: str, font: FONT, size: 22, color: INK, ...opts });
}

function h1(str) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: str, font: FONT, size: 40, bold: true, color: VIOLET_DEEP })],
    spacing: { before: 240, after: 240 },
  });
}

function h2(str) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: str, font: FONT, size: 30, bold: true, color: VIOLET_DEEP })],
    spacing: { before: 360, after: 180 },
  });
}

function h3(str) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text: str, font: FONT, size: 24, bold: true, color: INK })],
    spacing: { before: 200, after: 120 },
  });
}

function para(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: 120 },
    ...opts,
  });
}

function bullet(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: Array.isArray(runs) ? runs : [text(runs)],
    spacing: { after: 60 },
  });
}

function code(str) {
  return new Paragraph({
    children: [new TextRun({ text: str, font: MONO, size: 18, color: INK })],
    shading: { fill: 'F4F3EC', type: ShadingType.CLEAR, color: 'auto' },
    spacing: { after: 20 },
    indent: { left: 200 },
  });
}

function codeBlock(lines) {
  return lines.split('\n').map(code);
}

function link(str, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text: str, style: 'Hyperlink', font: FONT, size: 22, color: VIOLET_DEEP, underline: {} })],
    link: url,
  });
}

// ---------- Table helpers ----------
const TABLE_WIDTH = 9360; // US Letter with 1" margins

function tableCell(content, opts = {}) {
  const isHeader = opts.header;
  const children = Array.isArray(content) ? content : [
    para(new TextRun({
      text: content,
      font: FONT,
      size: 20,
      bold: isHeader,
      color: isHeader ? 'FFFFFF' : INK,
    })),
  ];
  return new TableCell({
    borders,
    width: { size: opts.width, type: WidthType.DXA },
    shading: {
      fill: isHeader ? VIOLET_DEEP : (opts.zebra ? 'FAFAFA' : 'FFFFFF'),
      type: ShadingType.CLEAR,
      color: 'auto',
    },
    margins: cellMargins,
    children,
  });
}

function simpleTable(headers, rows, columnWidths) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) => tableCell(h, { header: true, width: columnWidths[i] })),
    tableHeader: true,
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => tableCell(c, { width: columnWidths[i], zebra: ri % 2 === 1 })),
  }));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: [headerRow, ...bodyRows],
  });
}

function spacer(size = 120) {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: size } });
}

function divider() {
  return new Paragraph({
    children: [new TextRun('')],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: VIOLET_DEEP, space: 1 },
    },
    spacing: { before: 240, after: 240 },
  });
}

// ---------- Content ----------
const children = [];

// Title
children.push(h1('GymBuddy MVP — Feature Inventory'));
children.push(para([
  text('AI fitness coach for budget / society-gym beginners in India. The hero action is the user tapping ', { italics: true, color: INK_SOFT }),
  text('"I trained today."', { bold: true, italics: true, color: VIOLET_DEEP }),
]));

// Live URLs
children.push(h3('Live URLs'));
children.push(bullet([
  text('Primary: ', { bold: true }),
  link('https://prototype-harshkumarsharma.web.app', 'https://prototype-harshkumarsharma.web.app'),
]));
children.push(bullet([
  text('Alt: '),
  link('https://gymbuddy-prod-9ef54.web.app', 'https://gymbuddy-prod-9ef54.web.app'),
]));
children.push(bullet([
  text('Repo: '),
  link('https://github.com/hksvibe/gymbuddy', 'https://github.com/hksvibe/gymbuddy'),
]));
children.push(para(text('Both URLs point at the same Firebase project (same Firestore, same Cloud Functions, same auth). Works on any mobile browser, no install required.', { color: INK_SOFT, size: 20 })));

children.push(divider());

// ============ Section 1 · Authentication & Identity ============
children.push(h2('1 · Authentication & Identity'));
children.push(simpleTable(
  ['Feature', 'Status', 'Notes'],
  [
    ['Google sign-in', 'Live', 'One-tap OAuth via Firebase Auth. UID persists across devices.'],
    ['Guest mode', 'Live', 'Firebase Anonymous auth with graceful fallback to a local-only UID if anon isn\'t enabled.'],
    ['Guest → Google upgrade', 'Live', 'linkWithPopup preserves progress; falls back cleanly if the Google account is already used.'],
    ['Identity strip on Progress', 'Live', 'Shows Google avatar + email or "Guest mode" with a one-tap Sign-in nudge.'],
    ['Sign out', 'Live', 'Clears local state + Firebase session.'],
    ['Auth-ready gate', 'Live', 'Screens wait for Firebase Auth to restore session before firing Firestore reads (prevents empty state on refresh).'],
  ],
  [3200, 1160, 5000],
));

// ============ Section 2 · Onboarding ============
children.push(h2('2 · Onboarding (11–13 steps)'));
children.push(para(text('Every field is a single question per screen with a progress bar. Under ~90 seconds for a healthy user.', { italics: true, color: INK_SOFT })));
children.push(simpleTable(
  ['Step', 'Field', 'Notes'],
  [
    ['1', 'Name + age + city', 'City optional.'],
    ['2', 'Height (cm) + weight (kg)', 'Live BMI shown as a non-medical guide.'],
    ['3', 'Goal', 'Fat loss · Muscle gain · General fitness · Get strong.'],
    ['4', 'Experience', 'Never · <1m · 1–3m · 3–12m · >1y.'],
    ['5', 'Days/week', '2–6, tap-to-select grid.'],
    ['6', 'Session length', '25 · 30 · 45 min (25 is the enforced floor).'],
    ['7', 'Equipment', 'Photo capture (Firebase Storage → Groq vision) OR manual chips. Confirmed list is the source of truth.'],
    ['8', 'Diet preference', 'Veg · Egg-veg · Non-veg.'],
    ['9', 'Injuries', 'Multi-select — mandatory.'],
    ['10', 'Medical conditions', 'Multi-select — mandatory.'],
    ['11', 'Other constraints', 'Free-text (e.g. "no jumping", "evenings only").'],
    ['12', 'General AI consent', 'Mandatory checkbox. Logged.'],
    ['13', 'Chronic-condition consent', 'Only shown if any medical condition selected. Mandatory checkbox. Logged.'],
  ],
  [800, 2800, 5760],
));

// ============ Section 3 · Consent & Safety Log ============
children.push(h2('3 · Consent & Safety Log'));
children.push(para(text('Full audit trail per user for every acceptance.', { italics: true, color: INK_SOFT })));
children.push(bullet([text('Firestore subcollection ', {}), text('users/{uid}/consents/{id}', { font: MONO, size: 20 })]));
children.push(bullet([
  text('Each record: '),
  text('kind, version, accepted_at, text_hash, medical_conditions_at_accept[], injuries_at_accept[]', { font: MONO, size: 20 }),
]));
children.push(bullet(text('Two consent kinds:')));
children.push(bullet([text('General AI', { bold: true }), text(' — everyone. "GymBuddy is not medical advice, consult a doctor before starting."')], 1));
children.push(bullet([text('Chronic condition', { bold: true }), text(' — only if heart / high_bp / diabetes / asthma / pregnancy declared. "I will consult my doctor before starting."')], 1));
children.push(bullet([text('Text is versioned ('), text('v1-2026-07-02', { font: MONO, size: 20 }), text('); version bumps if wording changes.')]));
children.push(bullet([text('text_hash', { font: MONO, size: 20 }), text(' = short deterministic hash of the exact text shown, for tamper-evident audit.')]));

// ============ Section 4 · Persistent Disclaimers ============
children.push(h2('4 · Persistent Disclaimers'));
children.push(bullet(text('Dismissible first-plan disclaimer on Home: "GymBuddy gives general fitness guidance, not medical advice…"')));
children.push(bullet(text('Non-medical disclaimer on the diet block.')));
children.push(bullet(text('"Stop if you feel sharp pain" reminder inside every exercise card\'s form-cue disclosure.')));
children.push(bullet(text('Amber safety-note banner referencing the user\'s own conditions (e.g. "we\'ve kept heavy spinal loading out for your lower back").')));

// ============ Section 5 · AI Plan Generation ============
children.push(h2('5 · AI Plan Generation (Groq)'));
children.push(para([text('Model: ', { bold: true }), text('llama-3.3-70b-versatile', { font: MONO, size: 20 }), text(' with '), text('response_format: { type: "json_object" }', { font: MONO, size: 20 }), text(' — JSON mode enforced.')]));
children.push(para(text('Cloud Function generatePlan (region asia-south1) sends every profile field: age, height, weight, goal, experience, days/week, session length, equipment, diet, injuries, medical conditions, free-text constraints, and (from Week 2 onward) a full last_week summary.')));
children.push(h3('Server-side validation (tryParse)'));
children.push(para(text('The response is rejected + retried once if any of:')));
children.push(bullet(text('Fewer than 4 main-phase exercises on any day')));
children.push(bullet(text('Missing warm-up or cool-down groups (checked implicitly)')));
children.push(bullet(text('Any meal missing ingredients or recipe')));
children.push(bullet(text('Any exercise missing name, sets, or youtube_search_query')));
children.push(h3('Client-side scrub'));
children.push(para(text('Even after LLM output passes, filterUnavailableEquipment() drops any main-phase exercise referencing gear the user doesn\'t have. Bodyweight is treated as universally available.')));
children.push(h3('Auto-regeneration'));
children.push(para(text('If a stored plan looks stale (no phase tags, meals without recipes, etc.), Today silently regenerates on load with a subtle "Updating your plan…" banner.')));

// ============ Section 6 · The Day (Today screen) ============
children.push(h2('6 · The Day (Today screen)'));
children.push(para(text('Every training day is split into three phase groups:')));
children.push(simpleTable(
  ['Phase', 'Purpose', 'Duration'],
  [
    ['Warm-up (dynamic)', 'Marching, arm circles, hip circles, squat-to-reach', '~4 min'],
    ['Main workout', '≥ 4 exercises, sets × reps, RPE 6–7, beginner-safe compounds', '15–35 min'],
    ['Cool-down (static stretch)', 'Quad, hamstring, cross-body shoulder, child\'s pose', '~4 min'],
  ],
  [3000, 5000, 1360],
));
children.push(spacer());
children.push(bullet(text('Big green "I trained today" hero button.')));
children.push(bullet(text('Multi-day tab strip; each tab shows a ✓ if that day\'s session is logged.')));
children.push(bullet(text('Felt capture (Easy / OK / Hard / Pain) shown before check-in.')));
children.push(bullet(text('Pain response triggers a doctor-consult note + pattern swap next week.')));
children.push(bullet(text('Express Workout toggle: trims the main phase to ~15 min; warm-up + cool-down stay.')));
children.push(bullet(text('Per-exercise: name, sets × reps, RPE, plain-English "why", form cue, equipment chips, "Watch demo" + "Timer" buttons, done/skip toggle.')));

// ============ Section 7 · Embedded YouTube Demos ============
children.push(h2('7 · Embedded YouTube Demos'));
children.push(bullet([text('Cloud Function '), text('resolveVideo', { font: MONO, size: 20 }), text(' calls YouTube Data API v3 search.list with videoEmbeddable=true.')]));
children.push(bullet(text('Result cached back onto the plan\'s exercise (Firestore write via updatePlanExerciseVideo).')));
children.push(bullet([text('Client renders '), text('youtube.com/embed/<id>', { font: MONO, size: 20 }), text(' in a full-screen IFrame modal.')]));
children.push(bullet(text('Graceful fallback to a YouTube search link if the API key is missing or returns nothing.')));

// ============ Section 8 · Rest Timer ============
children.push(h2('8 · Rest Timer per Exercise'));
children.push(para(text('Full-screen countdown modal with:')));
children.push(bullet(text('Circular SVG countdown (green during hold phase, violet during rest)')));
children.push(bullet(text('Set counter (e.g. "Set 2 of 3")')));
children.push(bullet(text('±15s controls, reset, skip, play/pause')));
children.push(bullet(text('660Hz audible beep + haptic vibrate (80-40-80 pattern) at each phase change')));
children.push(bullet([text('Handles both rep-based (rest between sets) and hold-based (planks, stretches) exercises via '), text('rest_seconds', { font: MONO, size: 20 }), text(' / '), text('hold_seconds', { font: MONO, size: 20 }), text(' fields per exercise')]));

// ============ Section 9 · Check-in ============
children.push(h2('9 · 10-Second Check-in'));
children.push(bullet(text('Tap "I trained today" → saves a checkin doc immediately.')));
children.push(bullet(text('Optional per-exercise done/skip toggles before check-in refine the payload.')));
children.push(bullet(text('Optional felt tag (Easy / OK / Hard / Pain) recorded per session.')));
children.push(bullet(text('Optional free-text note per check-in.')));
children.push(bullet([text('Persisted to '), text('users/{uid}/checkins/{id}', { font: MONO, size: 20 }), text('; survives refresh + cross-device.')]));

// ============ Section 10 · Diet ============
children.push(h2('10 · Diet with Ingredients + Recipes'));
children.push(para(text('Every meal card is expandable:')));
children.push(bullet(text('Meal idea (e.g. "Rajma-chawal with cucumber salad")')));
children.push(bullet(text('Approx protein grams (right-aligned)')));
children.push(bullet(text('Prep minutes + approx kcal (subtitle)')));
children.push(bullet(text('Ingredients list with quantities (e.g. "1 cup boiled rajma — soak overnight")')));
children.push(bullet(text('Numbered recipe steps — beginner-friendly, budget-conscious Indian home cooking')));
children.push(spacer());
children.push(para(text('Protein target formula:')));
children.push(simpleTable(
  ['Goal', 'Multiplier', 'Example (70kg user)'],
  [
    ['Muscle gain / strength', '1.7 g/kg', '120g'],
    ['Fat loss', '1.8 g/kg (higher — preserves lean mass in a deficit)', '125g'],
    ['General fitness', '1.4 g/kg', '100g'],
  ],
  [3000, 4700, 1660],
));
children.push(para(text('Rounded to nearest 5g, clamped to [40, 220]. Client mock planner + Cloud Function system prompt both apply the same formula.', { italics: true, color: INK_SOFT, size: 20 })));

// ============ Section 11 · Weekly Review + Adaptive ============
children.push(h2('11 · Weekly Review & Adaptive Next-Week'));
children.push(bullet(text('Big completion ring (67%) with days-completed / days-planned.')));
children.push(bullet(text('LLM-generated summary line: "Solid effort last week. We swapped what you skipped."')));
children.push(bullet(text('Stat cards: exercises done vs skipped.')));
children.push(bullet(text('Felt-summary chips (e.g. 3 easy · 2 ok · 1 hard).')));
children.push(bullet(text('Skipped exercises list — flags what next week will swap.')));
children.push(bullet(text('Per-day status list with felt tag.')));
children.push(h3('Generate Week N+1 payload'));
children.push(para(text('Calls the Cloud Function with a full last_week payload including:')));
children.push(bullet([text('completion_pct', { font: MONO, size: 20 }), text(' (unique day-labels checked in / days planned)')]));
children.push(bullet([text('days_completed', { font: MONO, size: 20 })]));
children.push(bullet([text('Deduped '), text('exercises_skipped', { font: MONO, size: 20 })]));
children.push(bullet([text('felt_summary', { font: MONO, size: 20 }), text(' counts (easy, ok, hard, pain)')]));
children.push(bullet([text('equipment_changed', { font: MONO, size: 20 }), text(' bool (comparing plan\'s equipment_snapshot to current profile)')]));
children.push(h3('Adaptive rules enforced (client mock + server prompt)'));
children.push(simpleTable(
  ['Condition', 'Behaviour'],
  [
    ['completion_pct < 60%', 'Simplify, keep volume flat, encouraging summary'],
    ['60–85%', 'Keep difficulty, swap what was skipped'],
    ['≥ 85%', 'Small progression on compounds only (add ~1 set)'],
    ['Any pain reported', 'Remove/replace that movement pattern + caution note'],
    ['equipment_changed = true', 'Full rebuild around the new list'],
  ],
  [3500, 5860],
));

// ============ Section 12 · Progress ============
children.push(h2('12 · Progress Screen'));
children.push(bullet(text('KPI cards: week streak · full weeks · total check-ins')));
children.push(bullet(text('Body tracker section with big "Log today" button')));
children.push(bullet(text('Bar chart of check-ins per week (violet done bars over lavender planned guides)')));
children.push(bullet(text('Motivational footer copy tuned to streak length')));
children.push(bullet(text('Identity strip — signed-in avatar + email, or guest with sign-in nudge')));

// ============ Section 13 · Body Measurements ============
children.push(h2('13 · Body Measurements Tracker'));
children.push(para(text('Daily/weekly logging of physical metrics.')));
children.push(bullet(text('Bottom-sheet modal with:')));
children.push(bullet(text('Weight (kg) — primary'), 1));
children.push(bullet(text('Collapsible tape: waist, chest, arms, thighs, hips (cm)'), 1));
children.push(bullet(text('Body fat %'), 1));
children.push(bullet(text('Free-text notes'), 1));
children.push(bullet(text('All fields optional per entry (log weight daily, tape measurements weekly)')));
children.push(bullet([text('Persisted to '), text('users/{uid}/measurements/{id}', { font: MONO, size: 20 }), text(' with ISO timestamp + logged_date')]));
children.push(bullet(text('Latest snapshot cards show current value + delta since start (green ↓ for down, amber ↑ for up)')));
children.push(bullet(text('Weight trend chart — custom SVG line chart with area fill (no external chart library)')));
children.push(bullet(text('History list with per-row delete')));
children.push(bullet([text('Saving a new weight auto-updates '), text('users/{uid}.weight_kg', { font: MONO, size: 20 }), text(' so next week\'s plan uses the current weight for its protein target')]));

// ============ Section 14 · My Gym ============
children.push(h2('14 · My Gym (Equipment Editor)'));
children.push(bullet(text('Photo re-scan or manual chip editing')));
children.push(bullet(text('Live preview of canonical equipment list')));
children.push(bullet(text('Equipment-source pill (photo / manual / both)')));
children.push(bullet([text('Save → sets '), text('equipment_changed = true', { font: MONO, size: 20 }), text(' for the next week\'s adaptive plan build')]));

// ============ Section 15 · Equipment Detection ============
children.push(h2('15 · Equipment Detection (Vision AI)'));
children.push(bullet([text('Cloud Function '), text('detectEquipment', { font: MONO, size: 20 }), text(' accepts up to 6 image URLs')]));
children.push(bullet([text('Each image sent to Groq '), text('meta-llama/llama-4-scout-17b-16e-instruct', { font: MONO, size: 20 }), text(' (multimodal MoE)')]));
children.push(bullet(text('Prompt returns a JSON array of standard equipment names')));
children.push(bullet([text('Results passed through '), text('canonicalize()', { font: MONO, size: 20 }), text(' — maps free-form aliases like "cable machine" → cables, "kb" → kettlebell, etc.')]));
children.push(bullet(text('Deduplicated + merged across all photos')));
children.push(bullet(text('User confirms/edits before save')));

// ============ Section 16 · Demo Seed ============
children.push(h2('16 · Demo Seed'));
children.push(bullet(text('One-tap "See a demo with sample data" link on Welcome')));
children.push(bullet(text('Creates a fully populated user matching the spec\'s example: Rohan, 26, Pune, 172cm/78kg, fat loss goal, 3 days/week, 30-min sessions, dumbbells+bench+cables+treadmill, veg, lower_back injury, high_bp, "no jumping" constraint')));
children.push(bullet(text('Also seeds 2 check-ins + a real plan')));
children.push(bullet(text('Reviewers/graders can experience the populated state without doing full onboarding')));

children.push(divider());

// ============ Data Model ============
children.push(h2('Data Model (Firestore)'));
children.push(...codeBlock(`users/{uid}
  profile fields — name, age, city, height_cm, weight_kg,
    goal, experience, days_per_week, session_length,
    equipment[], equipment_source, equipment_photo_urls[],
    diet_pref, injuries[], medical_conditions[],
    other_constraints, current_week, created_at

users/{uid}/plans/{planId}
  week_number, source (initial | adaptive), created_at,
  equipment_snapshot[], plan_json

users/{uid}/checkins/{checkinId}
  plan_id, week_number, day_label, checked_in_at,
  exercises_done[], exercises_skipped[], felt, note

users/{uid}/weekly_reviews/{reviewId}
  week_number, days_planned, days_completed,
  completion_pct, summary_text

users/{uid}/measurements/{id}
  logged_at, logged_date, weight_kg?, waist_cm?, chest_cm?,
  arms_cm?, thighs_cm?, hips_cm?, body_fat_pct?, notes?

users/{uid}/consents/{id}
  kind (general_ai | chronic_condition),
  version, accepted, accepted_at, text_hash,
  medical_conditions_at_accept[], injuries_at_accept[]`));
children.push(spacer());
children.push(para([text('Storage bucket: '), text('equipment_photos/{uid}/**', { font: MONO, size: 20 }), text(' — owner-only read/write.')]));
children.push(para(text('Per-user isolation enforced by firestore.rules and storage.rules:')));
children.push(...codeBlock(`allow read, write:
  if request.auth != null && request.auth.uid == uid;`));

children.push(divider());

// ============ Stack ============
children.push(h2('Stack'));
children.push(simpleTable(
  ['Layer', 'Tech'],
  [
    ['Frontend', 'React 19 · Vite · TypeScript · Tailwind v4 · React Router'],
    ['Backend', 'Firebase — Auth, Firestore, Storage, Cloud Functions v2 (asia-south1)'],
    ['LLM (text)', 'Groq — llama-3.3-70b-versatile with JSON mode'],
    ['LLM (vision)', 'Groq — meta-llama/llama-4-scout-17b-16e-instruct (multimodal)'],
    ['Videos', 'YouTube Data API v3 (search + embedded IFrame)'],
    ['Testing', 'Vitest — 39 unit tests'],
    ['CI/Deploy', 'Firebase CLI (firebase deploy)'],
    ['Secrets', 'Firebase Secret Manager (GROQ_API_KEY, YOUTUBE_API_KEY)'],
  ],
  [2400, 6960],
));

children.push(divider());

// ============ V2 backlog ============
children.push(h2('Explicitly out of scope (v2 backlog)'));
children.push(bullet(text('Anti-boredom variety engine')));
children.push(bullet(text('Push notifications / WhatsApp reminders')));
children.push(bullet(text('Detailed calorie tracking')));
children.push(bullet(text('Wearable integrations (Fitbit / Watch)')));
children.push(bullet(text('Payments / subscriptions')));
children.push(bullet(text('Social feed / community')));
children.push(bullet(text('Trainer marketplace')));

children.push(divider());

// ============ Testing ============
children.push(h2('Testing'));
children.push(para(text('39 tests passing across 4 files. Coverage includes:')));
children.push(bullet([text('Mock planner contracts', { bold: true }), text(' — days count matches days_per_week clamp, min 4 mains per day, warm-up + cool-down always present, 25-min floor')]));
children.push(bullet([text('Safety guardrails', { bold: true }), text(' — no overhead press for shoulder injury or high_bp, no deadlift for lower_back injury, "no jumping" constraint honored, doctor-consult mention on safety_note for high_bp')]));
children.push(bullet([text('Adaptive logic', { bold: true }), text(' — no progression when completion <60%, small bump when ≥85%, pain-in-summary trigger, equipment-changed messaging')]));
children.push(bullet([text('Weight-scaled protein', { bold: true }), text(' — heavier user gets higher target, muscle_gain in 1.5–2.0 g/kg range, fat_loss in 1.6–2.1 range, always rounded to 5g')]));
children.push(bullet([text('Canonical equipment vocabulary', { bold: true }), text(' — alias mapping, dedup, whitespace/case handling')]));
children.push(bullet([text('Session-length trimmer', { bold: true }), text(' — preserves compounds, drops accessories first, honors minimum-kept floor')]));
children.push(bullet([text('Adaptive summary builder', { bold: true }), text(' — completion_pct math, felt_summary counts, equipment_changed detection independent of array order')]));
children.push(para([text('Run with '), text('npm test', { font: MONO, size: 20 }), text(' from repo root.')]));

// ---------- Document ----------
const doc = new Document({
  creator: 'hksvibe',
  title: 'GymBuddy MVP — Feature Inventory',
  description: 'Feature inventory for GymBuddy MVP capstone submission.',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: FONT, color: VIOLET_DEEP },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: VIOLET_DEEP },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: INK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'GymBuddy MVP — Feature Inventory', font: FONT, size: 18, color: INK_SOFT, italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Page ', font: FONT, size: 18, color: INK_SOFT }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: INK_SOFT }),
            new TextRun({ text: ' · ', font: FONT, size: 18, color: INK_SOFT }),
            new TextRun({ text: 'hksvibe/gymbuddy · prototype-harshkumarsharma.web.app', font: FONT, size: 18, color: INK_SOFT }),
          ],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = '/Users/harshmacminim4/gymbuddy-webapp-mvop/GymBuddy_MVP_Features.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Wrote', outPath, buffer.length, 'bytes');
});
