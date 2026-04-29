'use client'
import Glass from "@/components/ui/glassmorphism/glassMorph";
import { useState } from "react";
import { RiExportFill, RiHourglassFill, RiSafe3Fill } from "react-icons/ri";

export default function SideKeys({type}: {type:String}) {

    return(
        <div className="h-full w-full">
            <div className="flex mb-3">
                <h1>{type}</h1>
            </div>

            <Glass className='p-3'>
                <div className="w-4/5">
                    {type === 'vault' && <Vault />}
                    {type === 'export' && <Export />}
                    {type === 'history' && <History />}
                </div>
            </Glass>
        </div>
    )
}

function Vault() {
    return(
        <div className="w-full h-full">
            <div className="grid grid-cols-2">
                <label className="mr-3">
                    <h3>Variant</h3>
                    <select className="selections">
                        <option>
                            halo
                        </option>
                    </select>
                </label>
                <label className="mr-3">
                    <h3>Encryption</h3>
                    <select className="selections">
                        <option>
                            halo
                        </option>
                    </select>
                </label>
            </div>
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