// Placeholder ad slot. After AdSense approval, drop the <ins> unit here.
export default function AdSlot({ label = 'Advertisement', className = '' }) {
  return (
    <div
      className={`flex h-24 items-center justify-center rounded-2xl border border-dashed border-line text-xs uppercase tracking-widest text-muted ${className}`}
    >
      {label}
    </div>
  )
}
