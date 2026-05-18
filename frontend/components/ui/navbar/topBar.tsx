'use client'
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { CgArrowsExchange } from "react-icons/cg"
import { useMode } from "../context/modeContext"

export default function TopBar() {
    const { isDetached, setIsDetached } = useMode()

    return(
        <div className="fixed top-0 left-0 w-full z-50 font-Space pb-12">
            
            <div className="absolute inset-0 -z-10 bg-black/40 backdrop-blur-md pointer-events-none [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]" />

            <div className="flex justify-between items-center px-6 py-4.5 text-xl text-white w-full">
                <Link href='/'>
                    <motion.img 
                    className="h-8"  
                    src='/PQC_SVG.svg' 
                    alt="Logo"  
                    whileHover={{
                        scale: 1.15,
                        transition: { duration: 0.1 }
                    }}
                    />
                </Link>

                <motion.button
                    onClick={() => setIsDetached(!isDetached)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white hover:bg-white/90 text-black/95 transition-colors py-1.5 px-4 rounded-3xl text-md cursor-pointer border-2 border-white shadow-sm font-bold flex items-center gap-2"
                >
                    <div className="flex items-center gap-1.5">
                        <span>Mode:</span>
                        <div className="relative w-[6.8vw] h-[4.5vh] flex items-center overflow-hidden">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={isDetached ? 'detached' : 'embedded'}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="absolute left-0 text-black/95"
                                >
                                    {isDetached ? 'Detached' : 'Embedded'}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <motion.div
                        animate={{ rotate: isDetached ? 0 : 180 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex items-center"
                    >
                        <CgArrowsExchange size={24} />
                    </motion.div>
                </motion.button>
                
            </div>
            
        </div>
    )
}