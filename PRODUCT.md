# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first web app today; native iOS and Android apps are planned later against the same `/api/v1` API.

## Users

- **Candidates** (Beta Alpha Psi candidates at NYU): sign up for community service events, check in and out on site, and check their CS points standing. They use the portal often through the semester (standing, upcoming events, results), mostly on their phones, sometimes in poor conditions (outdoors, basements, weak signal).
- **Other NYU members**: anyone with an NYU account can sign in and sign up; they rank after rostered candidates for spots.
- **The CS committee** (members and chairs): post events, confirm who goes, run check-in (sometimes on site with a rotating QR), resolve exceptions, and confirm points. They work from both laptops and phones, including on site and on the go.

## Product Purpose

Carry each community service event from posting through sign-up, selection, attendance and points in one system, replacing a Google Forms → Sheets → Forms → Sheets workflow and OneTap (dropped at ~$500/month). Success: a candidate checks in and out in seconds with no setup and always knows where their credit stands; any committee member can run an event start to finish in minutes with attendance data they can trust without checking it by hand.

## Positioning

Built for one chapter's actual workflow: NYU identity (`@nyu.edu` and `@stern.nyu.edu` are the same person), fair automatic ranking (candidates first, fewest points, earliest sign-up, no same-day double booking), geofenced check-in with a committee review fallback, and points that flow straight from attendance to the tracker.

## Operating Context

- Weekly rhythm: events posted, sign-ups open, selection published, day-before reminder, event day, points confirmed.
- Partner organizations host the events; usually no committee member is on site, so check-in is by link with a geofence, or by rotating QR when someone is.
- Email (committee Gmail) carries confirmations, waitlist moves, reminders, cancellations and results.
- The existing Google Sheets points tracker is imported once and then fed from the app.

## Capabilities and Constraints

- Sign in with Google, NYU accounts only; identity is the NetID.
- Per-term candidate roster, points requirement, and points rules (default event points, no-show penalty, late-drop cutoff).
- Minimum time on site before a normal check-out; early check-out allowed with a reason and a clear points-risk warning, always reported to the committee.
- A web page cannot verify continuous presence; it verifies location at check-in and check-out and records presence only while the page is open.
- Must cost close to nothing to run (free-tier hosting and email).

## Brand Commitments

- Beta Alpha Psi, Mu Chapter (NYU Stern). Palette is taken from nyubap.com: charcoal `#2E2E2E`, crimson `#BC202F` (the crest; chosen as the app's action color), sand `#E1D6B7`, gold `#DEC050`, white. The site's burnt orange `#C94817` is not used.
- The portal has its own clean type voice; it does not use the website's Poppins.
- Design language: modern, clean, and restrained, after Jakub Krehel's "Less is more, more or less": keep only what's essential, bring order to complexity, and animate only where it earns its cost.
- Standing preference (chosen 2026-10-22): the category standard played straight, a clean modern event app, at the craft level of **Luma** (event pages, sign-up flow) and **Apple Wallet / iOS** (native-feeling mobile, status at a glance). Familiar conventions over novelty.

## Evidence on Hand

- User interviews and a problem statement in `.claude/project-context/` (Adrien Pinilla, Brian Yuan, Rick Feng, Shrushti Girish).
- No real event photos, partner logos or chapter crest files are in the repo; do not fabricate them.

## Product Principles

1. Every check-in should feel like a first one done right: obvious, fast, no setup.
2. Never leave anyone unsure whether their credit counted.
3. No punitive timers or scolding; rules are stated plainly before they matter.
4. Nothing gets re-entered by hand; the committee confirms, the system records.
5. Less, but better: remove before adding.

## Accessibility & Inclusion

Used outdoors and on the move on phones: high contrast, large tap targets, and states that never rely on color alone.
