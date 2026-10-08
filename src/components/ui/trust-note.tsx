import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type TrustNoteProps = {
  children: ReactNode
  className?: string
}

/** Small reassurance line with a green shield ("Coordinas la entrega directamente…"). */
function TrustNote({ children, className }: TrustNoteProps) {
  return (
    <p className={cn("flex items-start gap-2 text-xs text-text-muted", className)}>
      <ShieldCheck
        className="mt-0.5 size-(--size-note-icon) shrink-0 text-verified"
        aria-hidden
      />
      {children}
    </p>
  )
}

export { TrustNote }
export type { TrustNoteProps }
