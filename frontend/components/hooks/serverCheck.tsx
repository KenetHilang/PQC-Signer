'use client'

import { useState, useCallback, useEffect } from 'react'
import { apiGet } from '@/lib/api'
import { ServerInfoResponse } from '@/lib/types'
import { useToast } from './pushToast'

export function useServerInfo() {
    const { pushToast } = useToast()
    
    const [serverInfo, setServerInfo] = useState<ServerInfoResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshData = useCallback(async () => {
        setIsLoading(true)
        try {
            const indexInfo = await apiGet<ServerInfoResponse>('/')
            setServerInfo(indexInfo)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Request failed'
            pushToast('error', `Failed to load backend data: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }, [pushToast])

    useEffect(() => {
        void refreshData()
    }, [refreshData])

    return { serverInfo, isLoading, refreshData }
}