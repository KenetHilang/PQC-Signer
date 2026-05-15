'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastType, ToastItem } from '@/lib/types'
import ToastRegion from '@/components/ui/toast-region'

interface ToastContextType {
    pushToast: (type: ToastType, message: string) => void
    dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const pushToast = useCallback((type: ToastType, message: string) => {
        const toast = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, message }
        setToasts((current) => [...current, toast])
        
        window.setTimeout(() => {
            setToasts((current) => current.filter((entry) => entry.id !== toast.id))
        }, 5000)
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ pushToast, dismissToast }}>
            {children}
            <ToastRegion toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}