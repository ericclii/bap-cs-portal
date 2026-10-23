import type { Metadata } from "next";
import { Mark } from "@/components/app-shell";
import { BackLink } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy policy" };

const UPDATED = "October 24, 2026";

export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-16">
      <BackLink href="/signin">Sign in</BackLink>
      <div className="mt-6 flex items-center gap-3">
        <Mark size={36} />
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.025em]">Privacy policy</h1>
      </div>
      <p className="mt-2 text-body text-secondary">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-7 text-body leading-relaxed text-pretty [&_h2]:mb-2 [&_h2]:text-headline [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-text/90">
        <section>
          <p>
            The BAP Community Service Portal is run by the Community Service committee of Beta Alpha Psi, Mu Chapter, at NYU Stern. It
            lets members sign up for community service events, check in and out on site, and track their community service points. This
            policy explains what the portal collects and how it is used.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>
          <ul className="space-y-1.5">
            <li>
              <strong>From your Google account</strong>, when you sign in: your name, NYU email address (from which we take your NetID) and
              profile photo. We do not get your password or access to your email, files or calendar.
            </li>
            <li>
              <strong>Your activity in the portal:</strong> the events you sign up for, waitlist positions, drops and the reasons you give,
              check-in and check-out times, and the points recorded for you.
            </li>
            <li>
              <strong>Your location, only at events:</strong> when you check in or out, your phone shares its location once so we can confirm
              you are on site. While you are checked in and the event page is open, it may record your location every few minutes. Location
              is never collected outside an event you are checked in to, and only when you allow it in your browser.
            </li>
            <li>
              <strong>Notes you send the committee</strong>, such as a reason for checking out early or a location problem.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use it</h2>
          <ul className="space-y-1.5">
            <li>To run events: choosing who attends, managing the waitlist and confirming attendance.</li>
            <li>To record and show your community service points and attendance history.</li>
            <li>To email you about your events: confirmations, waitlist changes, reminders, cancellations and points results.</li>
          </ul>
          <p className="mt-2">We do not sell your information, show ads, or use it for anything unrelated to the chapter&apos;s community service program.</p>
        </section>

        <section>
          <h2>Who can see it</h2>
          <p>
            Members of the Community Service committee can see sign-ups, attendance, locations recorded at check-in and check-out, and points
            for chapter members. Other members cannot see your information. The portal is hosted on Vercel, stores data with Neon (a
            Postgres database provider), and sends email through Google, who process data only to provide those services.
          </p>
        </section>

        <section>
          <h2>Usage analytics</h2>
          <p>
            We use Vercel Web Analytics to count page views so we know which parts of the portal are used. It does not use cookies, does
            not identify you, and only records the page address (without anything after a &ldquo;?&rdquo;), the referring site, and your
            general country, browser and device type. Vercel Speed Insights also measures how quickly pages load, using the same
            limited, anonymous details.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Attendance and points are kept so the chapter can verify membership requirements, and are organized by semester. You can ask the
            committee to correct or delete your information at any time.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions or requests:{" "}
            {contact ? (
              <a className="font-medium text-crimson underline" href={`mailto:${contact}`}>
                {contact}
              </a>
            ) : (
              "the Beta Alpha Psi Mu Chapter Community Service committee"
            )}
            .
          </p>
        </section>
      </div>
    </main>
  );
}
