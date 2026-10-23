---
name: BAP Community Service
description: A calm, native-feeling event app for logging community service, played straight to the category standard.
colors:
  crimson: "#bc202f"
  crimson-hover: "#a11b28"
  crimson-soft: "#fbe9eb"
  on-crimson: "#ffffff"
  sand: "#e1d6b7"
  sand-soft: "#f3eedf"
  gold: "#8a6d12"
  gold-bright: "#dec050"
  green: "#1f7a45"
  green-soft: "#e3f3e9"
  amber: "#a14800"
  amber-soft: "#fdeadb"
  blue: "#1f5fae"
  blue-soft: "#e6eefa"
  charcoal: "#2e2e2e"
  secondary: "#6b6b70"
  tertiary: "#9a9a9f"
  fill-strong: "#dcdcdf"
  fill: "#e9e9eb"
  ground: "#f2f2f3"
  surface: "#ffffff"
  separator: "rgb(46 46 46 / 0.12)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  stat:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.006em"
    fontFeature: "\"tnum\" 1"
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.006em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI Variable Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.006em"
rounded:
  control: "8px"
  segmented: "10px"
  field: "12px"
  group: "16px"
  pass: "22px"
  pill: "9999px"
spacing:
  hairline: "2px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
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
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "50px"
  button-secondary:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.fill-strong}"
  button-plain:
    textColor: "{colors.crimson}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-plain-hover:
    backgroundColor: "{colors.crimson-soft}"
  button-destructive:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.crimson}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-sm:
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
  group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.group}"
  row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.charcoal}"
    typography: "{typography.body}"
    padding: "12px 16px"
    height: "56px"
  event-pass:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pass}"
    padding: "16px"
  date-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.field}"
    size: "48px"
  date-tile-today:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.crimson}"
    rounded: "{rounded.field}"
    size: "48px"
  input:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
  input-focus:
    backgroundColor: "{colors.surface}"
  pill-neutral:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  pill-crimson:
    backgroundColor: "{colors.crimson-soft}"
    textColor: "{colors.crimson}"
    rounded: "{rounded.pill}"
    height: "24px"
  pill-green:
    backgroundColor: "{colors.green-soft}"
    textColor: "{colors.green}"
    rounded: "{rounded.pill}"
    height: "24px"
  pill-amber:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    height: "24px"
  pill-blue:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.blue}"
    rounded: "{rounded.pill}"
    height: "24px"
  pill-sand:
    backgroundColor: "{colors.sand-soft}"
    textColor: "{colors.gold}"
    rounded: "{rounded.pill}"
    height: "24px"
  segmented:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.segmented}"
    padding: "2px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "32px"
  nav-link:
    textColor: "{colors.secondary}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  nav-link-active:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  progress:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.pill}"
    height: "6px"
  progress-met:
    backgroundColor: "{colors.gold-bright}"
    rounded: "{rounded.pill}"
    height: "6px"
---

# Design System: BAP Community Service

## Overview

**Creative North Star: "The Native Pass"**

The category standard played straight. BAP Community Service looks and behaves like a well-made native event app: benchmarked against Luma for the event list and against Apple Wallet and iOS Settings for the pass, grouped lists, switches and segmented controls. Nothing on screen is there to be noticed; every screen leads with the one thing to do next, and the rest sits in quiet grouped lists below it.

The world is a neutral grey grouped ground carrying white inset groups divided by hairlines, charcoal text on a five-step neutral ramp, and exactly one voice of color: the crimson of nyubap.com, reserved for the action and for "today". Sand and gold appear only to mark an exception or a met requirement. Type is the platform's own system UI with tabular figures. Restraint is the aesthetic: less is more, one primary action per view, one authored animation in the whole product.

Density is phone-first and comfortable: one column on phones, and on desktop one 1024px frame for every signed-in page, so the bar and content edge never move between sections. Dark mode is a full peer of light mode, inverted to an iOS-style black ground with raised dark-grey groups.

