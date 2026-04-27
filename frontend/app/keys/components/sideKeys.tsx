'use client'
import { ToastType } from "@/lib/types";
import { motion } from "motion/react";
import { useState } from "react";

export default function SideKeys() {

    const [busyAction, setBusyAction] = useState(false);


    return(
        <div className="h-full w-full border-amber-400">
            <div className="text-3xl font-Akira">
                Keys Creation
            </div>

            <div className="mt-3 font-Space bg-white/20 rounded-md border-1 border-white p-3">
                <h1 className="font-Space font-bold text-xl">
                    Generate Key
                </h1>
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
                            className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
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
            </div>
        </div>
    )
}