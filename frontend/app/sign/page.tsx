'use client'
import { motion } from "motion/react"
import { useState, useEffect, useCallback } from "react"
import { apiGet } from "@/lib/api"
import { KeyInfo, KeysResponse } from "@/lib/types"
import SignDetatch from "./components/signDetatch"
import EmbedSign from "./components/embeddedSign"
import { useToast } from "@/components/hooks/pushToast"
import { useMode } from "@/components/ui/context/modeContext"
import { useIsDesktop } from "@/components/hooks/useMediaQuery"
import ToolRail from "@/components/ui/toolRail"

export default function SignPage() {
    const { pushToast } = useToast()
    const { isDetached } = useMode()
    const isDesktop = useIsDesktop()

    const [keys, setKeys] = useState<Record<string, KeyInfo>>({})

    const fetchKeys = useCallback(async () => {
        try {
            const response = await apiGet<KeysResponse>('/keys')
            if (response.success && response.keys) {
                setKeys(response.keys)
            }
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        void fetchKeys()
    }, [fetchKeys])

    return(
        <div id="Sign" className="pages">
            <div className="flex flex-col md:flex-row w-full md:items-center md:gap-0">
                <div className="flex flex-col md:flex-row w-full md:ml-6 md:gap-0">
                    <div className="flex flex-col md:flex-row w-full md:items-center md:mr-3.5 gap-4 md:gap-0">
                        {isDesktop ? (
                            <>
                                <motion.div
                                    layout
                                    animate={{
                                        opacity: isDetached ? 1 : 0.2,
                                        scale: isDetached ? 1 : 0.95
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="flex-1"
                                >
                                    <div className={`keysGrid w-full ${!isDetached ? 'pointer-events-none' : ''}`}>
                                        <SignDetatch keysData={keys} pushToast={pushToast} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    layout
                                    animate={{
                                        opacity: isDetached ? 0.2 : 1,
                                        scale: isDetached ? 0.95 : 1
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="flex-1 mr-3"
                                >
                                    <div className={`keysGrid w-full ${!isDetached ? '' : 'pointer-events-none'}`}>
                                        <EmbedSign keysData={keys} pushToast={pushToast} />
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <div className="keysGrid mb-6">
                                {isDetached
                                    ? <SignDetatch keysData={keys} pushToast={pushToast} />
                                    : <EmbedSign keysData={keys} pushToast={pushToast} />}
                            </div>
                        )}
                    </div>

                    <ToolRail pushToast={pushToast} />
                </div>
            </div>
        </div>
    )
}
