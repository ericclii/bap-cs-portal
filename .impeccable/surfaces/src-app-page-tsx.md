---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/events","src/app/committee","src/app/signin","src/app/qr","src/components"]
---

# Surface brief: BAP Community Service Portal (all app screens)

Scope: every front-end interface — student home, event page and check-in flow, sign-in, committee shell (overview, events, event console with people/selection/points tabs, event form, reviews, points, candidates, settings) and the on-site QR screen. Visitor mode: Operate (students on phones; committee on phones and laptops). Build path: code-led.

Audience and job: candidates and members sign up, check in/out and check their points; the committee runs events end to end. Constraints (pinned by the user 2026-10-23): follow the BAP crest's colours — white or barely beige ground, khaki-gold highlights, crimson action buttons; the crest seal in the header and as the browser-tab icon. "Less is more" restraint.

## Direction contract

THESIS: The semester as a service passbook: every event served leaves a crimson stamp until the page is full. It refuses grey grouped-list chrome and dashboards of tinted cards; ink, khaki rules and one crimson carry everything.

OWN-WORLD: Barely-beige paper ground (#fdfcf8), white entries framed in 1px khaki (#c6bf9c) rules, charcoal ink on a warm ramp; crimson only for actions, the next event's date and stamps. Hanken Grotesk at a steep scale (the points figure is the only large type), Cinzel only inside stamps. Outlined crimson date box, outlined secondary pills, filled crimson primary pills, dashed empty stamp boxes, struck boxes for no-shows.

STORY: A candidate opens the app, sees how many stamps they have and how many to go, finds the next event as a passbook entry with its time-on-site drawn to scale, checks in with one button, and watches a stamp land. The committee works in the same ink-and-khaki ledger, with crimson reserved for what needs them.

FIRST VIEWPORT: Phone home: seal + "Community Service" bar over a khaki hairline; a 64px points figure "8 of 12 points" with term and deadline; a stamp grid (one box per event, stamped, struck or dashed); "Next" entry with outlined date box, title, time·place, status dot, a time-on-site bar marking check-out time, and a full-width crimson Check in. Desktop: the same, 5:7 columns in the 1024 frame. Committee: same bar with section tabs, "Needs attention" first.

FORM: Service Passbook, candidate 3 of my ordered list (the roll); raises: time drawn to length (labanotation), three chrome values at 1px (centre rail), scale-only hierarchy (variable font), the seal at three sizes (Emigre), only the next event burns crimson (transit). seed:d441a9bc2e9f7091. Signature: the check-in stamp landing.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
