'use client'
import { motion } from "motion/react";
import { useState } from "react";

export default function KeysImport() {

    const [busyAction, setBusyAction] = useState(false);

    return(
        <div className="h-full w-full border-amber-400">
            <div className="text-3xl font-Akira">
                Keys Import
            </div>

            <div className="mt-3 font-Space bg-white/20 rounded-md border-1 border-white p-3">
                <h1 className="font-Space font-bold text-xl">
                    Import Exported Key JSON
                </h1>
                <p className="text-xs mt-1">
                    Paste a base 64 or encrypted export (Overwrite the key ID only when you need to rename it on import)
                </p>

                <div className="mt-2">
                    <div className="sections-1">
                        <div className="mr-4">
                            <h3>Override Key ID</h3>
                            <input className="inputs" type="text" />
                        </div>

                        <label className="flex gap-2.5 mt-3 ml-1 items-center">
                            <input
                                className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
                                type="checkbox"
                            />
                            <span className="text-sm">
                                Replace an existing key with the same ID
                            </span>
                        </label>
                    </div>
                    
                    <div className="sections-1">
                        <div className="mr-4">
                            <h3>Export Payload</h3>
                            <input className="inputarea" type="textarea" />
                        </div>
                    </div>

                    <motion.button 
                    className="h-10 w-full bg-white text-black mt-4 rounded-xl" 
                    type="submit"
                    whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.1 }
                    }}

                    >
                        {busyAction ? 'Importing...' : 'Import Key'}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}