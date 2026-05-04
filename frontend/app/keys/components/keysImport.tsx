'use client'
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { motion } from "motion/react"
import { useState, FormEvent } from "react"
import { apiJson } from "@/lib/api"
import { ToastType, ImportKeyResponse, ExportKeyResponse } from "@/lib/types"
import { parseJsonInput } from "@/lib/formatters"

interface KeysImportProps {
    onSuccess: () => Promise<void>
    pushToast: (type: ToastType, message: string) => void
}

export default function KeysImport({ onSuccess, pushToast }: KeysImportProps) {

    const [busyAction, setBusyAction] = useState(false)

    const [importForm, setImportForm] = useState({
        keyId: '',
        overwrite: false,
        payload: '',
    })

    const handleImportKey = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        if (!importForm.payload.trim()) {
            pushToast('error', 'Paste an exported key JSON payload first.')
            return
        }

        setBusyAction(true)
        try {
            const keyMaterial = parseJsonInput<ExportKeyResponse>(importForm.payload)

            const response = await apiJson<ImportKeyResponse>('/import-key', {
                body: {
                    key_id: importForm.keyId || undefined, // Sends undefined if left empty
                    overwrite: importForm.overwrite,
                    key_material: keyMaterial,
                },
            })

            pushToast('success', `Imported key ${response.data.key_id}.`)
            
            setImportForm({ keyId: '', overwrite: false, payload: '' })
            
            await onSuccess()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Import failed'
            pushToast('error', errorMessage)
        } finally {
            setBusyAction(false)
        }
    }

    return(
        <div className="h-full w-full border-amber-400">
            <h1>
                Keys Import
            </h1>

            <Glass className="mt-3 p-3"> 
                <h2 className="font-Space font-bold text-xl">
                    Import Exported Key JSON
                </h2>
                <p className="text-xs mt-1">
                    Paste a base 64 or encrypted export (Overwrite the key ID only when you need to rename it on import)
                </p>

                <form className="mt-2" onSubmit={handleImportKey}>
                    <div className="sections-1">
                        <div className="mr-4">
                            <h3>Override Key ID</h3>
                            <input 
                                className="inputs" 
                                type="text" 
                                placeholder="Leave empty to keep the exported key ID"
                                value={importForm.keyId}
                                onChange={(e) => setImportForm(prev => ({ ...prev, keyId: e.target.value }))}
                            />
                        </div>

                        <label className="flex gap-2.5 mt-3 ml-1 items-center">
                            <input
                                className="checkmarks"
                                type="checkbox"
                                checked={importForm.overwrite}
                                onChange={(e) => setImportForm(prev => ({ ...prev, overwrite: e.target.checked }))}
                            />
                            <span className="text-sm">
                                Replace an existing key with the same ID
                            </span>
                        </label>
                    </div>
                    
                    <div className="sections-1">
                        <div className="mr-4">
                            <h3>Export Payload</h3>
                            <textarea 
                                className="inputarea min-h-[120px] py-2 resize-none font-mono text-sm" 
                                placeholder='{"key_id":"team-key","algorithm":"ML-DSA-65",...}'
                                value={importForm.payload}
                                onChange={(e) => setImportForm(prev => ({ ...prev, payload: e.target.value }))}
                            />
                        </div>
                    </div>

                    <motion.button 
                    className="h-10 w-full bg-white text-black mt-4 rounded-xl font-bold" 
                    type="submit"
                    whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.1 }
                    }}
                    whileTap={{ scale: busyAction ? 1 : 0.95 }}
                    >
                        {busyAction ? 'Importing...' : 'Import Key'}
                    </motion.button>
                </form>
            </Glass>
        </div>
                
    )
}