**Key Characteristics:**
- Grey ground, white inset groups, hairline separators; no card grids.
- One crimson: primary buttons, today's date tile, live and focus state.
- System UI type with tabular figures throughout; no web display face.
- Pill buttons, filled inputs, segmented controls, iOS switches.
- The event pass is the signature surface; its check-in confirmation mark is the only authored animation.
- Inline two-step confirmation; never the browser's confirm() dialog.

## Colors

A monochrome grouped-list palette with a single crimson accent and a small set of semantic status tints, every token mirrored for dark mode.

### Primary
- **BAP Crimson** (crimson): the only action color. Primary buttons, plain/text buttons, the back link, the focus ring, the caret, the switch's on state, the badge count, live status and the today marker on the date tile. Hover deepens to **Crimson Pressed** (crimson-hover); **Crimson Wash** (crimson-soft) is the hover fill behind plain buttons, the selection highlight and the crimson pill/notice ground. Text on crimson is **On Crimson** (on-crimson). In dark mode crimson lifts to a coral-leaning `#f0606c` so it holds contrast on black.

### Secondary
- **Chapter Sand** (sand, sand-soft) and **Requirement Gold** (gold, gold-bright): the exception and achievement pair from nyubap.com. Gold-bright fills the points progress bar only once the requirement is met; gold is the text color for a met total and for the sand pill. Sand-soft is the ground of the sand pill, reserved for candidate-style exception marks.

### Tertiary (semantic status)
- **Confirmed Green** (green, green-soft): checked in, confirmed, positive point deltas.
- **Warning Amber** (amber, amber-soft): a distinct burnt-orange warning tone (waitlist, drafts, reviews open, late drop, expired code, negative deltas). It is deliberately orange so it never reads as a second crimson.
- **Info Blue** (blue, blue-soft): neutral system status (signed up, informational notices).

### Neutral
- **Charcoal** (charcoal): all primary text and the active nav pill.
- **Slate Secondary** (secondary): subtitles, footnotes, field labels, inactive nav.
- **Mist Tertiary** (tertiary): chevrons, leading line icons, placeholders. Glyphs and placeholders only.
- **Fill Strong** (fill-strong) and **Fill** (fill): secondary-button ground and hover, input ground, segmented track, neutral pill, progress track.
- **Grouped Ground** (ground): the page behind everything; black in dark mode.
- **Group Surface** (surface): every group, panel, pass and date tile; `#1c1c1e` in dark mode.
- **Hairline** (separator): 12% charcoal (12% white in dark) between rows and under the header.

### Named Rules
**The One Crimson Rule.** Crimson means "act here" or "this is today". Exactly one crimson-filled primary button per view; everything else that acts is a plain crimson label or a grey secondary pill.

**The Earned Gold Rule.** Sand and gold never decorate. They appear only for an exception or a met requirement; the progress bar is charcoal at 70% until the requirement is met, then turns gold-bright.

**The No Burnt Orange Rule.** nyubap.com's burnt orange (#C94817) is not part of this palette. Warnings use amber, which is its own tone.

## Typography

**Display Font:** System UI (-apple-system, SF Pro Text, Segoe UI Variable, Roboto, Helvetica Neue, Arial)
**Body Font:** the same system stack
**Label/Mono Font:** none; figures use the body face with tabular numerals

**Character:** The platform's own voice. Hierarchy comes from size and weight steps on one family, tightened slightly (-0.006em body, down to -0.025em on large titles), with tabular figures everywhere so times and point totals align.

### Hierarchy
Six named roles, defined once as Tailwind theme tokens in `globals.css` (`text-display`, `text-title`, `text-headline`, `text-body`, `text-footnote`, `text-caption`); screens use the role class, never a literal size.
- **Display** (700, 30px, 1.15, -0.025em): page titles ("Hi, Jordan", "Points", the event console title, the sign-in title). Balanced wrapping.
- **Title** (700, 20px, 1.25, -0.02em): the event title on the pass; centered titles on the 404 and error screens.
- **Headline** (600, 17px, 1.3): every section heading ("Your events", "Confirmed 4", form sections), status titles on the pass, large buttons.
- **Body** (500 for rows, 400 for prose; 15px, 1.45): row titles, inputs, notices, pass metadata, table cells, prose.
- **Footnote** (400, 13px, 1.4, secondary color): row subtitles, field labels and hints, status lines, metadata.
- **Caption** (600, 12px): status pills and counts. The date tile's month (700, 10px, uppercase) and its day number, and the points total (Stat, 28px), are the only literal sizes.

