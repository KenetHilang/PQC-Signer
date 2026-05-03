'use client'
import { RiExportFill, RiHourglassFill, RiSafe3Fill } from "react-icons/ri"
import KeysCreate from "./components/keysCreate"
import KeysImport from "./components/keysImport"
import SideKeys from "./components/sideKeys"
import { motion, AnimatePresence } from "motion/react" 
import { useState, useEffect, useCallback } from "react"
import { apiGet } from "@/lib/api"
import { ServerInfoResponse, ToastType, ToastItem } from "@/lib/types"
import ToastRegion from "@/components/ui/toast-region"

export default function KeyPage() {
    const [sideActive, setSideActive] = useState(false)
    const [type, setType] = useState('')

    const [serverInfo, setServerInfo] = useState<ServerInfoResponse | null>(null)
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const pushToast = useCallback((type: ToastType, message: string) => {
        const toast = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, message }
        setToasts((current) => [...current, toast])
        window.setTimeout(() => {
            setToasts((current) => current.filter((entry) => entry.id !== toast.id))
        }, 5000)
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const refreshData = useCallback(async () => {
        try {
            const indexInfo = await apiGet<ServerInfoResponse>('/')
            setServerInfo(indexInfo)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Request failed'
            pushToast('error', `Failed to load backend data: ${errorMessage}`)
        }
    }, [pushToast])

    useEffect(() => {
        void refreshData()
    }, [refreshData])

    const supportedAlgorithms = serverInfo?.security_features?.supported_signature_algorithms || [
        'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'
    ]
    const defaultAlgorithm = serverInfo?.security_features?.default_signature_algorithm || 'ML-DSA-44'

    function handleSideKey(hoverTarget: string) {
        if (type === hoverTarget && sideActive) {
            setSideActive(false)
            setType('')
            return
        }
        setType(hoverTarget)
        setSideActive(true)
    }

    return(
        <div id="Keys" className="pages">
            <ToastRegion toasts={toasts} onDismiss={dismissToast} />

            <div className="flex w-full items-center">
                <div className="flex w-full">
                    <motion.div layout className="flex-auto">
                        <div className="keysGrid">
                            <KeysCreate 
                                supportedAlgorithms={supportedAlgorithms}
                                defaultAlgorithm={defaultAlgorithm}
                                onSuccess={refreshData}
                                pushToast={pushToast}
                            />
                        </div>
                    </motion.div>

                    <motion.div layout className="flex-auto">
                        <div className="keysGrid ">
                            <KeysImport />
                        </div>
                    </motion.div>

                    <div className="flex items-center">
                        <div className="flex">
                            <div className="w-14 flex flex-col p-2 border-l border-y border-white bg-white/20 rounded-l-xl">
                                <div 
                                    className={`icons cursor-pointer ${type === 'vault' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                    onClick={() => handleSideKey('vault')}
                                >
                                    <RiSafe3Fill />
                                </div>
                                <div 
                                    className={`icons cursor-pointer ${type === 'export' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                    onClick={() => handleSideKey('export')}
                                >
                                    <RiExportFill />
                                </div>
                                <div 
                                    className={`icons cursor-pointer ${type === 'history' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                    onClick={() => handleSideKey('history')}
                                >
                                    <RiHourglassFill />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {sideActive && (
                        <motion.div
                            initial={{ width: "0%", opacity: 1 }}
                            animate={{ width: "27.5%", opacity: 1 }}
                            exit={{ width: 0, opacity: 1 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="h-full overflow-hidden shrink-0"
                        >
                            <div className="w-[35vw] h-full mt-2">
                                <SideKeys type={type} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}