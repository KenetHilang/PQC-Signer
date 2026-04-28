'use client'
import Glass from "@/components/ui/glassmorphism/glassMorph";
import { useState } from "react";
import { RiExportFill, RiHourglassFill, RiSafe3Fill } from "react-icons/ri";

export default function SideKeys() {
    const [type, setType] = useState('')

    return(
        <div className="h-full w-full">
            <div className="flex mb-3">
                <h1>{type}</h1>
            </div>

            
            <div className="flex">            
                <div className='bg-white/20 rounded-l-2xl border-1 border-white'> 
                    
                    <div className="w-16 flex flex-col gap-1 p-2 border-r border-gray-600/30">
                        <div 
                            className={`icons  ${type === 'vault' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                            onClick={() => setType('vault')}
                        >
                            <RiSafe3Fill />
                        </div>
                        <div 
                            className={`icons ${type === 'export' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                            onClick={() => setType('export')}
                        >
                            <RiExportFill />
                        </div>
                        <div 
                            className={`icons ${type === 'history' ? 'icons-active' : 'text-gray-400 hover:text-white'}`} 
                            onClick={() => setType('history')}
                        >
                            <RiHourglassFill />
                        </div>
                    </div>
                </div>

                <Glass className='p-3'>
                    <div className="flex-1 p-4">
                        {type === 'vault' && <Vault />}
                        {type === 'export' && <Export />}
                        {type === 'history' && <History />}
                    </div>
                </Glass>

            </div>
            
        </div>
    )
}

function Vault() {
    return(
        <div className="w-full h-full">
            <h2 className="text-lg">Vault Settings</h2>
            <p className="text-sm text-gray-400">Manage your secured keys here.</p>
        </div>
    )
}

function Export() {
    return(
        <div className="w-full h-full">
            <h2 className="text-lg">Export Keys</h2>
            <p className="text-sm text-gray-400">Download your keys securely.</p>
        </div>
    )
}

function History() {
    return(
        <div className="w-full h-full">
            <h2 className="text-lg">Activity History</h2>
            <p className="text-sm text-gray-400">View recent changes and access logs.</p>
        </div>
    )
}