import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo.js'

export default function Privacy() {
  useSeo({ title: 'Privacy Policy', description: 'How VoteOffside collects, uses and protects your data, including cookies and Google AdSense advertising.', path: '/privacy' })
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 13, 2026</p>
      </div>

      <div className="card p-6 space-y-5 text-sm leading-relaxed">

        <section className="space-y-2">
          <h2 className="text-base font-bold">1. Overview</h2>
          <p>
            VoteOffside ("we", "us", or "our") operates the website voteoffside.com (the "Site").
            This Privacy Policy explains what information we collect, how we use it, and your rights
            regarding that information. By using the Site you agree to the practices described here.
          </p>
          <p>
            We built VoteOffside with privacy in mind. We do not require you to create an account,
            and we do not collect your name, email address, or any other directly identifying
            personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">2. Information We Collect</h2>

          <h3 className="font-semibold text-ink">2a. Anonymous browser identifier</h3>
          <p>
            To allow you to vote and track your predictions across visits, we generate a random
            anonymous identifier (fingerprint) and store it in your browser's <code>localStorage</code>.
            This identifier contains no personal information. It is used solely to associate your
            votes with your device so you don't lose your predictions on page reload.
          </p>

          <h3 className="font-semibold text-ink">2b. Votes and predictions</h3>
          <p>
            When you submit a match prediction, we store the match identifier, the team you picked,
            and your anonymous identifier in our database. Optionally, if you choose to set a
            display name for the leaderboard, that name is also stored alongside your predictions.
            Display names are not verified and should not include personal information.
          </p>

          <h3 className="font-semibold text-ink">2c. Preferences</h3>
          <p>
            Your theme preference (light or dark mode), favourite teams, and favourite players are
            stored in your browser's <code>localStorage</code>. This data never leaves your device
            and is not transmitted to our servers.
          </p>

          <h3 className="font-semibold text-ink">2d. Usage data</h3>
          <p>
            Like most websites, our hosting infrastructure automatically logs basic server access
            data such as your IP address, browser type, referring URL, and pages visited. This data
            is used only for security monitoring and aggregate traffic analysis. It is not linked to
            your anonymous identifier or vote data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">3. Google AdSense and Third-Party Advertising</h2>
          <p>
            We use <strong>Google AdSense</strong> to display advertisements on the Site. Google
            AdSense uses cookies and similar technologies to serve ads based on your prior visits
            to this and other websites. Google's use of advertising cookies enables it and its
            partners to serve ads based on your visit to our site and/or other sites on the
            Internet.
          </p>
          <p>
            You may opt out of personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              Google Ads Settings
            </a>
            . Alternatively, you can opt out of a third-party vendor's use of cookies for
            personalized advertising by visiting{' '}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              www.aboutads.info
            </a>
            .
          </p>
          <p>
            Google's privacy policy is available at{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              policies.google.com/privacy
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">4. Cookies</h2>
          <p>
            We use the following types of cookies and similar technologies:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>localStorage</strong> — first-party storage used to persist your anonymous
              identifier, predictions, display name, theme, and favourites on your device.
            </li>
            <li>
              <strong>Google AdSense cookies</strong> — third-party cookies set by Google to
              deliver and measure relevant advertisements. These may include the <code>__gads</code>,
              {' '}<code>IDE</code>, and <code>DSID</code> cookies among others.
            </li>
            <li>
              <strong>Analytics cookies</strong> — if we use an analytics service (e.g. Google
              Analytics), it may set cookies to track aggregate visitor behaviour. No personally
              identifying data is collected.
            </li>
          </ul>
          <p>
            You can control or delete cookies via your browser settings. Note that disabling cookies
            may affect the functionality of the Site (for example, your votes may not persist
            between sessions).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">5. Third-Party APIs</h2>
          <p>
            The Site may load resources from third-party services including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>flagcdn.com</strong> — used to serve country flag images. Your browser will
              make requests to flagcdn.com when viewing team information.
            </li>
            <li>
              <strong>Supabase</strong> — our backend database provider. Vote and prediction data is
              stored on Supabase servers. Data is stored anonymously (no personal accounts).
              Supabase's privacy policy is available at supabase.com/privacy.
            </li>
            <li>
              <strong>Unsplash</strong> — used to serve background images on the site. Images load
              from images.unsplash.com. Their privacy policy applies.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">6. No Personal Accounts or Login</h2>
          <p>
            VoteOffside does not offer mandatory user accounts or registration. You do not need to
            provide an email address to use the Site. An optional sign-in feature is available for
            users who want to save predictions and appear on the leaderboard. Any display name you
            choose is entirely optional and is not linked to any identity verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">7. Children's Privacy</h2>
          <p>
            The Site is not directed at children under the age of 13. We do not knowingly collect
            any information from children. If you believe a child has submitted information through
            our Site, please contact us so we can remove it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">8. Data Retention</h2>
          <p>
            Anonymous vote data is retained for the duration of the 2026 World Cup tournament and
            may be retained afterward in aggregate, anonymised form for statistical purposes.
            Browser-local data (localStorage) is retained on your device until you clear your
            browser data or uninstall the browser.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated policy on
            this page with a revised "Last updated" date. Continued use of the Site after changes
            are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">10. Contact</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or your data, please
            reach out via our{' '}
            <Link to="/contact" className="font-semibold text-brand hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>

      </div>
    </div>
  )
}
