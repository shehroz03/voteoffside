// National-team colour gradients for share cards.
// { from, via?, to } — used to build linear gradients. Colours echo each
// nation's kit / flag identity. Fallback covers any missing code.

const TEAM_COLORS = {
  MEX: { from: '#006847', to: '#00351f' },           // green
  RSA: { from: '#007a4d', to: '#003f28' },           // green/gold
  KOR: { from: '#c60c30', to: '#0047a0' },           // red/blue
  CZE: { from: '#11457e', to: '#0a2a4e' },           // blue
  CAN: { from: '#d52b1e', to: '#7a1812' },           // red
  BIH: { from: '#002395', to: '#001445' },           // blue/yellow
  QAT: { from: '#8a1538', to: '#4d0c20' },           // maroon
  SUI: { from: '#d52b1e', to: '#7a1812' },           // red
  BRA: { from: '#ffdf00', via: '#009b3a', to: '#002776' }, // yellow/green/blue
  MAR: { from: '#c1272d', to: '#006233' },           // red/green
  HAI: { from: '#00209f', to: '#d21034' },           // blue/red
  SCO: { from: '#0065bf', to: '#003a6e' },           // navy
  USA: { from: '#3c3b6e', via: '#b22234', to: '#1a1a3a' }, // navy/red
  PAR: { from: '#d52b1e', via: '#0038a8', to: '#001f5e' }, // red/blue
  AUS: { from: '#00843d', to: '#ffcd00' },           // green/gold
  TUR: { from: '#e30a17', to: '#7a0309' },           // red
  GER: { from: '#000000', via: '#dd0000', to: '#1a1a1a' }, // black/red/gold
  CUW: { from: '#002b7f', to: '#00153f' },           // blue
  CIV: { from: '#f77f00', via: '#ffffff', to: '#009e60' }, // orange/green
  ECU: { from: '#ffd100', via: '#0072ce', to: '#ed1c24' }, // yellow/blue/red
  NED: { from: '#ff6200', to: '#a33d00' },           // orange
  JPN: { from: '#0033a0', to: '#001a52' },           // blue
  SWE: { from: '#006aa7', to: '#fecc02' },           // blue/yellow
  TUN: { from: '#e70013', to: '#7a000a' },           // red
  BEL: { from: '#000000', via: '#ffd100', to: '#ff0000' }, // black/yellow/red
  EGY: { from: '#ce1126', to: '#7a0a16' },           // red
  IRN: { from: '#239f40', via: '#ffffff', to: '#da0000' }, // green/red
  NZL: { from: '#1a1a1a', to: '#000000' },           // black (All Whites→dark)
  ESP: { from: '#aa151b', via: '#f1bf00', to: '#7a0f14' }, // red/gold
  CPV: { from: '#003893', to: '#001a45' },           // blue
  KSA: { from: '#006c35', to: '#00381b' },           // green
  URU: { from: '#0038a8', via: '#7cb9e8', to: '#001f5e' }, // sky/navy
  FRA: { from: '#0055a4', via: '#ffffff', to: '#ef4135' }, // blue/red
  SEN: { from: '#00853f', via: '#fdef42', to: '#e31b23' }, // green/yellow/red
  IRQ: { from: '#007a3d', to: '#003a1d' },           // green
  NOR: { from: '#ba0c2f', via: '#00205b', to: '#7a0820' }, // red/navy
  ARG: { from: '#74acdf', via: '#ffffff', to: '#3b7dc4' }, // sky blue
  ALG: { from: '#006233', via: '#ffffff', to: '#003d1f' }, // green
  AUT: { from: '#ed2939', to: '#8a141f' },           // red
  JOR: { from: '#007a3d', via: '#ce1126', to: '#000000' }, // green/red/black
  POR: { from: '#006600', via: '#ff0000', to: '#003300' }, // green/red
  COD: { from: '#007fff', via: '#f7d618', to: '#005bb5' }, // sky/yellow
  UZB: { from: '#1eb53a', via: '#0099b5', to: '#0d6e22' }, // green/blue
  COL: { from: '#fcd116', via: '#003893', to: '#ce1126' }, // yellow/blue/red
  ENG: { from: '#cf081f', via: '#ffffff', to: '#0a2472' }, // red/navy
  CRO: { from: '#ff0000', via: '#ffffff', to: '#171796' }, // red/white/blue
  GHA: { from: '#006b3f', via: '#fcd116', to: '#ce1126' }, // green/gold/red
  PAN: { from: '#d21034', via: '#005293', to: '#7a0a1f' }, // red/blue
}

const FALLBACK = { from: '#0a2272', via: '#1234a0', to: '#050c20' }

export function teamColors(code) {
  return TEAM_COLORS[code] || FALLBACK
}

// Build a CSS linear-gradient string at a given angle.
export function teamGradient(code, angle = 165) {
  const c = teamColors(code)
  const stops = c.via
    ? `${c.from} 0%, ${c.via} 50%, ${c.to} 100%`
    : `${c.from} 0%, ${c.to} 100%`
  return `linear-gradient(${angle}deg, ${stops})`
}

// A readable accent colour (the brightest stop) for highlights/badges.
export function teamAccent(code) {
  const c = teamColors(code)
  return c.via && c.via !== '#ffffff' ? c.via : c.from
}
