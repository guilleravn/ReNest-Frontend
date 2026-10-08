import { Link, type LinkProps } from "react-router-dom"
import { cn } from "@/lib/utils"

/** Inline brand-colored link inside a sentence ("Regístrate"). */
function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "rounded-sm font-semibold text-green-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    />
  )
}

export { TextLink }
