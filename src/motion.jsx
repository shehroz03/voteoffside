import { motion, useReducedMotion } from 'framer-motion'

// ─── Scroll reveal ──────────────────────────────────────────────────────────────
// Animates content in the first time it scrolls into view. Drop around any block.

export function Reveal({ children, className, delay = 0, y = 26, ...rest }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ─── Page transition ──────────────────────────────────────────────────────────

export function PageTransition({ children }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -5 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger list container ───────────────────────────────────────────────────

const listVariantsFull = {
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}
const listVariantsReduced = {
  animate: { transition: { staggerChildren: 0, delayChildren: 0 } },
}

export function StaggerList({ children, className, style, ...rest }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      variants={reduced ? listVariantsReduced : listVariantsFull}
      initial="initial"
      animate="animate"
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger item (entrance + optional hover lift) ────────────────────────────

const itemVariantsFull = {
  initial: { opacity: 0, y: 14, scale: 0.984 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] },
  },
}
const itemVariantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
}

// Hover lift values used by cards
const HOVER_LIFT = { y: -3, boxShadow: '0 8px 30px rgba(16,24,40,0.14)' }
const TAP_PRESS  = { scale: 0.984, y: -1 }
const LIFT_SPRING = { type: 'spring', stiffness: 340, damping: 30 }

export function StaggerItem({ children, className, style, lift = false, ...rest }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      variants={reduced ? itemVariantsReduced : itemVariantsFull}
      whileHover={lift && !reduced ? HOVER_LIFT : undefined}
      whileTap={lift && !reduced ? TAP_PRESS : undefined}
      transition={lift ? LIFT_SPRING : undefined}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
