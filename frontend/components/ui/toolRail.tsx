'use client'
import { useState } from "react"
import { motion, AnimatePresence, Variants } from "motion/react"
import { RiExportFill, RiSafe3Fill } from "react-icons/ri"
import { AiFillSignature } from "react-icons/ai"
import { IoClose } from "react-icons/io5"
import SideKeys from "@/app/keys/components/sideKeys"
import { useIsDesktop } from "@/components/hooks/useMediaQuery"
import { ToastType } from "@/lib/types"

interface ToolRailProps {
    pushToast: (type: ToastType, message: string) => void
}

const iconAnimation: Variants = {
    hover: { scale: 1.1, y: -2, transition: { type: "spring", stiffness: 400, damping: 10 } },
    tap: { scale: 0.85 }
}

const TOOLS: { key: string; icon: React.ReactNode }[] = [
    { key: 'vault', icon: <RiSafe3Fill /> },
    { key: 'export', icon: <RiExportFill /> },
    { key: 'history', icon: <AiFillSignature /> },
]

export default function ToolRail({ pushToast }: ToolRailProps) {
    const isDesktop = useIsDesktop()
    const [sideActive, setSideActive] = useState(false)
    const [type, setType] = useState('')

    function handleSideKey(target: string) {
        if (type === target && sideActive) {
            setSideActive(false)
            setType('')
            return
        }
        setType(target)
        setSideActive(true)
    }

    function closePanel() {
        setSideActive(false)
        setType('')
    }

    const railButtons = TOOLS.map((tool) => (
        <motion.div
            key={tool.key}
            className={`icons cursor-pointer ${type === tool.key && sideActive ? 'icons-active' : 'text-gray-400 hover:text-white'}`}
            onClick={() => handleSideKey(tool.key)}
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
        >
            {tool.icon}
        </motion.div>
    ))

    if (!isDesktop) {
        return (
            <>
                <div className="w-full flex justify-center">
                    <div className="flex flex-row gap-2 p-2 border border-white bg-white/20 rounded-2xl">
                        {railButtons}
                    </div>
                </div>

                <AnimatePresence>
                    {sideActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                            onClick={closePanel}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="absolute inset-x-0 bottom-0 top-16 rounded-t-3xl bg-[#181818]/95 backdrop-blur-xl border-t border-white/15 p-6.5 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={closePanel}
                                    aria-label="Close panel"
                                    className="absolute top-6 right-6.5 z-10 text-2xl text-gray-300 hover:text-white"
                                >
                                    <IoClose />
                                </button>
                                <SideKeys type={type} pushToast={pushToast} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    // --- Desktop: vertical rail attached to the right + width-expanding panel ---
    return (
        <>
            <div className="flex items-center">
                <div className="flex">
                    <div className="w-14 flex flex-col p-2 border-l border-y border-white bg-white/20 rounded-l-xl">
                        {railButtons}
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
        </>
    )
}
