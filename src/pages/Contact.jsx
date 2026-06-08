export default function Contact() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contact</h1>
        <p className="mt-2 text-sm text-muted">We'd love to hear from you</p>
      </div>

      <div className="card p-6 space-y-4 text-sm leading-relaxed">
        <p>
          VoteOffside is an unofficial fan project run by a small team of football enthusiasts.
          Whether you've found a bug, have a feature suggestion, or just want to say hi — drop us a
          line.
        </p>

        <div className="rounded-xl border border-line/60 bg-elevated/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Email</p>
          <a
            href="mailto:broadsolutiontech279@gmail.com"
            className="mt-1 block font-semibold text-brand hover:underline"
          >
            broadsolutiontech279@gmail.com
          </a>
        </div>

        <h2 className="text-base font-bold">What to include</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted">
          <li>A clear description of your question or issue</li>
          <li>Your browser and device if reporting a bug</li>
          <li>A screenshot if relevant</li>
        </ul>

        <p className="text-muted">
          For privacy-related enquiries (including requests to delete your anonymous vote data),
          please mention "Privacy Request" in the subject line. See our{' '}
          <a href="/privacy" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </a>{' '}
          for more details.
        </p>
      </div>
    </div>
  )
}
