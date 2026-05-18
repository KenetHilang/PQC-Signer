'use client'
import { RiExportFill, RiSafe3Fill } from "react-icons/ri"
import SideKeys from "@/app/keys/components/sideKeys"
import { motion, AnimatePresence, Variants } from "motion/react" 
import { useState, useEffect, useCallback} from "react"
import { apiGet } from "@/lib/api"
import { KeyInfo, KeysResponse } from "@/lib/types"
import SignDetatch from "./components/signDetatch"
import EmbedSign from "./components/embeddedSign"
import { useToast } from "@/components/hooks/pushToast"
import { useMode } from "@/components/ui/context/modeContext"
import { AiFillSignature } from "react-icons/ai"

export default function SignPage() {
    const { pushToast } = useToast()
    const { isDetached, setIsDetached } = useMode()

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
                        <div className="flex w-full items-center mr-3.5">
                            <motion.div 
                            layout
                            animate={{ 
                                opacity: isDetached ? 1 : 0.2, 
                                scale: isDetached ? 1 : 0.95 
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={`flex-1`} >
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
                            className={`flex-1 mr-3`}>
                                <div className={`keysGrid w-full ${!isDetached ? '' : 'pointer-events-none'}`} >
                                    <EmbedSign keysData={keys} pushToast={pushToast} />
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
                                        <AiFillSignature />
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