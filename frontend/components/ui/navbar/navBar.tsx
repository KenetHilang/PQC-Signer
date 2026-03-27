'use client'

import { color, motion } from "motion/react";
import { useState } from "react";

export default function NavBar({ items }: { items: string[] }) {
    
    const [activeItem, setActiveItem] = useState(items[4]);

    const navContainerVariants = {
        hidden: {
            y: 100,
            width: "48px", 
            height: "48px",
            borderRadius: "50%", 
            opacity: 0,
        },
        visible: {
            y: 40,
            width: "fit-content", 
            height: "64px",
            borderRadius: "32px",
            opacity: 1,
            transition: {
                y: { type: "spring", stiffness: 300, damping: 20 },
                opacity: { duration: 0.2 },
                
                width: { delay: 0.6, type: "spring", stiffness: 150, damping: 15 },
                height: { delay: 0.6, type: "spring", stiffness: 150, damping: 15 },
                borderRadius: { delay: 0.6, duration: 0.4 },
            }
        }
    };

    const contentWrapperVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delay: 1.0,
                staggerChildren: 0.5,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
        visible: { 
            opacity: 1, 
            y: 0, 
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="fixed bottom-15 left-0 w-full flex justify-center z-50 pointer-events-none font-Space">
            
            <motion.div
                variants={navContainerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white/30 rounded-md bg-clip-padding shadow-2xl overflow-hidden pointer-events-auto flex items-center justify-center backdrop-blur-xl"
            >
                <motion.div
                    variants={contentWrapperVariants}
                    className="flex w-full items-center px-2 text-black"
                >   
                    <ul className="flex items-center gap-1 font-medium mx-auto">
                        {items.map((item, index) => {

                            const isActive = activeItem === item;

                            return(
                                <motion.li
                                    key={index}
                                    variants={itemVariants}
                                    onClick={() => setActiveItem(item)}
                                    className={`relative cursor-pointer px-6 py-3 rounded-full transition-colors duration-300 z-10 ${
                                        isActive ? "text-black" : "text-black/60 hover:text-black"
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav"
                                            className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        />
                                    )}
                                    
                                    <span className="relative z-20">
                                        {item}
                                    </span>
                                </motion.li>
                            )
                        })}
                    </ul>
                </motion.div>
            </motion.div>

        </div>
    );
}