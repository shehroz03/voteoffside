import { Link } from 'react-router-dom'

export default function Disclaimer() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Disclaimer</h1>
        <p className="mt-2 text-sm text-muted">Important information about VoteOffside</p>
      </div>

      <div className="card p-6 space-y-5 text-sm leading-relaxed">

        <section className="space-y-2">
          <h2 className="text-base font-bold">Unofficial Fan Site</h2>
          <p>
            VoteOffside is an independent, unofficial fan project. It is not affiliated with,
            endorsed by, licensed by, or in any way officially connected to FIFA, any national
            football federation, any football club, or any other governing body of football.
          </p>
          <p>
            All team names, country names, and competition names used on this site are for
            informational and identification purposes only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Accuracy of Information</h2>
          <p>
            Fixture dates, kick-off times, venues, and other match data displayed on this site are
            provided for entertainment and fan engagement purposes. While we aim for accuracy, we
            make no guarantees that the information is complete, up to date, or error-free. Always
            refer to official sources for confirmed fixture details.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">No Gambling or Financial Advice</h2>
          <p>
            VoteOffside is a free, non-commercial fan prediction game. It does not involve real
            money, prizes, or gambling of any kind. Nothing on this site constitutes financial,
            betting, or gambling advice. The "coins" and "points" system is purely for entertainment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Advertising</h2>
          <p>
            This site displays advertisements served by Google AdSense and potentially other
            third-party ad networks. We do not control the content of those advertisements and are
            not responsible for them. Ad content is served automatically based on page context and
            visitor interests. Please see our{' '}
            <Link to="/privacy" className="font-semibold text-brand hover:underline">
              Privacy Policy
            </Link>{' '}
            for details on how advertising cookies work.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Third-Party Content</h2>
          <p>
            Player and team statistics shown on this site are sample or illustrative figures for
            entertainment and should not be relied upon as official statistics. Player personal life
            information is sourced from publicly available sources and is provided for informational
            purposes only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Limitation of Liability</h2>
          <p>
            VoteOffside is provided "as is" without any warranties, express or implied. We are not
            liable for any errors, omissions, or interruptions in service, or for any loss or damage
            arising from use of this site. Your use of the site is at your own risk.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Contact</h2>
          <p>
            Questions about this disclaimer? Visit our{' '}
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
