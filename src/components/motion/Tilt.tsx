// Kept for compatibility: the minimalist design has no tilt effects, so this renders its children as-is.
export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string; max?: number; shine?: boolean; depth?: number }) {
  return <div className={`h-full ${className}`}>{children}</div>;
}
