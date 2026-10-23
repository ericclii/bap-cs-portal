# Testing the BAP Community Service Portal

Three stages before the portal replaces the Google Forms: a solo check right after deploying, a committee dry run, then one real event as a pilot.

## Stage 1 — Solo check (you, ~30 min, right after deploying)

Things that only exist in production:

- [ ] Sign in with your **@nyu.edu** Google account. You land on the home screen and see the Committee tab (you're a chair).
- [ ] Sign out, sign in with your **@stern.nyu.edu** account. It's the **same** account (same name, same points).
- [ ] Try a personal Gmail account. It's refused with "Sign in with your NYU Google account".
- [ ] Committee → Settings: create the current term, set the points requirement, add committee members by NetID.
- [ ] Committee → Candidates: paste the candidate roster.
- [ ] Committee → Points → *Import old tracker*: import the current Google Sheet totals once. Spot-check a few people.
- [ ] Create a test event with sign-ups open now. Sign up, pick yourself in *Pick who goes*, and confirm the **confirmation email arrives** (check spam; if it's there, mark "Not spam").
- [ ] Open the event on your **phone** and check in (location prompt → green check). Check out.
- [ ] Reminder email: set a test event to start tomorrow, then run
      `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron`
      and confirm the reminder arrives. (In production this runs daily at 14:00 UTC.)
- [ ] Points → *Google Sheets link*: paste the formula into a committee sheet and confirm it fills in.
- [ ] Delete or cancel the test events.

If Google sign-in fails with an NYU account but works with a personal one, NYU's Workspace is blocking the app. Ask NYU IT to allow the OAuth client ID.

## Stage 2 — Committee dry run (~1 hour, at Stern)

Create a practice event worth 0 points (it never touches real standings):

```bash
DATABASE_URL="<production pooled url>" BETTER_AUTH_URL="https://<your-app>" \
  npm run seed:demo -- --start 2026-10-27T17:00 --minutes 60          # add --qr for QR check-in
```

Share the student link with the committee plus 3–4 friends playing candidates (any NYU account works; add a couple to the candidate roster first).

Before the event:
- [ ] Everyone signs up from their own phone. Mix iPhone and Android.
- [ ] Committee opens *Pick who goes*: candidates rank first, then fewest points, then earliest sign-up. Confirm fewer people than signed up so some are waitlisted.
- [ ] Confirmed and waitlisted people each get the right email.
- [ ] One confirmed person drops **more than 24h** before: the top of the waitlist is confirmed automatically and emailed.
- [ ] (Optional, needs an event within 24h) One person drops **late**: it's flagged, the committee is alerted, the waitlist gets a "first to claim" email, and someone claims the spot.

During the event:
- [ ] Check in from the lobby (should work).
- [ ] Check in from a block away (should be refused with the distance).
- [ ] Try from a basement or stairwell; if location fails, use **Location not working?** and approve it under Committee → Reviews.
- [ ] Run one round with `--qr`: open **Show QR** on a laptop, scan it with phone cameras, check in.
- [ ] One person checks out **early** with a reason: the committee gets an alert and it appears in Reviews.
- [ ] Others check out normally after the minimum time.
- [ ] Committee watches the People tab update live (refreshes every few seconds).

After the event:
- [ ] Committee → event → *Confirm points*: suggestions are right (attended, no-show, flags for early check-out or no check-out). Save.
- [ ] Everyone gets a "Points recorded" email; their home screen shows the result.
- [ ] Download the event CSV and the points CSV.

Write down anything confusing, especially from people who have never seen the app.

## Stage 3 — Pilot one real event

Run one real service event on the portal, with the old Google Form kept as a quiet backup for that event only.

Afterwards, answer:
1. Did every candidate check in without asking for help?
2. Did anyone hit a location problem? Where (building, floor)?
3. How long did confirming points take compared with the old cross-checking?

If those come back clean, retire the Forms. Export a points CSV now and then as an off-app backup.

## Automated checks (for developers)

```bash
npm test            # unit tests: NetID rules, geofence, time windows, rotating QR
npm run typecheck
npm run build
```
