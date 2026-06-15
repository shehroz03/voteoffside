import { useEffect } from 'react'

const SITE = 'VoteOffside'
const BASE = 'https://voteoffside.com'
const DEFAULT_TITLE = 'VoteOffside — FIFA World Cup 2026 Predictions, Live Scores & Player Stats'
const DEFAULT_DESC =
  'The ultimate fan prediction game for FIFA World Cup 2026. Vote on all 104 matches, watch live scores, compare players, and climb the global leaderboard. Free — no signup.'

/**
 * Per-page SEO. Sets a unique <title>, meta description, canonical URL and
 * the matching Open Graph / Twitter tags whenever a page mounts. Critical for
 * a single-page app — without this every route shares index.html's tags.
 *
 *   useSeo({ title: 'Live Scores', description: '...', path: '/live' })
 */
export function useSeo({ title, description, path } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESC
    const url = path ? `${BASE}${path}` : BASE

    document.title = fullTitle
    setMetaName('description', desc)
    setMetaProp('og:title', fullTitle)
    setMetaProp('og:description', desc)
    setMetaProp('og:url', url)
    setMetaName('twitter:title', fullTitle)
    setMetaName('twitter:description', desc)
    setCanonical(url)
  }, [title, description, path])
}

function setMetaName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaProp(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
