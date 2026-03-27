"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import dynamic from 'next/dynamic';

const DynamicShaderComponent = dynamic(
  () => import('./background/heroBg'),
  {
    loading: () => <LoadingPage />, 
    ssr: false,
  }
);

function LoadingPage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0A0A0E]">
            <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="font-Space text-sm tracking-[0.3em] text-[#73bfc4]"
            >
                Loading Mate...
            </motion.div>
        </div>
    );
}

export default function HeroPage() {
  const [isShaderReady, setIsShaderReady] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden cursor-default bg-black">

      <div className="absolute inset-0 z-0">
        <DynamicShaderComponent onReady={() => setIsShaderReady(true)} />
      </div>

      <motion.div 
        initial={{ opacity: 1 }} 
        animate={{ opacity: isShaderReady ? 0.4 : 1 }}
        transition={{ duration: 4, ease: "easeInOut" }} 
        className="absolute inset-0 z-1 bg-black pointer-events-none" 
      />

      <motion.div className="relative z-10 flex flex-col h-full w-full items-center justify-center text-white gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isShaderReady ? 1 : 0, 
            scale: isShaderReady ? 1 : 1.05 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-8xl font-Akira"
        >
          Q-Sealnet
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isShaderReady ? 1 : 0, 
            y: isShaderReady ? 0 : 10 
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