'use client'
import { useEffect, useState, useCallback, useMemo } from "react"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import HistoryCard from "@/components/ui/historyCard"
import { apiGet, apiJson } from "@/lib/api"
import { KeysResponse, KeyInfo, ToastType, ExportKeyResponse, ExportPreview, SignatureManifest, SignaturesResponse } from "@/lib/types"
import CustomSelect from "@/components/ui/customSelect/customSelect"
import { downloadJson } from "@/lib/download"
import { motion } from "motion/react"
import { formatTimestamp, truncateMiddle } from "@/lib/formatters"

interface SideKeysProps {
    type: string
    pushToast: (type: ToastType, message: string) => void
}

export default function SideKeys({ type, pushToast }: SideKeysProps) {
    const [keys, setKeys] = useState<Record<string, KeyInfo>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchHistory = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await apiGet<KeysResponse>('/keys')
            
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
                    {type === 'export' && <Export keysData={keys} pushToast={pushToast} />}
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

            <div className="h-[50vh] overflow-y-auto flex flex-col mr-3 rounded-2xl">
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

interface ExportProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}

function buildPreview(exportPayload: ExportKeyResponse, format: string): ExportPreview {
    const preview: ExportPreview = {
        key_id: exportPayload.key_id,
        algorithm: exportPayload.algorithm,
        format: format as 'base64' | 'encrypted',
        encrypted: Boolean(exportPayload.encrypted_private_key),
        public_key_size: exportPayload.public_key_size,
    }

    if (exportPayload.private_key_size) {
        preview.private_key_size = exportPayload.private_key_size
    }
    if (exportPayload.encrypted_private_key) {
        preview.encryption_algorithm = exportPayload.encrypted_private_key.algorithm
        preview.kdf = exportPayload.encrypted_private_key.kdf
        preview.kdf_iterations = exportPayload.encrypted_private_key.kdf_iterations
    }
    return preview
}

function Export({ keysData, pushToast }: ExportProps) {
    const availableKeys = Object.keys(keysData)
    const formatOptions = ['base64', 'encrypted']

    const [exportForm, setExportForm] = useState({
        keyId: availableKeys.length > 0 ? availableKeys[0] : 'No keys available',
        password: '',
        format: formatOptions[0],
    })

    const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (availableKeys.length > 0 && exportForm.keyId === 'No keys available') {
            setExportForm(prev => ({ ...prev, keyId: availableKeys[0] }))
        }
    }, [availableKeys, exportForm.keyId])

    const requestExport = async (download: boolean) => {
        if (!exportForm.keyId || exportForm.keyId === 'No keys available') {
            pushToast('error', 'Select a valid key to export.')
            return
        }

        setIsLoading(true)
        try {
            const response = await apiJson<ExportKeyResponse>('/export-key', {
                body: {
                    key_id: exportForm.keyId,
                    format: exportForm.format,
                    password: exportForm.password || undefined,
                },
            })

            setExportPreview(buildPreview(response, exportForm.format))
            
            if (download) {
                downloadJson(response, `${response.key_id}.${exportForm.format}.json`)
                pushToast('success', `Exported ${response.key_id} as ${exportForm.format}.`)
            } else {
                pushToast('success', `Prepared ${response.key_id} export preview.`)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Export failed'
            pushToast('error', errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-full pr-3 font-Space">
            
            <div className="grid grid-cols-2 gap-4 mb">
                <div>
                    <h3>Key</h3>
                    <CustomSelect 
                        options={availableKeys.length > 0 ? availableKeys : ['No keys available']}
                        value={exportForm.keyId}
                        onChange={(val) => setExportForm(prev => ({ ...prev, keyId: val }))}
                    />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Password</h3>
                    <input 
                        className="inputs" 
                        type="password" 
                        placeholder="Input here"
                        value={exportForm.password} 
                        onChange={(e) => setExportForm(prev => ({ ...prev, password: e.target.value }))} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end mt-3">
                <div>
                    <h3>Format</h3>
                    <CustomSelect 
                        options={formatOptions}
                        value={exportForm.format}
                        onChange={(val) => setExportForm(prev => ({ ...prev, format: val }))}
                    />
                </div>
                <div className="flex gap-3 h-[46px]">
                    <motion.button 
                        onClick={() => requestExport(false)}
                        disabled={isLoading || availableKeys.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 border border-white text-white rounded-full text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '...' : 'Preview'}
                    </motion.button>
                    <motion.button 
                        onClick={() => requestExport(true)}
                        disabled={isLoading || availableKeys.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 bg-white text-black font-bold rounded-full text-sm disabled:opacity-50"
                    >
                        Download
                    </motion.button>
                </div>
            </div>

            <div className="flex flex-col h-[28vh] mt-3">
                <h3 className="text-sm font-bold text-white mb-1.5">Preview</h3>
                <textarea 
                    readOnly
                    value={exportPreview ? JSON.stringify(exportPreview, null, 2) : ''}
                    placeholder="Previews will appear here"
                    className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 resize-none focus:outline-none"
                />
            </div>
        </div>
    )
}



function History() {
    const [signatures, setSignatures] = useState<Record<string, SignatureManifest>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchSignatures = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await apiGet<SignaturesResponse>('/signatures')
            if (response.success && response.signatures) {
                setSignatures(response.signatures)
            }
        } catch (err) {
            setError('Failed to load activity history.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchSignatures()
    }, [fetchSignatures])

    const signatureEntries = useMemo(() => {
        return Object.entries(signatures)
            .map(([signatureId, info]) => ({ signatureId, ...info }))
            .sort((a, b) => new Date(b.timestamp || 0).valueOf() - new Date(a.timestamp || 0).valueOf())
    }, [signatures])

    return (
        <div className="w-full h-full flex flex-col font-Space pr-3">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Recent Signature Manifests</h3>
                <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-full">
                    {signatureEntries.length} Records
                </span>
            </div>
            
            <div className="h-[65vh] overflow-y-auto flex flex-col pr-2 gap-3">
                {isLoading && <p className="text-sm text-gray-400">Loading history...</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
                
                {!isLoading && !error && signatureEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">No signature manifests persisted yet.</p>
                ) : (
                    signatureEntries.map((entry) => (
                        <div 
                            key={entry.signature_id || entry.signatureId} 
                            className="rounded-2xl p-4 bg-white/10 border border-white/10 text-white transition-colors hover:bg-white/20"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-sm font-bold truncate pr-2" title={entry.signature_id || entry.signatureId}>
                                    {entry.signature_id || entry.signatureId}
                                </h4>
                                <div className="border border-amber-400/50 text-amber-300 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                                    {entry.algorithm}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                <div>
                                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Key Used</span>
                                    <p className="text-xs text-gray-200 truncate">{entry.key_id}</p>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">File Hash</span>
                                    <p className="text-xs text-gray-200 font-mono">
                                        {truncateMiddle(entry.file_hash, 12, 10)}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Timestamp</span>
                                    <p className="text-xs text-gray-200">{formatTimestamp(entry.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}