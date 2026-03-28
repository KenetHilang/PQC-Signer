import Link from "next/link";

export default function TopBar() {
    return(
        <div className="fixed top-0 left-0 w-full z-50 font-Space pb-12">
            
            <div className="absolute inset-0 -z-10 bg-black/40 backdrop-blur-md pointer-events-none [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]" />

            <div className="flex justify-between items-center px-6 py-4.5 text-xl text-white w-full">
                <Link href='/'>
                    <div className="font-bold hover:text-gray-300 transition-colors cursor-pointer">
                        Logo
                    </div>
                </Link>

                <div className="bg-white hover:bg-white/90 text-black/95 transition-colors py-1.5 px-4 rounded-3xl text-md cursor-pointer border-2 border-white shadow-sm font-bold">
                    About
                </div>
            </div>
            
        </div>
    )
}