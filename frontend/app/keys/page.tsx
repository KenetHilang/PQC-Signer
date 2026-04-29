'use client'
import { RiArrowLeftSLine, RiArrowRightSLine, RiExportFill, RiHourglassFill, RiSafe3Fill } from "react-icons/ri";
import KeysCreate from "./components/keysCreate";
import KeysImport from "./components/keysImport";
import SideKeys from "./components/sideKeys";
// Import AnimatePresence to animate components entering/leaving the DOM
import { motion, AnimatePresence } from "motion/react"; 
import { useState } from "react";

export default function KeyPage() {
    const [sideActive, setSideActive] = useState(false)
    const [type, setType] = useState('')

    function handleSideKey(hoverTarget: string) {
        if (type === hoverTarget && sideActive) {
            setSideActive(false);
            setType('')
            return;
        }
        setType(hoverTarget);
        setSideActive(true);
    }

    return(
        // Added overflow-hidden w-full h-full back here to prevent scrollbar jumping during animation
        <div id="Keys" className="pages">
            <div className="flex">
                
                <motion.div layout className="flex-1">
                    <div className="keysGrid">
                        <KeysCreate />
                    </div>
                </motion.div>

                <motion.div layout className="flex-1 flex items-center">
                    <div className="keysGrid ">
                        <KeysImport />
                    </div>
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
                </motion.div>

                <AnimatePresence>
                    {sideActive && (
                        <motion.div
                            initial={{ width: "0%", opacity: 1 }}
                            animate={{ width: "25%", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="h-full overflow-hidden shrink-0"
                        >
                            <div className="w-[30vw] h-full mt-2">
                                <SideKeys type={type} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}