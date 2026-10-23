---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/events","src/app/committee","src/app/signin","src/app/qr","src/components"]
---

# Surface brief: BAP Community Service Portal (all app screens)

Scope: every front-end interface — student home, event page and check-in flow, sign-in, committee shell (overview, events, event console with people/selection/points tabs, event form, reviews, points, candidates, settings) and the on-site QR screen. Visitor mode: Operate (students on phones; committee on phones and laptops). Build path: code-led.

Audience and job: candidates and members sign up, check in/out and check their points; the committee runs events end to end. Constraints: nyubap.com palette (charcoal, crimson #BC202F as action, sand, gold), no Poppins, "less is more" restraint, benchmarks Luma and Apple Wallet/iOS.

## Direction contract

THESIS: The category standard played straight: a calm, native-feeling event app. It refuses dashboards of cards, decorative color and scattered motion; every screen leads with the one thing to do next.

OWN-WORLD: Neutral grey grouped ground, white inset groups with hairline separators, charcoal text on a five-step neutral ramp, one crimson for primary actions, today and live state; sand and gold only for candidate and requirement-met marks. System UI type, tabular figures, pill buttons, filled inputs, segmented controls, a crimson date tile, line icons at one stroke.

STORY: A student opens the app, sees their points and the next event, taps one button to sign up or check in, and leaves certain their credit is recorded. The committee sees what needs them, acts in place, and trusts the numbers.

FIRST VIEWPORT: Phone home: large-title greeting; a points row with a thin progress bar; the next event as a Wallet-like pass (date tile, title, time, place, status, one full-width action); then grouped lists for upcoming, open sign-ups and history. Committee: compact top bar with segmented section nav; "Needs attention" list first.

FORM: The category standard (canon), chosen by the user over the roll; not on the ordered list. seed:549433b78c501986. Signature: the event pass and its one-time check-in confirmation moment (the only authored animation).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
