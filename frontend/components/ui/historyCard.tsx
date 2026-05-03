import { KeyInfo } from "@/lib/types"
import { formatBytes, formatTimestamp, truncateMiddle } from '@/lib/formatters'

interface HistoryCardProps {
    keyId: string
    keyInfo: KeyInfo
}

export default function HistoryCard({ keyId, keyInfo }: HistoryCardProps) {

    return (
        <div className="rounded-2xl p-3.5 bg-white/20 text-white mr-4 mb-3">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold ">
                        {keyId}
                    </h3>
                    <div className="flex gap-1.5 text-xs font-medium">
                        <div className="border border-white/30 py-0.5 px-2 rounded-full">
                            {keyInfo.algorithm}
                        </div>
                        <div className="border border-white/30 py-0.5 px-2.5 rounded-full">
                            {keyInfo.encrypted ? "encrypted" : "raw"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <h3 className="font-bold text-md mb-1.5">
                            Created
                        </h3>
                        <p className="font-normal text-sm text-gray-200">
                            {formatTimestamp(keyInfo.created_at)}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-md mb-1.5">
                            Public Key
                        </h3>
                        <p className="font-normal text-sm text-gray-200">
                            {formatBytes(keyInfo.public_key_size)}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-md mb-1.5">
                            Signature Size
                        </h3>
                        <p className="font-normal text-sm text-gray-200">
                            {formatBytes(keyInfo.signature_size)}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-md mb-1.5">
                            Key Digest
                        </h3>
                        <p className="font-normal text-sm text-gray-200">
                            {truncateMiddle(keyInfo.public_key_b64)}
                        </p>
                    </div>
                </div>
        </div>
    )
}