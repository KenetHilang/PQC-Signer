"use client";

import HeroBackground from "@/components/background/heroBg";
import * as motion from "motion/react-client";

export default function HeroPage() {

  return (
    <div id='hero' className="relative h-screen w-full overflow-hidden cursor-default bg-black">

      <div className="absolute inset-0 z-0">
        <HeroBackground />
      </div>

      <motion.div 
        initial={{ opacity: 1 }} 
        animate={{ opacity: 0.4 }}
        transition={{ duration: 10, ease: "easeInOut" }} 
        className="absolute inset-0 z-1 bg-black pointer-events-none" 
      />

      <motion.div className="relative z-10 flex flex-col h-full w-full items-center justify-center text-white gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: 1, 
            scale: 1.05 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-8xl font-Akira"
        >
          Q-Sealnet
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity:  1, 
            y: 0 
          }}
          transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
          className="text-3xl font-Space"
        >
          Post-Quantum Signing Workbench
        </motion.div>
      </motion.div>

    </div>
  );
}