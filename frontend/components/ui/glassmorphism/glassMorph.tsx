
export default function Glass({ children, className }: { children: React.ReactNode, className: String }) {
    return (<div className={`glassmorphism ${className}`}>{children}</div>)
}