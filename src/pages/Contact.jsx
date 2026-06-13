import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState(null) // null | 'sending' | 'sent' | 'error'
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim()) e.message = 'Message is required'
    else if (form.message.trim().length < 10) e.message = 'Message is too short'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStatus('sending')

    // Build mailto: URL with pre-filled fields as a reliable fallback
    // (opens the user's email client with fields pre-filled)
    const mailto = `mailto:broadsolutiontech279@gmail.com`
      + `?subject=${encodeURIComponent(form.subject)}`
      + `&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`

    window.location.href = mailto

    // Show success state after a brief delay
    setTimeout(() => {
      setStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    }, 600)
  }

  function field(label, key, type = 'text', placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5" htmlFor={key}>
          {label}
        </label>
        <input
          id={key}
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={`w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted/50 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15 dark:bg-white/4 dark:text-white ${
            errors[key] ? 'border-red-500/60' : 'border-line/60 dark:border-white/10'
          }`}
        />
        {errors[key] && <p className="mt-1 text-[11px] text-red-400">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="mt-2 text-sm text-muted">We'd love to hear from you</p>
      </div>

      <div className="card p-6 space-y-5 text-sm leading-relaxed">
        <p>
          VoteOffside is an unofficial fan project run by a small team of football enthusiasts.
          Whether you've found a bug, have a feature suggestion, or just want to say hi — we'd
          love to hear from you.
        </p>

        <div className="rounded-xl border border-line/60 bg-elevated/60 p-4 dark:border-white/8 dark:bg-white/3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Direct Email</p>
          <a
            href="mailto:broadsolutiontech279@gmail.com"
            className="mt-1 block font-semibold text-brand hover:underline"
          >
            broadsolutiontech279@gmail.com
          </a>
        </div>
      </div>

      {/* Contact form */}
      <div className="card p-6">
        <h2 className="mb-5 text-base font-bold">Send us a message</h2>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="font-bold text-ink">Message ready to send!</p>
            <p className="text-sm text-muted">Your email client will open with the message pre-filled. Just hit Send.</p>
            <button
              onClick={() => setStatus(null)}
              className="mt-2 rounded-xl border border-line/60 px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors dark:border-white/10"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Your name', 'name', 'text', 'John Doe')}
              {field('Your email', 'email', 'email', 'john@example.com')}
            </div>
            {field('Subject', 'subject', 'text', 'Bug report / Feature request / General')}

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="Describe your question, feedback or issue in detail..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className={`w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted/50 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15 resize-none dark:bg-white/4 dark:text-white ${
                  errors.message ? 'border-red-500/60' : 'border-line/60 dark:border-white/10'
                }`}
              />
              {errors.message && <p className="mt-1 text-[11px] text-red-400">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="sheen btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
            >
              <Send size={14} />
              {status === 'sending' ? 'Opening email client…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>

      <div className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold">What to include</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted">
          <li>A clear description of your question or issue</li>
          <li>Your browser and device if reporting a bug</li>
          <li>A screenshot if relevant</li>
        </ul>
        <p className="text-muted pt-1">
          For privacy-related enquiries (including requests to delete your anonymous vote data),
          please mention "Privacy Request" in the subject line. See our{' '}
          <Link to="/privacy" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </Link>{' '}
          for more details.
        </p>
      </div>
    </div>
  )
}
