import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type OptionCardProps = {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  /**
   * `radio`: round indicator, single choice (pickup options).
   * `checkbox`: square indicator, multiple choice (reception checklist).
   */
  indicator?: "radio" | "checkbox"
  disabled?: boolean
  className?: string
}

/** Full-width selectable row with a radio/checkbox indicator. */
function OptionCard({
  children,
  selected = false,
  onClick,
  indicator = "radio",
  disabled,
  className,
}: OptionCardProps) {
  const isRadio = indicator === "radio"

  return (
    <button
      type="button"
      role={isRadio ? "radio" : undefined}
      aria-checked={isRadio ? selected : undefined}
      aria-pressed={isRadio ? undefined : selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60",
        selected ? "border-green-strong bg-green-surface" : "border-border bg-card hover:bg-muted",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center border",
          isRadio ? "rounded-full" : "rounded-xs",
          selected
            ? "border-green-strong bg-green-strong text-text-inverse"
            : "border-border-strong"
        )}
      >
        {selected && <Check className="size-3.5" aria-hidden />}
      </span>
      <span className="text-foreground">{children}</span>
    </button>
  )
}

type OptionCardGroupProps = {
  children: ReactNode
  /** Use `radiogroup` for single choice lists. */
  role?: "radiogroup" | "group"
  "aria-label"?: string
  className?: string
}

function OptionCardGroup({ className, ...props }: OptionCardGroupProps) {
  return <div className={cn("space-y-2.5", className)} {...props} />
}

export { OptionCard, OptionCardGroup }
export type { OptionCardProps, OptionCardGroupProps }
