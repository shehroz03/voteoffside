import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">About VoteOffside</h1>
        <p className="mt-2 text-sm text-muted">The fan prediction game for the 2026 FIFA World Cup</p>
      </div>

      <div className="card p-6 space-y-4 text-sm leading-relaxed">
        <p>
          VoteOffside is a free fan-made prediction platform built for the 2026 FIFA World Cup.
          It lets football fans around the world vote on match outcomes, track their accuracy, and
          compete on a live leaderboard — all without needing an account.
        </p>

        <h2 className="text-base font-bold">How it works</h2>
        <p>
          Before each match kicks off, you pick the team you think will win. Your prediction is
          stored anonymously in your browser. Once the result is confirmed, you earn points based on
          how unpopular your correct pick was — backing an underdog scores more than following the
          crowd. That's the Beat-the-Crowd system.
        </p>

        <h2 className="text-base font-bold">What we track</h2>
        <p>
          We track zero personal information. There are no accounts, no email addresses, and no
          passwords. Your votes are linked to an anonymous browser fingerprint stored only in your
          device's local storage. You can clear it at any time by clearing your browser data.
        </p>

        <h2 className="text-base font-bold">Advertising</h2>
        <p>
          VoteOffside is a free site supported by advertising. We use Google AdSense to display
          relevant ads. These ads help us keep the service free for everyone. You can learn more
          about how we handle data in our{' '}
          <Link to="/privacy" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <h2 className="text-base font-bold">Disclaimer</h2>
        <p>
          VoteOffside is an unofficial fan project. It is not affiliated with, endorsed by, or
          connected to FIFA, any national football federation, or any club. Fixture data and
          statistics are provided for entertainment purposes only. Read our full{' '}
          <Link to="/disclaimer" className="font-semibold text-brand hover:underline">
            Disclaimer
          </Link>
          .
        </p>

        <h2 className="text-base font-bold">Get in touch</h2>
        <p>
          Have feedback, spotted a bug, or want to say hello? Visit our{' '}
          <Link to="/contact" className="font-semibold text-brand hover:underline">
            Contact page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
