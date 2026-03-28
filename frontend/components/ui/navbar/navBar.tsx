'use client'

import { motion, Variants } from "motion/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const items = ["Keys", "Sign", "Verify"];

export default function NavBar() {
    const pathname = usePathname();
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        const hasAnimated = sessionStorage.getItem('navAnimated');
        
        if (hasAnimated) {
            setIsFirstLoad(false);
        } else {
            sessionStorage.setItem('navAnimated', 'true');
        }
    }, []);

    const navContainerVariants: Variants = {
        hidden: { y: 100, width: "48px", height: "48px", borderRadius: "50%", opacity: 0 },
        visible: {
            y: 40, width: "fit-content", height: "64px", borderRadius: "32px", opacity: 1,
            transition: {
                y: { type: "spring", stiffness: 300, damping: 20 },
                opacity: { duration: 0.2 },
                width: { delay: 0.6, type: "spring", stiffness: 150, damping: 15 },
                height: { delay: 0.6, type: "spring", stiffness: 150, damping: 15 },
                borderRadius: { delay: 0.6, duration: 0.4 },
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
        visible: { 
            opacity: 1, y: 0, filter: "blur(0px)",
            transition: { type: "spring", stiffness: 300, damping: 24, delay: 1.2 }
        }
    };

    return (
        <div className="fixed bottom-15 w-full flex justify-center z-50 pointer-events-none font-Space">
            
            <motion.div
                variants={navContainerVariants}
                initial={isFirstLoad ? "hidden" : false}
                animate="visible"
                className="bg-white/30 rounded-md bg-clip-padding shadow-2xl overflow-hidden pointer-events-auto flex items-center justify-center backdrop-blur-xl"
            >
                <ul className="flex items-center gap-1 font-medium px-2 mx-auto">
                    {items.map((item, index) => {
                        const hrefPath = `/${item.toLowerCase()}`;
                        const isActive = pathname === hrefPath;

                        return(
                            <Link key={index} href={hrefPath}>
                                <motion.li variants={itemVariants} className={`relative px-6 py-3.5 rounded-full transition-colors duration-300 z-10 ${isActive ? "text-black" : "text-black/60 hover:text-black"}`}>
                                    
                                    {isActive && (
                                        <motion.div layoutId="active-nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white rounded-full shadow-sm -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
                                    )}
                                    
                                    <p  className="relative z-20 block w-full h-full">
                                        {item}
                                    </p>
                                </motion.li>
                            </Link>
                        )
                    })}
                </ul>
            </motion.div>
        </div>
    );
}