'use client'
import Glass from "@/components/ui/glassmorphism/glassMorph";
import { ToastType } from "@/lib/types";
import { motion } from "motion/react";
import { useState } from "react";

interface KeyGenerationCardProps {
  supportedAlgorithms: string[];
  defaultAlgorithm?: string;
  onSuccess: () => Promise<void>;
  pushToast: (type: ToastType, message: string) => void;
}


export default function KeysCreate() {

    const [busyAction, setBusyAction] = useState(false);


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

                <div className="mt-2">
                    <div className="sections-2">
                        <div className="mr-4">
                            <h3>Key ID</h3>
                            <input className="inputs" type="text" />
                        </div>
                        <label className="mr-4">
                            <h3>Variant</h3>
                            <select className="selections">
                                <option>
                                    halo
                                </option>
                            </select>
                        </label>
                    </div>
                    
                    <div className="sections-2">
                        <div className="mr-4">
                            <h3>Password</h3>
                            <input className="inputs" type="password" />
                        </div>
                        <label className="mr-4">
                            <h3>Encryption</h3>
                            <select className="selections">
                                <option>
                                    hei
                                </option>
                            </select>
                        </label>
                    </div>

                    <label className="flex gap-2.5 mt-3 ml-1 items-center">
                        <input
                            className="checkmarks"
                            type="checkbox"
                        />
                        <span className="text-sm">Allow overwrite for an existing key ID</span>
                    </label>

                    <motion.button 
                    className="h-10 w-full bg-white text-black mt-4 rounded-xl font-bold" 
                    type="submit"
                    whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.1 }
                    }}
                    
                    >
                        {busyAction ? 'Generating...' : 'Generate Key Pair'}
                    </motion.button>
                </div>
            </Glass>
        </div>
    )
}