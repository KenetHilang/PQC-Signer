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

export default function VerifyDetach({ pushToast }: SignProps) {

    const [FilePayload, setFilePayload] = useState(true)
    const [busyAction, setBusyAction] = useState(false)
    const [verifyForm, setVerifyForm] = useState<VerifyFormState>({ file: null, signatureFile: null, signatureText: '', keyId: '' })

    return(
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <h1>
                Detached Verification
            </h1>

            <Glass className="mt-3 p-3">
                <div className="sections-2 mt-1">
                    <div>
                        <h2>
                            Verify a Manifest
                        </h2>
                        <p className="text-xs mt-1">
                            Upload the original file here
                        </p>
                    </div>

                    <div className="flex justify-between items-center mb-1.5">
                        <div >
                            <h2>Manifest Payload</h2>
                            <p className="text-xs mt-1">
                                Upload the manifest JSON file or paste a manifest payload directly
                            </p>
                        </div>
                        

                        <button className="flex mr-3 items-center" >
                            <div className="mr-2" onClick={() => setFilePayload(!FilePayload)}>
                                <h3 className={`rounded-lg py-1.5 px-3 cursor-pointer text-black transition-colors duration-200 ${FilePayload ? 'bg-white text-black' : 'text-white hover:bg-white/30 '}`}>FILE</h3>
                            </div>
                            
                            <div onClick={() => setFilePayload(!FilePayload)}>
                                <h3 className={`rounded-lg py-1.5 px-3 cursor-pointer text-black transition-colors duration-200 ${!FilePayload ? 'bg-white text-black' : 'text-white hover:bg-white/30 '}`}>PASTE</h3>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="sections-2 gap-3">
                    <FileDropzone 
                            className="h-42"
                            label="Upload File"
                            file={verifyForm.file}
                            onFileSelect={(file) => setVerifyForm(prev => ({ ...prev, file }))}
                    />

                    <div>
                        <div className="overflow-hidden h-42 relative">
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
                                            className="h-42"
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
                                            className="inputarea mt-0 h-42" 
                                            placeholder='{"key_id":"team-key","algorithm":"ML-DSA-65",...}'
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
                </div>

                <motion.button 
                className="h-10 w-full bg-white text-black mt-4 rounded-xl font-bold" 
                type="submit"
                disabled={busyAction}
                whileHover={{
                    scale: 1.01,
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