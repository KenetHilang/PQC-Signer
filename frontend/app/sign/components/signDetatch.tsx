'use client'
import { useServerInfo } from "@/components/hooks/serverCheck"
import CustomSelect from "@/components/ui/customSelect/customSelect"
import FileDropzone from "@/components/ui/file-dropzone"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { apiForm, apiGet, apiJson } from "@/lib/api"
import { downloadJson } from "@/lib/download"
import { KeyInfo, SignResponse, ToastType } from "@/lib/types"
import { motion } from "motion/react"
import { FormEvent, useState } from "react"

interface SignFormState {
    keyId: string
    password: string
    file: File | null
}

interface SignProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}

export default function SignDetatch({ keysData, pushToast }: SignProps) {

    const availableKeys = Object.keys(keysData)
    const { refreshData } = useServerInfo()

    const [busyAction, setBusyAction] = useState(false)
    const [signForm, setSignForm] = useState<SignFormState>({ keyId: '', password: '', file: null })

    const handleSigningDetach = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        if (!signForm.file || !signForm.keyId) {
        pushToast('error', 'Select a file and a key.')
        return
        }
        

        setBusyAction(true)
        try {
            const formData = new FormData()
            formData.append('file', signForm.file)
            formData.append('key_id', signForm.keyId)
            if (signForm.password) {
            formData.append('password', signForm.password)
            }

            const response = await apiForm<SignResponse>('/sign-file', formData)

            downloadJson(response.manifest, `${signForm.file.name}.sig`)
            pushToast('success', `Detached manifest written for ${signForm.file.name}.`)
            
            await refreshData()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Import failed'
            pushToast('error', errorMessage)
        } finally {
            setBusyAction(false)
        }
    }

    return(
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <h1>
                Detached Signing
            </h1>

            <Glass className="mt-3 p-3">
                <h2>
                    Sign a File
                </h2>
                <p className="text-xs mt-1">
                    Sign raw file bytes and downloads a detached manifest JSON file
                </p>

                <form onSubmit={handleSigningDetach}> 
                    <div className="flex items-center justify-center w-full mt-3">
                        <FileDropzone 
                                label="Upload File"
                                file={signForm.file}
                                onFileSelect={(file) => setSignForm(prev => ({ ...prev, file }))}
                        />
                    </div>

                    <div className="sections-1">
                        <div className="mt-2">
                            <h3>Signing Key</h3>

                            <CustomSelect 
                                options={availableKeys.length > 0 ? availableKeys : ['No keys available']}
                                value={signForm.keyId}
                                onChange={(val) => setSignForm(prev => ({ ...prev, keyId: val }))}
                            />
                        </div>

                        <div className="mt-3.5">
                            <h3>Password</h3>

                            <input 
                            className="inputs"
                            value={signForm.password}
                            type="password" 
                            placeholder="Only Required for encrypted keys"
                            onChange={(e) => setSignForm(prev => ({ ...prev, password: e.target.value }))}
                            />
                        </div>
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
                        {busyAction ? 'Signing...' : 'Sign and Download Manifest'}
                    </motion.button>
                </form>
            </Glass>
        </motion.div>
    )
}

function setIsLoading(arg0: boolean) {
    throw new Error("Function not implemented.")
}
function setError(arg0: string) {
    throw new Error("Function not implemented.")
}