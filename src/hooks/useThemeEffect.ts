import { useEffect } from 'react'
import { useUiStore } from '@/store'

/** Sync the persisted theme to the root `dark` class. */
export function useThemeEffect() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}
