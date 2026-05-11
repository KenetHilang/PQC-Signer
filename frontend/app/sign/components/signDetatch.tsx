'use client'
import CustomSelect from "@/components/ui/customSelect/customSelect"
import FileDropzone from "@/components/ui/file-dropzone"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { apiGet } from "@/lib/api"
import { KeyInfo, KeysResponse, ToastType } from "@/lib/types"
import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

interface SignFormState {
    keyId: string;
    password: string;
    file: File | null;
}

interface SignProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}



export default function SignDetatch({ keysData, pushToast }: SignProps) {


    const availableKeys = Object.keys(keysData)

    const [busyAction, setBusyAction] = useState(false)
    const [signForm, setSignForm] = useState<SignFormState>({ keyId: '', password: '', file: null })


    return(
        <div>
            <h1 className="text-3xl font-Akira">
                Detached Signing
            </h1>

            <Glass className="mt-3 p-3">
                <h2 className="font-Space font-bold text-xl">
                    Generate Key
                </h2>
                <p className="text-xs mt-1">
                    Select a variant, decide whether to encrypt the secret key, and optionally overwrite an existing record
                </p>

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
                        type="password" 
                        placeholder="Only Required for encrypted keys"
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
            </Glass>
        </div>
    )
}

function setIsLoading(arg0: boolean) {
    throw new Error("Function not implemented.")
}
function setError(arg0: string) {
    throw new Error("Function not implemented.")
}


'use client'
import CustomSelect from "@/components/ui/customSelect/customSelect"
import FileDropzone from "@/components/ui/file-dropzone"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { apiGet } from "@/lib/api"
import { KeyInfo, KeysResponse, ToastType } from "@/lib/types"
import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

interface SignFormState {
    keyId: string;
    password: string;
    file: File | null;
}

interface SignProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}



export default function SignDetatch({ keysData, pushToast }: SignProps) {


    const availableKeys = Object.keys(keysData)

    const [busyAction, setBusyAction] = useState(false)
    const [signForm, setSignForm] = useState<SignFormState>({ keyId: '', password: '', file: null })


    return(
        <div>
            <h1 className="text-3xl font-Akira">
                Detached Signing
            </h1>

            <Glass className="mt-3 p-3">
                <h2 className="font-Space font-bold text-xl">
                    Generate Key
                </h2>
                <p className="text-xs mt-1">
                    Select a variant, decide whether to encrypt the secret key, and optionally overwrite an existing record
                </p>

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
                        required
                        type="password" 
                        placeholder="Only Required for encrypted keys"
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
            </Glass>
        </div>
    )
}

function setIsLoading(arg0: boolean) {
    throw new Error("Function not implemented.")
}
function setError(arg0: string) {
    throw new Error("Function not implemented.")
}

