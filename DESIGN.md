---
name: BAP Community Service
description: The semester as a service passbook; white entries on warm grey, charcoal ink and one crimson that stamps what you served.
colors:
  crimson: "#bc202f"
  crimson-hover: "#a11b28"
  crimson-soft: "#f9e9ea"
  on-crimson: "#ffffff"
  gold: "#7d6514"
  gold-bright: "#c9a227"
  green: "#1f7a45"
  amber: "#9a4700"
  blue: "#6f5a10"
  text: "#2e2e2e"
  secondary: "#6b6658"
  placeholder: "#6f6a5b"
  tertiary: "#a29c88"
  rule: "#c6bf9c"
  separator: "#f0ede6"
  fill-strong: "#e5e1d6"
  fill: "#efece5"
  ground: "#f5f3ee"
  surface: "#ffffff"
typography:
  figure:
    fontFamily: "Raleway, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "64px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
  display:
    fontFamily: "Raleway, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
  title:
    fontFamily: "Raleway, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
  headline:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.006em"
    fontFeature: "\"tnum\" 1"
  footnote:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.006em"
  caption:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
  seal:
    fontFamily: "Cinzel, \"Times New Roman\", serif"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  segment: "8px"
  box: "10px"
  field: "12px"
  entry: "16px"
  pill: "9999px"
spacing:
  hairline: "2px"
  xs: "8px"
  header: "10px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  top: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.on-crimson}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.crimson-hover}"
  button-primary-lg:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.on-crimson}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "50px"
  button-secondary:
    textColor: "{colors.text}"
    padding: "0"
    height: "40px"
  button-plain:
    textColor: "{colors.crimson}"
    padding: "0"
    height: "40px"
  button-destructive:
    textColor: "{colors.crimson}"
    padding: "0"
    height: "40px"
  button-sm:
    typography: "{typography.footnote}"
    height: "32px"
  header:
    backgroundColor: "{colors.surface}"
    height: "56px"
  entry:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.entry}"
  row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    padding: "12px 16px"
    height: "56px"
  row-hover:
    backgroundColor: "{colors.ground}"
  row-pressed:
    backgroundColor: "{colors.fill}"
  event-pass:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.entry}"
    padding: "16px"
  date-box:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    size: "48px"
  date-box-next:
    backgroundColor: "{colors.crimson-soft}"
    textColor: "{colors.crimson}"
    rounded: "{rounded.field}"
    size: "48px"
  stamp-box:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.box}"
  stamp-box-open:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.box}"
  stamp:
    textColor: "{colors.crimson}"
    typography: "{typography.seal}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
  input-focus:
    backgroundColor: "{colors.surface}"
  pill:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  notice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.entry}"
    padding: "12px 16px"
  notice-alert:
    backgroundColor: "{colors.crimson-soft}"
    textColor: "{colors.crimson}"
    rounded: "{rounded.entry}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.secondary}"
    padding: "0 10px"
    height: "32px"
  nav-link-active:
    textColor: "{colors.text}"
    padding: "0 10px"
    height: "32px"
  segmented:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.box}"
    padding: "2px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.segment}"
    padding: "0 14px"
    height: "32px"
  progress:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.pill}"
    height: "6px"
  progress-met:
    backgroundColor: "{colors.gold-bright}"
    rounded: "{rounded.pill}"
    height: "6px"
  range-track:
    backgroundColor: "{colors.fill-strong}"
    height: "4px"
  range-thumb:
    backgroundColor: "{colors.crimson}"
    rounded: "{rounded.pill}"
    size: "18px"
---

# Design System: BAP Community Service

## Overview

**Creative North Star: "The Service Passbook"**

The semester is a passbook. Every event a student serves leaves a crimson stamp on the page until the page is full; everything else is ink on paper. The colours are the chapter crest's: charcoal ink on a warm ramp, and crimson reserved for what acts, what is next, and what was earned. Regions are told apart by tone, never by outlines: white entries sit on a warm light-grey ground, and fields, tracks, pills and open boxes sink one step into a deeper warm fill. No surface carries a border.

