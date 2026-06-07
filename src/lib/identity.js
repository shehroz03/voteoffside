// Anonymous identity — no signup/login.
// A lightweight fingerprint + a fun username, persisted in localStorage.
// NOTE: For production you can swap getFingerprint() with FingerprintJS for
// better uniqueness. This version needs no extra dependency and works offline.

const ADJECTIVES = [
  'Eagle', 'Falcon', 'Lion', 'Tiger', 'Shark', 'Phoenix', 'Cobra', 'Panther',
  'Hawk', 'Wolf', 'Viper', 'Dragon', 'Comet', 'Rocket', 'Striker', 'Maverick',
  'Bullet', 'Thunder', 'Storm', 'Blaze',
]

const NOUNS = [
  'Fan', 'Pro', 'King', 'Star', 'Ace', 'Captain', 'Legend', 'Master',
  'Wizard', 'Hero', 'Boss', 'Chief', 'Champ', 'Ninja', 'Baller',
]

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// A simple, stable-ish browser fingerprint. Good enough for anonymous IDs.
function computeFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || '',
  ].join('|')

  let hash = 0
  for (let i = 0; i < parts.length; i++) {
    hash = (hash << 5) - hash + parts.charCodeAt(i)
    hash |= 0
  }
  return 'fp_' + Math.abs(hash).toString(36)
}

export function getFingerprint() {
  let fp = localStorage.getItem('vo_fingerprint')
  if (!fp) {
    fp = computeFingerprint()
    localStorage.setItem('vo_fingerprint', fp)
  }
  return fp
}

export function getUsername() {
  let name = localStorage.getItem('vo_username')
  if (!name) {
    name = `${rand(ADJECTIVES)}${rand(NOUNS)}_${Math.floor(1000 + Math.random() * 9000)}`
    localStorage.setItem('vo_username', name)
  }
  return name
}

export function regenerateUsername() {
  const name = `${rand(ADJECTIVES)}${rand(NOUNS)}_${Math.floor(1000 + Math.random() * 9000)}`
  localStorage.setItem('vo_username', name)
  return name
}
