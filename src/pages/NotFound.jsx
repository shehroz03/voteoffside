import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="text-6xl">⚽</div>
      <h1 className="mt-4 text-2xl font-extrabold">Page not found</h1>
      <p className="mt-1 text-muted">That one went wide of the post.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Back home
      </Link>
    </div>
  )
}
