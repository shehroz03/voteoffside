import { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('vo_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('vo_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Liquid circular-reveal theme switch.
  // Uses the View Transitions API to flood the new theme across the screen
  // from the point you tapped. Falls back to an instant switch where the API
  // (or motion) isn't available.
  function toggle(e) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Origin point = the toggle button you clicked (fallback: top-right corner)
    const x = e?.clientX ?? window.innerWidth - 40
    const y = e?.clientY ?? 40

    if (!document.startViewTransition || reduced) {
      setDark((d) => !d)
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => setDark((d) => !d))
    })

    transition.ready.then(() => {
      // radius needed to reach the farthest corner from the click point
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
