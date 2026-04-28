'use client'
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import KeysCreate from "./components/keysCreate";
import KeysImport from "./components/keysImport";
import SideKeys from "./components/sideKeys";
// Import AnimatePresence to animate components entering/leaving the DOM
import { motion, AnimatePresence } from "motion/react"; 
import { useState } from "react";

export default function KeyPage() {
    const [sideActive, setSideActive] = useState(false)

    return(
        <div id="Keys" className="pages">
            <div className="flex">
                
                <motion.div layout className="flex-1 w-full h-full">
                    <div className="keysGrid">
                        <KeysCreate />
                    </div>
                </motion.div>

                <motion.div layout className="flex-1 w-full h-full flex items-center">
                    <div className="keysGrid ">
                        <KeysImport />
                    </div>
                    <div className="flex items-center">
                        <motion.div 
                            className="mr-4 w-7 h-7 font-bold rounded-full border-1 border-amber-50 p-1 cursor-pointer flex items-center justify-center"
                            whileHover={{ scale: 1.1, transition: { duration: 0.1 } }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSideActive(!sideActive)}
                        >
                            {sideActive ? <RiArrowRightSLine /> : <RiArrowLeftSLine />}
                        </motion.div>
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
                                <SideKeys />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}