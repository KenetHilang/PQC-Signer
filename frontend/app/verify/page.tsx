'use client'
import { RiExportFill, RiHourglassFill, RiSafe3Fill } from "react-icons/ri"
import SideKeys from "@/app/keys/components/sideKeys"
import { motion, AnimatePresence, Variants } from "motion/react" 
import { useState, useEffect, useCallback, useRef } from "react"
import { apiGet } from "@/lib/api"
import { ToastItem, KeyInfo, KeysResponse } from "@/lib/types"
import EmbedVerify from "./components/embeddedVerify"
import VerifyDetach from "./components/verifyDetach"
import { useToast } from "@/components/hooks/pushToast"

export default function VerifyPage() {
    const { pushToast } = useToast()

    const [sideActive, setSideActive] = useState(false)
    const [type, setType] = useState('')

    const [keys, setKeys] = useState<Record<string, KeyInfo>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchKeys = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await apiGet<KeysResponse>('/keys')
            
            if (response.success && response.keys) {
                setKeys(response.keys)
            }
        } catch (err) {
            setError('Failed to load key history.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchKeys()
    }, [fetchKeys])

    function handleSideKey(hoverTarget: string) {
        if (type === hoverTarget && sideActive) {
            setSideActive(false)
            setType('')
            return
        }
        setType(hoverTarget)
        setSideActive(true)
    }

    const iconAnimation: Variants = {
        hover: { scale: 1.1, y: -2, transition: { type: "spring", stiffness: 400, damping: 10 } },
        tap: { scale: 0.85 }
    }

    return(
            <div id="Sign" className="pages">

                <div className="flex w-full items-center">
                    <div className="flex w-full ml-6">
                        <div className="flex w-full items-center">
                            <motion.div layout className="flex-auto">
                                <div className="keysGrid">
                                    <VerifyDetach keysData={keys} pushToast={pushToast}/>
                                </div>
                            </motion.div>

                            <motion.div layout className="flex-auto mr-3">
                                <div className="keysGrid">
                                    <EmbedVerify pushToast={pushToast} keysData={keys} />
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex items-center">
                            <div className="flex">
                                <div className="w-14 flex flex-col p-2 border-l border-y border-white bg-white/20 rounded-l-xl">
                                    <motion.div 
                                        className={`icons cursor-pointer ${type === 'vault' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                        onClick={() => handleSideKey('vault')}
                                        variants={iconAnimation}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <RiSafe3Fill />
                                    </motion.div>
                                    <motion.div 
                                        className={`icons cursor-pointer ${type === 'export' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                        onClick={() => handleSideKey('export')}
                                        variants={iconAnimation}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <RiExportFill />
                                    </motion.div>
                                    <motion.div 
                                        className={`icons cursor-pointer ${type === 'history' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                                        onClick={() => handleSideKey('history')}
                                        variants={iconAnimation}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <RiHourglassFill />
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {sideActive && (
                            <motion.div
                                initial={{ width: "0%", opacity: 1 }}
                                animate={{ 
                                    width: "27.5%", 
                                    opacity: 1,
                                    transition: { type: "spring", bounce: 0.35, duration: 0.6 } 
                                }}
                                exit={{ 
                                    width: 0, 
                                    opacity: 1,
                                    transition: { type: "tween", ease: "easeOut", duration: 0.2 }
                                }}
                                className="h-full overflow-hidden shrink-0"
                            >
                                <div className="w-[35vw] h-full mt-2">
                                    <SideKeys type={type} pushToast={pushToast} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        )
}