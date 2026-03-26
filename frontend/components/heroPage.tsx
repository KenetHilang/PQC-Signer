"use client";

import * as motion from "motion/react-client";
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';

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
                INITIALIZING QUANTUM STATE...
            </motion.div>
        </div>
    );
}


export default function HeroPage() {

  return (
    <div className="relative h-screen w-full overflow-hidden cursor-default">

      <div className="absolute inset-0 z-0 bg-black">
        <DynamicShaderComponent/>
      </div>

      <motion.div 
        initial={{opacity: 1}} animate={{ opacity: 0.4 }}
        transition={{duration: 8, ease: "easeInOut" }} 
        className="absolute inset-0 z-1 bg-black" />

      <div className="relative z-10 flex flex-col h-full w-full items-center justify-center text-white gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 1.05}}
          animate={{ opacity: 1, scale: 1}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-8xl font-Akira"
        >
          Q-Sealnet
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
          className="text-3xl font-Space"
        >
          Post-Quantum Signing Workbench
        </motion.div>

      </div>
    </div>
  );
}