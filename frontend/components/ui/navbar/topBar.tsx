

export default function TopBar() {
    return(
        <div className="fixed top-0 left-0 w-full flex justify-center z-60 font-Space">
            <div className="text-xl text-white w-full bg-amber-300">
                <div className="flex justify-between px-4 py-2">
                    <div>
                        Logo
                    </div>
                    <div className="bg-amber-950 p-2 rounded-3xl">
                        About
                    </div>
                </div>
            </div>
        </div>
    )
}