# BAP Community Service Portal

The community service portal for NYU's Beta Alpha Psi chapter. It replaces the Google Forms → Sheets → Forms → Sheets workflow (and OneTap, dropped at ~$500/month) with one system. Each event goes from sign-up through attendance to points in one place, with nothing copied between sheets.

- **Students** sign in with their NYU Google account, sign up for events, check in and out on site, and always see their CS points.
- **The CS committee** posts events, confirms who goes (the app suggests a fair ranking), watches check-ins live, handles exceptions, and confirms points in one screen.

`netid@nyu.edu` and `netid@stern.nyu.edu` are the same person. Identity is the NetID.

## How an event works

1. **Post.** A committee member creates the event: partner org, what to know, map pin and radius, spots, points, minimum time on site, the sign-up window, and the check-in method:
   - **Link:** students check in from the event page. Use this when no one from BAP is on site.
   - **Rotating QR:** a committee member on site opens *Show QR code*. The code changes every 20 seconds, so a screenshot sent to a friend stops working within about a minute.
2. **Sign up.** Anyone with an NYU account can sign up while the window is open.
3. **Pick who goes.** The app ranks sign-ups: rostered candidates first, then fewest points this term, then earliest sign-up. Anyone already confirmed for another event that day goes to the end. The committee adjusts and clicks *Confirm & email*. Confirmed people get details and check-in instructions; the waitlist gets their position.
4. **Dropouts.** A student drops from the event page with a reason.
   - Before the term's late-drop cutoff (24 hours by default): the next person on the waitlist is confirmed and emailed automatically.
   - After the cutoff: it's flagged as a late drop, the committee is alerted, and the top 3 waitlisted people get a "first to claim" email.
5. **Reminder.** The day before, confirmed people get a reminder with the check-in link (daily cron).
6. **Day of.** Check-in and check-out both require being inside the geofence.
   - **Check-out:** unlocks after the minimum time. Earlier check-outs need a reason and a clear "this may cost points" confirmation, and they alert the committee.
   - **No signal (e.g. a basement):** the student taps *Location not working?*, and the request goes to the committee's **Reviews** queue.
   - **While checked in:** if the page stays open, the phone reports its position every few minutes, so the committee can see "left the area at 10:40".
7. **Confirm points.** After the event, one screen suggests each person's result: attended `+points`, no-show or late drop = the term's penalty (`−1`), excused `0`. It also flags anything worth a look (never checked out, left early, phone left the area, unresolved reviews). Saving emails each person their result.

**Points rules are per term** (Committee → Settings → *Edit rules*): points required, default points per event, the no-show penalty (−1 now), and the late-drop cutoff (24 hours now). A new term copies the current term's rules, and changing them never rewrites points already confirmed.

**Canceling** an event emails everyone signed up; restoring it emails the people still confirmed.

**Points:** the app is the source of truth. Points include confirmed event results plus manual adjustments (e.g. card writing at a meeting). The committee can import the existing tracker once, download a CSV, or keep a Google Sheet in sync with a private `=IMPORTDATA(...)` link (Points → *Google Sheets link*).

### What the browser can and can't verify

A web page can check location only while it's open, so it can't continuously prove someone stayed for the whole event. What it enforces: location at check-in, location at check-out, a minimum time before a normal check-out, and best-effort presence while the page is open. Truly continuous background tracking needs the native iOS/Android apps (see below).

## Running locally

Requires Node 24+.

```bash
npm install
npm run db:dev          # local Postgres (Prisma Dev) in the background
npx prisma migrate dev  # apply migrations
npm run dev             # http://localhost:3000
```

`.env` is set up for development:

- `ALLOW_DEV_LOGIN="true"` adds a **Development sign-in** box where you can act as any NetID, so you can test as a chair, a committee member and several candidates without Google. It's ignored in production.
- `CHAIR_NETIDS` lists NetIDs that are always chairs, so a fresh install has someone who can create the first term, add the committee and upload candidates.
- Without Gmail credentials, emails are written to the database (`EmailMessage` table) and the server log instead of being sent.

First run: sign in as a chair NetID, then go to **Committee → Settings** and create the term (e.g. "Fall 2026", 12 points required). Then go to **Candidates** to paste the roster, and **Events → New event**.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Public URL of the site (used in emails and QR codes) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth "Web application" client. Redirect URI: `<BETTER_AUTH_URL>/api/auth/callback/google` |
| `CHAIR_NETIDS` | Comma-separated NetIDs that are always chairs |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Committee Gmail account + [app password](https://support.google.com/accounts/answer/185833) for sending email (free, ~500/day) |
| `EMAIL_FROM_NAME` | Sender name, default "BAP Community Service" |
| `CRON_SECRET` | Protects `/api/cron` (Vercel Cron sends it automatically) |
| `FEED_TOKEN_VERSION` | Change to revoke the Google Sheets feed link |

### Google sign-in

Create the OAuth client in a Google Cloud project with the consent screen set to **External** (NYU accounts are a different Google Workspace). Only verified `@nyu.edu` / `@stern.nyu.edu` accounts can create a portal account; anything else is refused.

### Testing check-in on a phone

Browsers only share GPS on HTTPS pages. Expose the dev server with `cloudflared tunnel --url http://localhost:3000` (or ngrok), set `BETTER_AUTH_URL` to that URL, and add its callback to the Google client.

## Deploying (free tier)

Vercel (Hobby) + Neon or Supabase Postgres (free) is effectively $0 at chapter scale:

1. Create the Postgres database and set all variables above. Leave `ALLOW_DEV_LOGIN` unset.
2. Run `npm run db:deploy` against the production database.
3. Deploy. `vercel.json` schedules `/api/cron` once a day (10 AM New York), which sends the next day's reminders.

## Project layout

```
prisma/schema.prisma          data model: users (NetID), committee, terms, candidates,
                              events, sign-ups, attendance, reviews, point adjustments, emails
src/lib/                      shared with clients (and future mobile apps)
  netid.ts                    NYU/Stern identity + roster/tracker parsing
  event-window.ts, geo.ts     pure timing and geofence rules
  contracts.ts                zod request schemas for /api/v1
src/server/
  auth.ts                     Better Auth: NYU-only Google, Stern→NYU mapping, bearer tokens
  services/                   signups (ranking, waitlist), attendance, finalize, points, ...
  email*.ts                   Gmail SMTP + templates
src/app/api/v1/               JSON API (student routes + /committee/*)
src/app/                      web UI: student pages at /, /events/[slug]; committee at /committee
tests/                        unit tests (vitest)
```

## Path to iOS / Android

The web UI already uses the same `/api/v1` JSON API a native app would. With Expo (React Native):

- **Shared code:** reuse `src/lib/contracts.ts`, `event-window.ts`, `geo.ts` and `netid.ts`.
- **Auth:** add `@better-auth/expo`. Native Google Sign-In returns an ID token for `signIn.social({ provider: "google", idToken })`. The server's `bearer()` plugin accepts `Authorization: Bearer <token>`.
- **Presence:** native apps can use background geofencing to send real "left the area" events to the presence endpoint. That turns presence tracking from best-effort into actual tracking.

## Commands

```bash
npm run dev         # dev server
npm test            # unit tests
npm run typecheck   # TypeScript
npm run build       # production build
```