Hierarchy is scale, not decoration. Two voices share a steep ramp: Raleway speaks for titles, the points figure (64px, 800, the only large type), the wordmark and date boxes, while Cinzel, the crest's serif, inks the stamps; Lato carries every row, button, field, pill and notice. Time is drawn to length: the event pass shows the time on site as a bar with the check-out moment marked. The crest seal recurs at three sizes (the bar, a met requirement, sign-in) and is the browser-tab and home-screen icon.

Students use it on phones on the day; the committee works the same ledger on phones and laptops. Density is comfortable and phone-first, flat, and calm. Actions other than the one crimson primary are words that draw an underline when you reach for them. Motion is a small, consistent vocabulary on one family of out-curves: pages rise into focus, popovers settle, in-place content reveals, and the check-in stamp lands.

**Key Characteristics:**
- Tone, not lines: warm grey ground, white surfaces, a deeper fill for fields, tracks, pills and open boxes; no borders or outlines on any region or control.
- Crimson only for the primary action, text actions, the next (or today's) date, stamps, alerts and focus.
- State hues (green, amber, crest gold) appear as words, bare line icons and signed figures; never as dots and never as fills.
- One filled crimson pill per view; every other action is text with a drawn underline.
- Raleway for headings, the figure, the wordmark and date boxes; Cinzel only inside stamps; Lato for all UI text; tabular figures throughout; the 64px points figure is the only large type.
- The checkpoint stamps and the event pass are the signature surfaces; the stamp landing is the one signature motion.
- Inline two-step confirmation; never the browser's confirm() dialog.

## Colors

Crest colours on a warm tonal ramp: a light-grey ground, white surfaces, two deeper fills, one crimson and a handful of state inks.

### Primary
- **Crest Crimson** (crimson): the primary pill, plain and destructive text actions, the back link, the "Sign in" link, the review count beside a nav tab, the switch's on state, the range progress and thumb, the focus ring and caret, error lines and alert notices, the next event's (or today's) date type, and every stamp. **Pressed Crimson** (crimson-hover) is primary hover. **Crimson Blush** (crimson-soft) is the ground of alert notices and of the next (or today's) date box, and the text-selection highlight. Text on crimson is **On Crimson** (on-crimson).

### Secondary
- **Standing Gold** (gold, gold-bright): earned and current. Gold-bright draws the active nav tab's underline; gold is the text of a met total in the committee's points table and of the exception pill.

### Tertiary (state)
- **Confirmed Green** (green): checked in, confirmed, positive deltas.
- **Burnt Amber** (amber): warnings, late drops, early check-outs, no-shows, negative deltas, and amber notices.
- **Crest Gold Ink** (blue): in progress and informational status (signed up, sign-ups open); the token keeps its name but is a dark crest gold, not a cool blue.
All three appear as a short status word, a bare line icon or a signed figure; never as a dot and never as a tinted ground.

### Neutral
- **Charcoal Ink** (text): all primary text and secondary text actions; the time-on-site check-out tick; the unmet progress bar at 70%.
- **Khaki Secondary** (secondary): subtitles, footnotes, field labels, inactive nav, neutral pills, open milestone figures, the "points" beside the figure.
- **Placeholder Khaki** (placeholder): every field placeholder, legible on the fill.
- **Faint Khaki** (tertiary): chevrons and empty-state line icons only; never readable text.
- **Crest Khaki** (rule): no longer a frame. Only the required stretch of the time-on-site bar and the scrollbar thumb.
- **Faint Hairline** (separator): only between rows inside a list group and between rows of the points table.
- **Warm Fill** (fill): fields and selects at rest, progress, time-on-site and segmented tracks, pills, unreached milestone boxes, the pending stamp, date boxes, avatar ground, row press.
- **Warm Fill Strong** (fill-strong): the switch's off track and the range track.
- **Warm Grey Ground** (ground): the page behind everything; also the hover tint on linked rows and menu items.
- **Entry White** (surface): every entry, group, panel, pass, notice, empty state, menu, reached milestone box and focused field; the header at 85% with backdrop blur.

### Named Rules
**The Tone Not Line Rule.** Regions are separated by tone alone: ground, white surface, fill. Sections, cards, panels, passes, inputs, selects, menus, the header, notices, empty states, date boxes and milestone boxes never take a border or outline. The only lines are faint separator hairlines between rows inside one group or table.

**The Crimson Burns Once Rule.** Crimson means act here, this is next, or this was stamped. Exactly one crimson-filled primary per view; only the next event's (or today's) date box is crimson; nothing decorative, no headings, no category colour.

