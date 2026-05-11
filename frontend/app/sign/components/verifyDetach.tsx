'use client'
import FileDropzone from "@/components/ui/file-dropzone"
import Glass from "@/components/ui/glassmorphism/glassMorph"
import { KeyInfo, ToastType } from "@/lib/types"
import { motion, AnimatePresence } from "motion/react"
import { useState } from "react"


interface VerifyFormState {
  file: File | null;
  signatureFile: File | null;
  signatureText: string;
  keyId: string;
}

interface SignProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}

export default function VerifyDetach({ keysData, pushToast }: SignProps) {
    const availableKeys = Object.keys(keysData)

    const [FilePayload, setFilePayload] = useState(true)
    const [busyAction, setBusyAction] = useState(false)
    const [verifyForm, setVerifyForm] = useState<VerifyFormState>({ file: null, signatureFile: null, signatureText: '', keyId: '' })

    return(
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
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
                                file={verifyForm.file}
                                onFileSelect={(file) => setVerifyForm(prev => ({ ...prev, file }))}
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
                            <h3>Manifest Payload</h3>

                            <button className="flex mr-3 items-center" >
                                <div className="mr-2" onClick={() => setFilePayload(!FilePayload)}>
                                    <h3 className={`rounded-lg py-1.5 px-3 text-black transition-colors duration-200 ${FilePayload ? 'bg-white text-black' : 'text-white hover:bg-white/30 '}`}>FILE</h3>
                                </div>
                                
                                <div onClick={() => setFilePayload(!FilePayload)}>
                                    <h3 className={`rounded-lg py-1.5 px-3 text-black transition-colors duration-200 ${!FilePayload ? 'bg-white text-black' : 'text-white hover:bg-white/30 '}`}>PASTE</h3>
                                </div>
                            </button>
                        </div>

                        <div className="relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                {FilePayload ? (
                                    <motion.div
                                        key="file-dropzone"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <FileDropzone 
                                            className="mt-2"
                                            label="Upload Manifest"
                                            file={verifyForm.signatureFile}
                                            onFileSelect={(file) => setVerifyForm(prev => ({ ...prev, signatureFile: file }))}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="paste-textarea"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <textarea 
                                            className="inputarea h-32" 
                                            placeholder='{"key_id":"team-key","algorithm":"ML-DSA-65",...}'
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
        </motion.div>
    )
}