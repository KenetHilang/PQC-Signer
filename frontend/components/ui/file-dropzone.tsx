'use client'

import type { DragEvent, KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

import { formatBytes } from '@/lib/formatters'
import { motion } from 'motion/react'
import { formatBytes } from '@/lib/formatters';
import { motion } from 'motion/react';

interface FileDropzoneProps {
  label: string
  file: File | null
  onFileSelect: (file: File | null) => void
  accept?: string
  className?: string
}

export default function FileDropzone({
  label,
  file,
  onFileSelect,
  accept = '*/*',
  className
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isOver, setIsOver] = useState(false)

  function openFilePicker() {
    if (!inputRef.current) {
      return
    }
    inputRef.current.value = ''
    inputRef.current.click()
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsOver(false)
    const nextFile = event.dataTransfer.files?.[0]
    if (nextFile) {
      onFileSelect(nextFile)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div className='w-full'>
      <div 
        className={`flex flex-col items-center justify-center w-full ${className} border border-dashed cursor-pointer rounded-2xl group transition-all duration-200 ${
          isOver 
            ? 'bg-neutral-tertiary-medium border-white/50 scale-[1.02]'
            : 'bg-neutral-secondary-medium border-default-strong hover:bg-neutral-tertiary-medium'
        }`}
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault()
          setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center justify-center text-body pt-5 pb-6 px-4 text-center">
          <motion.svg 
            className={`w-8 h-8 mb-4 transition-transform duration-200 ${isOver ? 'scale-110' : ''}`} 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            fill="none" 
            viewBox="0 0 24 24" 
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/>
          </motion.svg>
          
          {file ? (
            <div className="flex flex-col items-center gap-1">
              <strong className="text-sm truncate max-w-[250px]">{file.name}</strong>
              <span className="text-xs opacity-70">{formatBytes(file.size)}</span>
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs opacity-70">{label}</p>
            </>
          )}
        </div>
        
        {/* Hidden Input hooked up to the Ref */}
        <input 
          ref={inputRef} 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
        />
      </div>
    <div className='w-full'>
      <div 
        className={`flex flex-col items-center justify-center w-full h-64 border border-dashed cursor-pointer rounded-2xl group transition-all duration-200 ${
          isOver 
            ? 'bg-neutral-tertiary-medium border-white/50 scale-[1.02]'
            : 'bg-neutral-secondary-medium border-default-strong hover:bg-neutral-tertiary-medium'
        }`}
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center justify-center text-body pt-5 pb-6 px-4 text-center">
          <motion.svg 
            className={`w-8 h-8 mb-4 transition-transform duration-200 ${isOver ? 'scale-110' : ''}`} 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            fill="none" 
            viewBox="0 0 24 24" 
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/>
          </motion.svg>
          
          {file ? (
            <div className="flex flex-col items-center gap-1">
              <strong className="text-sm truncate max-w-[250px]">{file.name}</strong>
              <span className="text-xs opacity-70">{formatBytes(file.size)}</span>
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs opacity-70">{label}</p>
            </>
          )}
        </div>
        
        {/* Hidden Input hooked up to the Ref */}
        <input 
          ref={inputRef} 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
        />
      </div>
    </div>
  )
}