### Named Rules
**The System Voice Rule.** Use the system UI stack only. No Poppins and no web display face; the app should feel like part of the phone.

**The Tabular Rule.** Every number (times, points, counts, dates) renders with tabular figures; it is set on the body, so do not turn it off.

## Layout

One 1024px frame for every signed-in page (header and content alike), with 16px gutters that respect the landscape safe area. On phones everything is one column; from 1024px the student home and event page split into two columns (5:7): title, points and pass on the left, lists and details on the right, the home column sticky. Committee forms sit left-aligned at 672px inside the frame. Sign-in, privacy, 404 and error are standalone centered pages with no bar. A sticky 56px top bar on the grouped ground carries the logo and account; committee screens add a horizontally scrolling subnav of pill links beneath it, faded out at the right edge. Main content starts 24px under the bar and leaves room for the bottom safe area.

Vertical rhythm is section-based: 32px between sections, 8px between a group header and its group, 8px between a group and its footer. On touch screens every control has a 44px target: small pills keep their look and gain an invisible hit area (`.hit`), segmented and select controls grow to 40px, and fields render at 16px so iOS never zooms on focus. Rows are at least 56px tall with 12px/16px padding and 12px between leading tile, text and trailing content. Panels pad 16px on phones and 20px from the small breakpoint (640px). On phones, row trailing status stacks under the subtitle instead of taking width; page-title actions wrap below the title.

**The Next Thing First Rule.** Every screen opens with the large title and then the single most relevant object (the pass, the points row, "Needs attention"), followed by grouped lists. Never open with a grid of summary cards.

## Elevation & Depth

Flat by default. Depth comes from tone: white groups on a grey ground (dark-grey groups on black in dark mode). Shadows are reserved for objects that are physically "above" the list: the event pass, menus, and the moving parts of native controls.

### Shadow Vocabulary
- **Pass lift** (`0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06)`; dark mode becomes a 1px white 6% outline): the event pass only.
- **Menu float** (`0 10px 40px rgb(0 0 0 / 0.16)` plus a hairline ring): the account dropdown.
- **Control thumb** (`0 1px 3px rgb(0 0 0 / 0.12)` on the selected segment; `0 2px 4px rgb(0 0 0 / 0.18)` on the switch knob): native-control affordance.

### Named Rules
**The Only The Pass Lifts Rule.** Groups, panels, empty states and date tiles never carry a shadow. If a new surface wants one, it is either a pass or a floating menu, or it stays flat.

## Shapes

Soft, continuous iOS corners scaled to the object: 8px on segment buttons and menu items, 10px on the segmented track, 12px on inputs, selects and date tiles, 16px on groups, panels, notices and empty states, 22px on the pass. Everything a finger presses as a discrete action (buttons, pills, nav links, switches, avatars, progress bars) is fully round. Borders are rare: hairlines separate rows, a 1px ring outlines the date tile (crimson at 35% when today), and the pass's status block sits under a dashed hairline like a ticket stub. Icons are line icons at a single 2px stroke (Lucide), tertiary grey at 16px in metadata.

## Components

### Buttons
Quiet, confident pills; one loud one per view.
- **Shape:** fully round (pill) in three heights: 32px small, 40px medium, 50px large (full width on the pass).
- **Primary:** crimson fill, on-crimson semibold label; deepens on hover.
- **Secondary:** fill-grey pill with charcoal label; steps to fill-strong on hover.
- **Plain:** crimson label with no fill; crimson-wash on hover. Used for inline row actions ("Undo check-in", "Remove").
- **Destructive:** fill-grey pill with a crimson label; used as the armed state of a destructive confirmation.
- **States:** 150ms background transition, press scales to 98%, disabled at 40% opacity, crimson 2px focus outline offset 2px.

### Inline Confirmation
- **Behavior:** a plain button that, when tapped, swaps in place for "Cancel" (secondary) and the confirm label (destructive, or primary when not destructive), focuses the confirm, and disarms after 5 seconds. This replaces every browser confirm() dialog.

