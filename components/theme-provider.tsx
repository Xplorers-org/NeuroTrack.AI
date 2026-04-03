'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: 'class'
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const STORAGE_KEY = 'theme'

function getSystemTheme(): Exclude<Theme, 'system'> {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme, disableTransitionOnChange: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
  const root = document.documentElement

  if (disableTransitionOnChange) {
    const style = document.createElement('style')
    style.appendChild(document.createTextNode('*{transition:none!important}'))
    document.head.appendChild(style)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.head.removeChild(style)
      })
    })
  }

  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme = storedTheme ?? defaultTheme
    const nextTheme = enableSystem ? initialTheme : initialTheme === 'system' ? 'light' : initialTheme

    setThemeState(nextTheme)
    applyTheme(nextTheme, disableTransitionOnChange)
  }, [defaultTheme, disableTransitionOnChange, enableSystem])

  React.useEffect(() => {
    const onSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system', disableTransitionOnChange)
      }
    }

    if (!enableSystem || theme !== 'system' || typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', onSystemChange)

    return () => media.removeEventListener('change', onSystemChange)
  }, [disableTransitionOnChange, enableSystem, theme])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      const resolvedTheme = enableSystem || nextTheme !== 'system' ? nextTheme : 'light'
      window.localStorage.setItem(STORAGE_KEY, resolvedTheme)
      setThemeState(resolvedTheme)
      applyTheme(resolvedTheme, disableTransitionOnChange)
    },
    [disableTransitionOnChange, enableSystem],
  )

  const value = React.useMemo(
    () => ({ theme, setTheme }),
    [setTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}