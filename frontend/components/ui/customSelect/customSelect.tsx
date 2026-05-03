import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { RiArrowDownSLine } from "react-icons/ri" // Make sure to install react-icons if you haven't

interface CustomSelectProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function CustomSelect({ options, value, onChange, placeholder = "Select an option" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    function callMe() {
        setIsOpen(false)
        console.log(`I'm being called ${isOpen}`)
    }

    return (
        <div className="relative w-full text-white font-Space mt-1.5" ref={dropdownRef}>
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            >
                <span className={value ? "text-white" : "text-gray-400"}>
                    {value || placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <RiArrowDownSLine className="text-xl text-gray-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 w-full bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="max-h-60 overflow-y-auto">
                            {options.map((option) => (
                                <div
                                    key={option}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onChange(option)
                                        setIsOpen(false)   
                                    }}
                                    className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                                        value === option 
                                            ? "bg-amber-400/20 text-amber-300 font-bold" 
                                            : "hover:bg-white/10 text-gray-200"
                                    }`}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}