**The No Dot Rule.** State is never a coloured dot or circle. It is a tinted word (on a fill lozenge in a pill), a bare line icon, or a signed figure.

## Typography

**Display Font:** Raleway, variable (via next/font as `--font-raleway`, exposed as `--font-display`; fallback -apple-system, Segoe UI, Roboto, sans-serif)
**Body Font:** Lato 400 and 700 (via next/font as `--font-lato`, exposed as `--font-sans`; same fallback)
**Stamp Font:** Cinzel 700 (via next/font as `--font-cinzel`, exposed as `--font-seal`), used only inside stamps

**Character:** An elegant geometric display face over a sturdy humanist sans. Every h1, h2 and h3 (page titles, section headings, the event title, the points figure and the "points" beside it), the wordmark, date boxes and stamps are Raleway; everything else is Lato. Spacing tightens slightly with size (-0.006em on body to -0.04em on the figure). Raleway defaults to old-style figures, so headings, `.font-display` and stamps set lining, tabular figures; the body sets tabular figures for points, times and counts. Lato ships only 400 and 700: a medium request renders regular and a semibold request renders bold, so UI text has exactly two weights.

### Hierarchy
Roles are defined once as theme tokens in `globals.css`; screens use the role, not a literal size.
- **Figure** (Raleway 800, 64px, 0.9, -0.04em, lining tabular): the student's points total, and nothing else.
- **Display** (Raleway 700, 30px, 1.15): page titles (the committee term title, the event console, sign-in).
- **Title** (Raleway 700, 20px, 1.25): section headings ("Open for sign-up", "History", "Next"), the event title on the pass.
- **Headline** (17px, 1.3): in Raleway for the wordmark beside the seal and "points" inside the figure's heading; in Lato bold for status titles, large buttons and open milestone figures.
- **Body** (Lato 400, bold where emphasis is needed; 15px, 1.45): row titles, inputs, notices, nav tabs, pass metadata, prose.
- **Footnote** (Lato, 13px, 1.4): row subtitles, field labels and hints, the time-on-site labels, small buttons, segments, the nav count.
- **Caption** (Lato bold, 12px): pill labels and milestone names.
- **Seal** (Cinzel 700, sized to the stamp by container units, 0.06em tracking on the date line): signed points, IN/OUT, time and date inside stamps; uppercase is native here.
The date box is set in Raleway: its month (700, 10px, uppercase) and day number (17/20/28px, tabular) are its own fixed sizes.

### Named Rules
**The One Large Number Rule.** The points figure is the only large type on any screen; everything else lives at 30px or below.

**The Two Voices Rule.** Raleway is for h1 to h3, the points figure, the wordmark and date boxes; Lato is for every other piece of UI text. Stamps alone are set in Cinzel, the serif of the crest, and Cinzel appears nowhere else. Never set a button, row, field, pill or notice in Raleway, and never request Lato at 500 or 600, which it does not have.

**The Tabular Rule.** Every number renders with tabular figures, and Raleway's numbers are lining as well; it is set on the body, headings and `.font-display`, so do not turn it off or set Raleway numbers outside those hooks.

## Layout

One 1024px frame (max-w-5xl) for every signed-in page, header and content alike, with 16px gutters that respect the landscape safe area, so the bar and content edge never move between sections. Phones get one column. From 1024px the student home and event page split into two columns at 5:7 with a 40px gap: on home, the figure, stamp grid and next pass on the left (sticky under the bar), lists on the right. Committee forms (new and edit event) sit left-aligned at 672px inside the frame. Sign-in, privacy, 404 and error are standalone centred pages with no bar; the on-site QR screen is a standalone full-height display on the ground.

