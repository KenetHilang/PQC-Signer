'use client'

import type { ToastItem } from '@/lib/types'
import { motion, AnimatePresence } from "motion/react"
import { JSX } from 'react'
import { RiCloseLine, RiCheckLine, RiErrorWarningLine, RiInformationLine } from "react-icons/ri"

interface ToastRegionProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const toastTone: Record<ToastItem['type'], string> = {
  success: 'border-l-lime-400 bg-lime-400/5',
  warning: 'border-l-amber-400 bg-amber-400/5',
  error: 'border-l-red-500 bg-red-500/5',
}

// Optional: Adds a nice visual icon based on the type
const toastIcon: Record<ToastItem['type'], JSX.Element> = {
  success: <RiCheckLine className="text-lime-400 text-xl shrink-0" />,
  warning: <RiInformationLine className="text-amber-400 text-xl shrink-0" />,
  error: <RiErrorWarningLine className="text-red-500 text-xl shrink-0" />,
}

export default function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            onClick={() => onDismiss(toast.id)}
            type="button"
            // pointer-events-auto makes the button clickable again
            className={`
              pointer-events-auto flex items-center gap-3 w-[380px] max-w-[90vw] text-left 
              rounded-xl border-l-4 border-y border-r border-white/10 
              bg-[#181818]/90 backdrop-blur-md px-4 py-3.5 
              shadow-2xl shadow-black/50 transition-colors hover:bg-[#222222]/90
              ${toastTone[toast.type]}
            `}
          >
            {/* Left Icon */}
            {toastIcon[toast.type]}
            
            {/* Message Body */}
            <span className="flex-1 text-sm font-medium text-gray-200 font-Space">
              {toast.message}
            </span>
            
            {/* Dismiss Icon */}
            <RiCloseLine className="text-gray-400 hover:text-white transition-colors text-lg shrink-0" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}