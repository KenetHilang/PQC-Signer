'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface ModeContextType {
  isDetached: boolean
  setIsDetached: (value: boolean) => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [isDetached, setIsDetached] = useState(true)

  return (
    <ModeContext.Provider value={{ isDetached, setIsDetached }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}