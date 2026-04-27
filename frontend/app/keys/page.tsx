import KeysCreate from "./components/keysCreate";
import KeysImport from "./components/keysImport";
import SideKeys from "./components/sideKeys";


export default function KeyPage() {
    return(
        <div id="Keys" className="pages">
            <div className="grid grid-cols-2 grid-rows-2 gap-0">
                <div className="flex items-center">
                    <div className="keysGrid">
                        <KeysCreate />
                    </div>
                </div>

                <div className="col-start-1 row-start-2">
                    <div className="keysGrid">
                        <KeysImport />
                    </div>
                </div>

                <div className="row-span-2 col-start-2 row-start-1">
                    <div className="keysGrid">
                        <SideKeys />
                    </div>
                </div>
            </div>

        </div>
    )
}