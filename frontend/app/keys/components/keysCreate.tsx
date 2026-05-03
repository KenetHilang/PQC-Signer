'use client'
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { ToastType, GenerateKeyResponse } from "@/lib/types"
import { apiJson } from "@/lib/api"
import { motion } from "motion/react"
import { useState, useEffect, FormEvent } from "react"
import CustomSelect from "@/components/ui/customSelect/customSelect"

interface KeyGenerationCardProps {
  supportedAlgorithms: string[]
  defaultAlgorithm?: string
  onSuccess: () => Promise<void>
  pushToast: (type: ToastType, message: string) => void
}


export default function KeysCreate({supportedAlgorithms, defaultAlgorithm, onSuccess, pushToast}: KeyGenerationCardProps) {

    const [busyAction, setBusyAction] = useState(false)

    const [generateForm, setGenerateForm] = useState({
        keyId: '',
        algorithm: '',
        encrypt: true,
        password: '',
        overwrite: false,
    })

    const encryptionOptions = ["Encrypted private key", "Raw private key"]

    useEffect(() => {
        if (supportedAlgorithms.length > 0) {
            setGenerateForm(current => ({
                ...current,
                algorithm: defaultAlgorithm || supportedAlgorithms[0]
            }))
        }
    }, [supportedAlgorithms, defaultAlgorithm])

    const handleGenerateKey = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        if (!generateForm.keyId.trim()) {
            pushToast('error', 'Key ID is required.')
            return
        }

        setBusyAction(true)
        try {
            const response = await apiJson<GenerateKeyResponse>('/generate-keys', {
                body: {
                    key_id: generateForm.keyId,
                    algorithm: generateForm.algorithm,
                    encrypt: generateForm.encrypt,
                    password: generateForm.encrypt ? generateForm.password || undefined : undefined,
                    overwrite: generateForm.overwrite,
                },
            })

            pushToast('success', `Generated ${response.data.algorithm} key ${response.data.key_id}.`)
            
            setGenerateForm((current) => ({ ...current, keyId: '', password: '', overwrite: false }))
            
            await onSuccess()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Request failed'
            pushToast('error', errorMessage)
        } finally {
            setBusyAction(false)
        }
    }


    return(
        <div className="h-full w-full border-amber-400">
            <h1 className="text-3xl font-Akira">
                Keys Creation
            </h1>

            <Glass className="mt-3 p-3">
                <h2 className="font-Space font-bold text-xl">
                    Generate Key
                </h2>
                <p className="text-xs mt-1">
                    Select a variant, decide whether to encrypt the secret key, and optionally overwrite an existing record
                </p>

                <form className="mt-2" onSubmit={handleGenerateKey}>
                    <div className="sections-2">
                        <div className="mr-4">
                            <h3>Key ID</h3>
                            <input 
                            className="inputs" 
                            type="text" 
                            placeholder="release-signing" 
                            value={generateForm.keyId} 
                            onChange={(e) => setGenerateForm(prev => ({ ...prev, keyId: e.target.value }))}
                            />
                        </div>
                        <label className="mr-4">
                            <h3>Variant</h3>
                            <CustomSelect 
                                options={supportedAlgorithms}
                                value={generateForm.algorithm}
                                onChange={(val) => setGenerateForm(prev => ({ ...prev, algorithm: val }))}
                            />
                        </label>
                    </div>
                    
                    <div className="sections-2">
                        <div className="mr-4">
                            <h3>Password</h3>
                            <input 
                            className="inputs" 
                            required
                            type="password" 
                            placeholder={generateForm.encrypt ? "Required to encrypt" : "Not needed for raw keys"} 
                            value={generateForm.password} 
                            onChange={(e) => setGenerateForm(prev => ({ ...prev, password: e.target.value }))} disabled={!generateForm.encrypt} 
                            />
                        </div>
                        <label className="mr-4">
                            <h3>Encryption</h3>
                            <CustomSelect 
                                options={encryptionOptions}
                                value={generateForm.encrypt ? "Encrypted private key" : "Raw private key"} 
                                onChange={(val) => setGenerateForm(prev => ({ ...prev, encrypt: val === "Encrypted private key" }))} 
                            />
                        </label>
                    </div>

                    <label className="flex gap-2.5 mt-3 ml-1 items-center">
                        <input
                            className="checkmarks"
                            type="checkbox"
                            checked={generateForm.overwrite}
                            onChange={(e) => setGenerateForm(prev => ({ ...prev, overwrite: e.target.checked }))}
                        />
                        <span className="text-sm">Allow overwrite for an existing key ID</span>
                    </label>

                    <motion.button 
                    className="h-10 w-full bg-white text-black mt-4 rounded-xl font-bold" 
                    type="submit"
                    disabled={busyAction}
                    whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.1 }
                    }}
                    whileTap={{
                        scale: busyAction ? 1 : 0.95
                    }}
                    >
                        {busyAction ? 'Generating...' : 'Generate Key Pair'}
                    </motion.button>
                </form>
            </Glass>
        </div>
    )
}