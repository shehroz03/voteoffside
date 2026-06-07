export default function VoteBar({ homePct, awayPct, userPick, homeCode, awayCode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`vote-fill ${userPick === homeCode ? 'bg-brand' : 'bg-brand/60'}`}
          style={{ width: `${homePct}%` }}
        />
        <div
          className={`vote-fill ${userPick === awayCode ? 'bg-gold' : 'bg-gold/60'}`}
          style={{ width: `${awayPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-bold">
        <span className="text-brand">{homePct}%</span>
        <span className="text-gold-600">{awayPct}%</span>
      </div>
    </div>
  )
}