### Chips (Pills)
- **Style:** 24px pill, 12px semibold label, soft tinted ground with matching tone text: neutral, crimson (live), green (confirmed, checked in), amber (waitlist, review open, warnings), blue (signed up), sand/gold (exception).
- **Notice:** the same tone pairs at 14px in a 16px-radius block, with an optional trailing action that stacks on phones.

### Cards / Containers
- **Group:** the inset grouped list. Surface, 16px radius, rows separated by hairlines, no shadow, no border.
- **Row:** 56px minimum; optional leading date tile or avatar, 15px medium title, 13px secondary subtitle, trailing status, and a tertiary chevron when it links. Linked rows tint with fill on hover and press.
- **Panel:** surface, 16px radius, 16/20px padding, for forms and composite content.
- **Empty:** a centered surface block with a 28px tertiary line icon, 15px title and secondary explanation.

### Inputs / Fields
- **Style:** filled, borderless: fill ground, 12px radius, 15px text, tertiary placeholder. Selects draw their own chevron.
- **Focus:** ground lifts to surface with a 2px crimson ring at 40%.
- **Field:** 13px medium secondary label above; hint below in secondary, replaced by a crimson error line.
- **Toggle:** the iOS switch (51 × 31px), fill-strong off, crimson on, white knob.

### Navigation
- **Top bar:** sticky, grouped ground at 95%, hairline bottom border. Left: the crimson rounded-square ΒΑΨ mark and "Community Service" in 15px semibold. Right: section links (desktop) and the avatar menu.
- **Nav links / subnav:** 32px pills, 14px medium secondary text; active is a charcoal pill with ground-colored text; a crimson count badge for items needing attention. The subnav scrolls horizontally on phones and keeps the active pill in view.
- **Segmented control:** fill track, white selected segment with a thumb shadow, 13px semibold; for in-page views (People / Pick who goes / Award points).
- **Back link:** crimson 15px label with a line chevron.

### Date Tile
A small printed-calendar tile: surface ground, 12px radius, hairline ring, uppercase month over the day number. Sizes 40/48/64px. Today's tile is marked in crimson type with a crimson ring, never a crimson block, so it cannot compete with the primary button. Muted tiles grey the day for past events.

### Event Pass (signature)
The event as an Apple Wallet pass: the one thing a student needs on the day. A 22px-radius surface with the pass lift; a large date tile beside the 20px bold title and partner org; time and place on line-icon rows; a status line under a dashed ticket-stub separator; then one full-width large action (Check in, Open to check out). Used on home and atop the event page.

### Check-in Confirmation Mark
The single authored animation. On a successful check-in the green status circle pops in (320ms, slight overshoot) and its check stroke draws itself (360ms, 140ms delay). It is disabled under reduced motion. Everything else in the product moves only through 150–200ms state transitions.

## Do's and Don'ts

### Do:
- **Do** put exactly one crimson primary button in a view; make every other action a secondary pill or a plain crimson label.
- **Do** build lists as white inset groups on the grey ground with hairline separators and 56px rows.
- **Do** mark today on the date tile with crimson type and ring, never a crimson fill.
- **Do** confirm risky actions inline with the two-step Confirm Button (Cancel / confirm label, 5-second disarm).
- **Do** use amber for warnings and pending exceptions, green for confirmed, blue for neutral info.
- **Do** reserve gold-bright and gold for a met requirement and sand for exception marks.
- **Do** keep every number tabular and every icon a 2px line icon.
- **Do** define every new color as a light and dark token pair in the global stylesheet.

### Don't:
- **Don't** use the browser's confirm() or alert() dialogs.
- **Don't** introduce burnt orange (#C94817), Poppins, or any web display face.
- **Don't** add a second authored animation or decorative motion; state transitions stay at 150–200ms.
- **Don't** lay out dashboards of summary cards or put shadows on groups and panels.
- **Don't** use crimson for decoration, headings or category color.
- **Don't** put small uppercase kickers or eyebrows above titles; the date tile's month is the only uppercase label.
- **Don't** set readable text in the tertiary grey; it is for glyphs and placeholders.
