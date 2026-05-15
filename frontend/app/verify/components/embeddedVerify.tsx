'use client'
import CustomSelect from "@/components/ui/customSelect/customSelect";
import FileDropzone from "@/components/ui/file-dropzone";
import Glass from "@/components/ui/glassmorphism/glassMorph";
import { KeyInfo, ToastType } from "@/lib/types";
import { motion } from "motion/react";
import { useState } from "react";

interface EmbedVerifyFormState {
  file: File | null;
  signatureFile: File | null;
  signatureText: string;
  keyId: string;
}

interface EmbedVerifyProps {
    keysData: Record<string, KeyInfo>
    pushToast: (type: ToastType, message: string) => void
}

export default function EmbedVerify({ pushToast }: EmbedVerifyProps){

    const [embedSign, setEmbedForm] = useState<EmbedVerifyFormState>({ file: null, signatureFile: null, signatureText: '', keyId: '' })
    const [busyAction, setBusyAction] = useState(false)
    
    return(
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}>
            <h1>Embedded Verification</h1>

            <Glass className="mt-3 p-3">
                <h2>Verify a Patched Binary</h2>
                <p className="text-xs mt-1">
                    Extracts the appended manifest block, recomputes the original file hash, and verifies the ML-DSA Signature
                </p>

                <div className="sections-1">
                        <FileDropzone 
                                label="Upload File"
                                file={embedSign.file}
                                onFileSelect={(file) => setEmbedForm(prev => ({ ...prev, file }))}
                                className="h-48"
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
                    {busyAction ? 'Verifying...' : 'Verify Embedded Signature'}
                </motion.button>
                
            </Glass>
        </motion.div>
    )
}