'use client'
import { useServerInfo } from "@/components/hooks/serverCheck"
import CustomSelect from "@/components/ui/customSelect/customSelect"
import FileDropzone from "@/components/ui/file-dropzone"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { apiBinary } from "@/lib/api"
import { downloadBlob, downloadJson } from "@/lib/download"
import { KeyInfo, ToastType } from "@/lib/types"
import { motion } from "motion/react"
import { FormEvent, useState } from "react"

interface EmbedFormState {
  file: File | null
  password: string
  keyId: string
}

interface SignProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}

export default function EmbedSign({ keysData, pushToast }: SignProps){

    const availableKeys = Object.keys(keysData)
    const { refreshData } = useServerInfo()
    const [busyAction, setBusyAction] = useState(false)
    const [embedSign, setEmbedForm] = useState<EmbedFormState>({ file: null, password: '', keyId: '' })

    const handlePatch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        if (!embedSign.file || !embedSign.keyId) {
        pushToast('error', 'Select a file and a key.')
        return
        }

        setBusyAction(true)
        try {
            const formData = new FormData()
            formData.append('file', embedSign.file)
            formData.append('key_id', embedSign.keyId)
            if (embedSign.password) {
            formData.append('password', embedSign.password)
            }

            const blop = await apiBinary('/patch-binary', formData)

            const targetName = embedSign.file.name.includes('.') ? embedSign.file.name.replace(/(\.[^.]+)$/u, '_signed$1') : `${embedSign.file.name}_signed`

            downloadBlob(blop, targetName)
            pushToast('success', `Embedded signature written into ${targetName}.`)
            
            await refreshData()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Import failed'
            pushToast('error', errorMessage)
            console.log(errorMessage)
        } finally {
            setBusyAction(false)
        }
    }
    
    return(
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}>
            <h1>Embedded Signing</h1>

            <Glass className="mt-3 p-3">
                <form onSubmit={handlePatch}>
                    <h2>Patch a Binary</h2>
                    <p className="text-xs mt-1">
                        Embeds a manifest block into the output artifact so it can be verified without a detached file
                    </p>

                    <div className="sections-1">
                            <FileDropzone 
                                    label="Upload File"
                                    file={embedSign.file}
                                    onFileSelect={(file) => setEmbedForm(prev => ({ ...prev, file }))}
                            />
                    </div>

                    <div className="sections-1">
                        <h3>Signing Key</h3>
                        <CustomSelect 
                            options={availableKeys.length > 0 ? availableKeys : ['No keys available']}
                            value={embedSign.keyId}
                            onChange={(val) => setEmbedForm(prev => ({ ...prev, keyId: val }))}
                        />
                    </div>
                    
                    <div className="sections-1">
                        <h3>Password</h3>
                        <input 
                            className="inputs"
                            type="password"
                            value={embedSign.password}
                            placeholder="Only Required for Encrypted Keys"
                            onChange={(e) => setEmbedForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                    </div>

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
                        {busyAction ? 'Patching...' : 'Patch and Download Binary'}
                    </motion.button>
                </form>
            </Glass>
        </motion.div>
    )
}