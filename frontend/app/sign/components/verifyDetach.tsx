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



export default function VerifyDetach({ keysData, pushToast }: SignProps) {


    const availableKeys = Object.keys(keysData)

    const [busyAction, setBusyAction] = useState(false)
    const [signForm, setSignForm] = useState<SignFormState>({ keyId: '', password: '', file: null })


    return(
        <div>
            <h1 className="text-3xl font-Akira">
                Detached Verification
            </h1>

            <Glass className="mt-3 p-3">
                <h2 className="font-Space font-bold text-xl">
                    Verify a Manifest
                </h2>
                <p className="text-xs mt-1">
                    Upload the original file plus a manifest JSON file or paste a manifest payload directly
                    
                </p>

                <div className="flex gap-2.5">
                    <div className="flex items-center justify-center w-full mt-3">
                        <FileDropzone 
                                label="Upload File"
                                file={signForm.file}
                                onFileSelect={(file) => setSignForm(prev => ({ ...prev, file }))}
                        />
                    </div>

                </div>

                <div className="sections-1">
                    <div className="mt-2">
                        <h3>Manual Key Override</h3>

                        <input 
                        className="inputs"
                        type="text" 
                        placeholder="Optional"
                        />
                    </div>

                    <div className="mt-3.5">
                        <div className="flex justify-between items-center mb-1.5">
                            <h3 >Manifest Payload</h3>

                            <button className="flex mr-3 items-center">
                                <div className="mr-2">
                                    <h3 className="bg-white rounded-lg py-1.5 px-3 text-black">FILE</h3>
                                </div>
                                
                                <div>
                                    <h3>PASTE</h3>
                                </div>
                            </button>
                        </div>

                        <textarea 
                            className="inputarea" 
                            placeholder='{"key_id":"team-key","algorithm":"ML-DSA-65",...}'
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
                    {busyAction ? 'Verifying...' : 'Verify Manifest'}
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

