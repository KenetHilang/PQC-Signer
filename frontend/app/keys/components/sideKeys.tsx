'use client'
import { useEffect, useState, useCallback, useMemo } from "react"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import HistoryCard from "@/components/ui/historyCard"
import { apiGet } from "@/lib/api"
import { KeysResponse, KeyInfo } from "@/lib/types"
import CustomSelect from "@/components/ui/customSelect/customSelect"

export default function SideKeys({type}: {type: string}) {
    const [keys, setKeys] = useState<Record<string, KeyInfo>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchHistory = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            // Hits your backend endpoint that returns KeysResponse
            const response = await apiGet<KeysResponse>('/keys')
            
            // Saves the dictionary of keys to state
            if (response.success && response.keys) {
                setKeys(response.keys)
            }
        } catch (err) {
            setError('Failed to load key history.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchHistory()
    }, [fetchHistory])

    return(
        <div className="h-full w-full">
            <div className="flex mb-3">
                <h1>{type}</h1>
            </div>

            <Glass className='p-3'>
                <div className="w-4/5">
                    {type === 'vault' && (
                        <Vault 
                            keysData={keys} 
                            isLoading={isLoading} 
                            error={error} 
                        />
                    )}
                    {type === 'export' && <Export />}
                    {type === 'history' && <History />}
                </div>
            </Glass>
        </div>
    )
}

interface VaultProps {
    keysData: Record<string, KeyInfo>
    isLoading: boolean
    error: string
}

function Vault({ keysData, isLoading, error }: VaultProps) {
    const [variantFilter, setVariantFilter] = useState('All')
    const [encryptFilter, setEncryptFilter] = useState('All')

    const availableAlgorithms = useMemo(() => {
        const algos = new Set(Object.values(keysData).map(k => k.algorithm))
        return ['All', ...Array.from(algos)]
    }, [keysData])

    const encryptOptions = ['All', 'Encrypted', 'Raw']

    const filteredKeys = useMemo(() => {
        return Object.entries(keysData).filter(([id, info]) => {
            const matchVariant = variantFilter === 'All' || info.algorithm === variantFilter
            const matchEncrypt = encryptFilter === 'All' || (encryptFilter === 'Encrypted' ? info.encrypted : !info.encrypted)
            return matchVariant && matchEncrypt
        })
    }, [keysData, variantFilter, encryptFilter])

    return(
        <div className="w-full h-full flex flex-col">
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="mr-3">
                    <h3 className="text-sm text-gray-300 mb-1 font-Space">Variant</h3>
                    <CustomSelect 
                        options={availableAlgorithms}
                        value={variantFilter}
                        onChange={setVariantFilter}
                    />
                </div>
                <div className="mr-3">
                    <h3 className="text-sm text-gray-300 mb-1 font-Space">Encryption</h3>
                    <CustomSelect 
                        options={encryptOptions}
                        value={encryptFilter}
                        onChange={setEncryptFilter}
                    />
                </div>
            </div>

            <div className="h-[50vh] overflow-y-auto flex flex-col mr-3">
                {isLoading && <p className="text-sm text-gray-400">Loading keys...</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
                
                {!isLoading && !error && filteredKeys.length === 0 ? (
                    <p className="text-sm text-gray-400">No keys match your filters.</p>
                ) : (
                    filteredKeys.map(([keyId, keyInfo]) => (
                        <HistoryCard 
                            key={keyId} 
                            keyId={keyId} 
                            keyInfo={keyInfo} 
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function Export() {
    return(
        <div className="w-full h-full">
            <h2 className="text-lg">Export Keys</h2>
            <p className="text-sm text-gray-400">Download your keys securely.</p>
        </div>
    )
}

function History() {
    return(
        <div className="w-full h-full">
            <h2 className="text-lg">Activity History</h2>
            <p className="text-sm text-gray-400">View recent changes and access logs.</p>
        </div>
    )
}