A sticky 56px bar in translucent white (85%, backdrop blur and saturate) carries the seal and "Community Service" on the left and section tabs and the avatar on the right (on phones, a hamburger icon that turns into a close icon opens the same menu); it has no bottom rule, the tone change against the ground is the edge. Committee screens add a horizontally scrolling banner of text tabs in its own khaki tint (#e8e1cb) that fades at the phone's right edge. Content starts 24px under the bar and clears the bottom safe area.

Rhythm is section-based: 32px between sections, 10px between a section heading and its entry, 8px to a footer. Rows are at least 56px with 12px/16px padding and 12px between leading box, text and trailing content. Panels and passes pad 16px, 20px from 640px. The stamp grid is four columns with 8px gaps. Adjacent text buttons sit 0.75rem apart, since they carry no padding of their own.

On touch screens every small control gets a 44px target through the `.hit` class (an invisible expanded hit area, look unchanged); segmented controls and selects grow to 40/44px; fields render at 16px on coarse pointers so iOS never zooms on focus. On phones a row's trailing status stacks under its subtitle; page-title actions wrap below the title.

**The Next Thing First Rule.** The committee area has three tabs, Events (which carries what needs attention and open reviews), Points (checkpoint standing, totals and the roster) and Manage; sections with nothing in them do not render. Every screen opens with its title or figure and then the single most relevant object (the checkpoint stamps and next pass; on the committee's Events screen, "Needs attention" and open reviews), followed by lists. Never open with a grid of summary cards.

## Elevation & Depth

Flat and tonal. Depth is the step between ground, white surface and fill; entries, panels, passes, notices and milestone boxes cast no shadow. Shadows exist only on things that physically float or are grabbed: popovers, the map control and control thumbs.

### Shadow Vocabulary
- **Pop** (`--shadow-pop`: `0 2px 6px rgb(46 46 46 / 0.06), 0 16px 40px rgb(46 46 46 / 0.12)`): the account menu, the console's action menus and the Leaflet zoom control. No ring.
- **Segment thumb** (`0 1px 3px rgb(46 46 46 / 0.12)`): the selected segment.
- **Switch knob** (`0 2px 4px rgb(0 0 0 / 0.18)`) and **range thumb** (`0 1px 3px rgb(46 46 46 / 0.25)`): native-control affordance.
- **Stamp inner ring** (`inset 0 0 0 3px surface, inset 0 0 0 4.5px crimson`): draws the stamp's second ring; ink, not elevation.

### Named Rules
**The Tone Not Shadow Rule.** Resting surfaces never cast a shadow. If a new surface needs separation, give it the next tone (white on ground, fill on white), not a shadow and not a line.

## Shapes

Soft corners scaled to the object: 8px on segments and menu items, 10px on milestone boxes and the segmented track, 12px on fields, selects, date boxes and the map control, 16px on entries, panels, passes, notices, empty states and menus. The primary button, pills, switches, avatars, progress bars and the range thumb are fully round, and so is the stamp. Text actions have no shape at all: no pill, no padding, only the label and its underline. The stamp is a 2px crimson ring with an inner hairline ring; nothing else has a stroke. "Still to fill" is shown by the fill tone (open milestone boxes, the pending stamp as a fill disc), never by dashes. Icons are 2px-stroke line icons (Lucide), 16px in metadata, 20px for status, always bare. The crest seal is a raster image, never redrawn.

## Components

### Buttons
One loud pill per view; everything else is a word.
- **Primary:** fully round crimson fill, white bold label, at 32px (small), 40px (medium) and 50px (large, full width on the pass); deepens to pressed crimson on hover, press scales to 98%.
- **Secondary, Plain, Destructive:** text only, bold, no fill, no ring, no padding. Secondary is ink; plain and destructive are crimson. "Open to check out" and "Cancel" are secondary; inline row actions and the unarmed confirm are plain; the armed confirm is destructive.
- **The underline:** every text action, nav tab, back link and small link carries a 1.5px underline in its own colour that draws in left to right on hover (scaleX from a left origin, 420ms, ease-out-quint `cubic-bezier(0.22, 1, 0.36, 1)`) and retracts right to left when the pointer leaves. It is drawn on keyboard focus and stays drawn on the current page.
- **States:** 200ms transitions, disabled at 40% opacity, 2px crimson focus outline offset 2px. Small buttons carry `.hit`; adjacent text buttons sit 0.75rem apart.

### Inline Confirmation
A plain button that, when tapped, swaps in place for Cancel (secondary) and the confirm label (destructive, or primary when not destructive), focuses the confirm, and disarms after 5 seconds. It replaces every browser confirm() dialog.

### Pills and Notices
- **Pill:** 24px fully round lozenge in fill, 12px bold label tinted by tone (green, amber, crest gold ink, crimson, gold for exceptions; secondary when neutral). No dot, no ring.
- **Notice:** a 16px-radius white block, 15px text in ink (amber for warnings), no dot and no ring; an alert is crimson text on crimson blush. It reveals in place; an optional action stacks under it on phones.

### Entries / Containers
- **Group:** white, 16px radius, rows divided by faint separator hairlines, no border, no shadow.
- **Row:** 56px minimum; optional leading date box or avatar, 15px title (medium, which Lato renders regular), 13px secondary subtitle, trailing status or signed figure, faint-khaki chevron when it links. Linked rows tint to the ground on hover and to fill on press.
- **Panel:** a plain white block with 16/20px padding, for forms and composite content.
- **Empty:** a white block, centred faint line icon, 15px bold title and secondary explanation.
- **Points table:** separator hairline under the header and between rows; nothing frames it.

### Inputs / Fields
- **Style:** fill ground, no border, 12px radius, 15px ink text, placeholder khaki. Selects draw their own chevron in secondary.
- **Focus:** the field lifts to white with a 2px crimson ring at 60%.
- **Field:** 13px secondary label above; hint below in secondary, replaced by a crimson error line.
- **Toggle:** a 51 × 31px switch, fill-strong off, crimson on, white knob.
- **Range:** a borderless 4px fill-strong track that fills crimson up to an 18px crimson thumb; the thumb grows to 115% while held.

### Navigation
- **Bar:** the 30px crest seal and "Community Service" (Raleway 17px bold) on the left; "My service" / "Committee" tabs and the avatar menu on the right (a hamburger icon below 640px); translucent white, blurred, no rule.
- **Nav tabs and subnav:** 32px text tabs, 15px regular secondary, ink on hover with the underline drawing in. The current tab is ink, at the same weight as the rest so selecting it never shifts its neighbours, with its underline held in gold-bright at 2px (crimson on the committee banner). Tapping a tab never scrolls the strip; only on first load is an off-screen current tab brought into view. A count of items needing attention follows the label as bold crimson footnote text, not a filled badge. The subnav keeps the current tab in view.
- **Segmented control:** fill track, white selected segment with the thumb shadow, 13px bold.
- **Back link:** crimson 15px label with a line chevron and the underline.
- **Menus:** white, 16px radius, pop shadow, items tint to the ground on hover; they open with `.pop-in`.

### Date Box
A printed-calendar box: fill ground, 12px radius, no ring, 10px uppercase month over the day number, at 40/48/64px. The next event's box (and today's) turns crimson blush with crimson type; never a solid crimson block. Past events grey the day.

### Checkpoint Stamps (signature)
The passbook page under the points figure: one 10px-radius box per checkpoint of the current term (a chair sets each one's name, points and due date under Manage; no date means the end of the semester), in due order, captioned with its name and "By Oct 24" or "End of semester". Up to five share a row (more wrap in fours; under 360px they wrap as they fit). A reached checkpoint is a white box with a crimson Cinzel double-ring stamp at 80% (its points over the day it was reached), tilted on a fixed cycle (-9°, 5°, -3°, 8°, -6°). One still ahead is a fill box showing its points in secondary; one whose date passed unreached shows its points and "Missed" in amber. Points have no cap; the figure reads "24 points", and the 56px seal appears beside it once every checkpoint is reached.

### Event Pass (signature)
The event as a passbook entry: a white entry with the 64px date box beside the 20px title, time, place and partner; then the time on site drawn to scale (a fill track with the required stretch in crest khaki and an ink tick labelled "Check out from …"); a status line with a bare tone icon (or the stamp) and a headline title; then one full-width large action (Check in, or the secondary Open to check out). Used on home ("Next") and atop the event page.

### Check-in Stamp
On the event page, attendance shows as an 80px crimson stamp reading IN or OUT with the time and date, rested at -9°. Right after the tap it lands once: `stamp-land`, 420ms, ease-out-expo (`cubic-bezier(0.16, 1, 0.3, 1)`), from 1.9× scale and -24° to rest. Under reduced motion it appears already at rest.

### Motion
One family of curves, all cubic-bezier: ease-out-expo and ease-out-quint. Tailwind's default transition is 200ms ease-out-quint, so every state change shares it.
- **Page transition:** a plain fade in place. Each page mounts inside `.page-fade` (the page shell, and the committee template, which remounts per section) and fades from 0 to 1 over 320ms (ease-out-quint). The old page is gone at once, so pages never overlap, and nothing moves. No View Transitions API: it behaved inconsistently in mobile Safari.
- **Committee banner:** the committee tab strip is a banner in its own khaki tint (`--banner` #e8e1cb, quiet tabs in `--banner-ink` #575245, the current tab underlined in crimson). It slides down from under the bar when the committee area opens (`banner-in`: translateY -100% to 0, 480ms, cubic-bezier(0.25, 1, 0.5, 1)) and, on leaving for a page without it, a copy slides back up behind the bar (`banner-out`, 340ms, cubic-bezier(0.65, 0, 0.35, 1)) and is removed. Transform only, inside a clip, so the tabs move exactly with the banner edge and nothing re-lays out; moving between committee sections replays nothing.
- **Popover:** `.pop-in`, 240ms ease-out-expo, from 6px above at 97% scale.
- **In-place reveal:** `.reveal`, 320ms ease-out-expo, rising 6px; used by notices and inline forms.
- **Stamp landing:** as above, on check-in and check-out.
- **Reduced motion:** the reveal and popover fall back to a plain opacity fade, the banner appears without sliding, the underline snaps and the stamp rests; the page fade stays.

### Crest Seal
The chapter crest raster: 30px in the bar, 56px beside the figure once every checkpoint is reached (and on the QR screen), 96px on sign-in, and the favicon and Apple touch icon. Always decorative next to words that name the app.

## Do's and Don'ts

### Do:
- **Do** separate regions by tone: white surfaces on the warm grey ground, fill for fields, tracks, pills, date boxes and open milestone boxes.
- **Do** put exactly one crimson-filled primary pill in a view; every other action is a text button with the drawn underline.
- **Do** mark the current nav tab with its underline held in gold-bright at 2px.
- **Do** mark only the next event's (or today's) date box in crimson blush and crimson type.
- **Do** carry state with a tinted word, a bare line icon or a signed figure in green, amber, crest gold ink or gold.
- **Do** keep the 64px points figure the only large type; set headings, the figure, the wordmark and date boxes in Raleway with lining tabular figures, stamps in Cinzel, and everything else in Lato 400 or 700.
- **Do** confirm risky actions inline with the two-step Confirm Button (Cancel / confirm label, 5-second disarm).
- **Do** give small controls `.hit` and keep fields at 16px on coarse pointers.
- **Do** animate only with the motion vocabulary (page transition, pop-in, reveal, stamp landing, 200ms state changes) and give each a reduced-motion opacity fallback.

### Don't:
- **Don't** put a border or outline on sections, cards, panels, passes, inputs, selects, menus, the header, notices, empty states, date boxes or milestone boxes; hairlines belong only between rows in a group or table.
- **Don't** use coloured indicator dots or circles for status, and don't put a filled circle behind a count.
- **Don't** fill or tint a surface with a state colour (no green, amber or gold soft-tinted pills, notices or cards).
- **Don't** give secondary, plain or destructive actions a pill, ring or fill.
- **Don't** put shadows on resting surfaces; shadows are for popovers, the map control and control thumbs.
- **Don't** use dashed strokes for "still to fill"; use the fill tone.
- **Don't** use the default `ease` timing, bounce or elastic curves, or motion outside the vocabulary; linear is only for a meter that tracks the clock (the QR countdown).
- **Don't** use a dark mode or the system font stack as the display face; this world is light only, in Raleway and Lato.
- **Don't** use crimson for headings, decoration or category colour.
- **Don't** put small uppercase kickers or eyebrows above titles; uppercase belongs to the date box month and the stamp's ink.
- **Don't** set readable text in the faint khaki (tertiary); it is for chevrons and empty-state icons.
- **Don't** use the browser's confirm() or alert() dialogs.
