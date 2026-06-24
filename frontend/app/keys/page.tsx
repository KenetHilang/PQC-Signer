'use client'
import { RiExportFill, RiSafe3Fill } from "react-icons/ri"
import KeysCreate from "./components/keysCreate"
import KeysImport from "./components/keysImport"
import SideKeys from "./components/sideKeys"
import { motion, AnimatePresence, Variants } from "motion/react" 
import { useState } from "react"
import { useToast } from "@/components/hooks/pushToast"
import { useServerInfo } from "@/components/hooks/serverCheck"
import { AiFillSignature } from "react-icons/ai"
import ToolRail from "@/components/ui/toolRail"


export default function KeyPage() {
    const { pushToast } = useToast()
    const { serverInfo, refreshData } = useServerInfo()

    const [sideActive, setSideActive] = useState(false)
    const [type, setType] = useState('')

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

    const iconAnimation: Variants = {
        hover: { scale: 1.1, y: -2, transition: { type: "spring", stiffness: 400, damping: 10 } },
        tap: { scale: 0.85 }
    }

    return(
        <div id="Keys" className="pages">
            <div className="flex w-full">
                <div className="w-full sm:ml-6 items-center sm:flex">
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

                    <motion.div layout className="flex-auto sm:mr-3 sm:mt-0 mt-8 sm:mb-0 mb-6">
                        <div className="keysGrid ">
                            <KeysImport 
                                onSuccess={refreshData}
                                pushToast={pushToast}
                            />
                        </div>
                    </motion.div>
    
                    <ToolRail pushToast={pushToast} />
                </div>


            </div>
        </div>
    )
}