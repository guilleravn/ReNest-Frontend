import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CountBadge } from "@/components/ui/count-badge"

const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      /**
       * `solid`: selected chip turns solid green (feed filters, listing tabs).
       * `soft`: selected chip turns light green (form choices such as category or condition).
       */
      variant: {
        solid: "",
        soft: "",
      },
      /**
       * `pill`: rounded chip (default).
       * `square`: compact rounded-square chip (day picker "Lun", "Mar").
       */
      shape: {
        pill: "rounded-full px-3.5 text-sm",
        square: "min-w-11 rounded-lg px-2.5 py-2 text-xs font-semibold",
      },
      size: {
        sm: "",
        md: "",
      },
      selected: {
        true: "",
        false: "border-border text-text-muted hover:bg-muted",
      },
    },
    compoundVariants: [
      { shape: "pill", size: "sm", className: "py-1.5" },
      { shape: "pill", size: "md", className: "py-2" },
      { shape: "pill", selected: false, className: "bg-card" },
      { shape: "square", selected: false, className: "bg-background" },
      {
        variant: "solid",
        selected: true,
        className: "border-green-strong bg-green-strong text-text-inverse",
      },
      {
        variant: "soft",
        selected: true,
        className: "border-green-strong bg-green-surface text-green-strong",
      },
    ],
    defaultVariants: {
      variant: "solid",
      shape: "pill",
      size: "sm",
      selected: false,
    },
  }
)

type ChipProps = Omit<ComponentProps<"button">, "children"> &
  Omit<VariantProps<typeof chipVariants>, "selected"> & {
    children: ReactNode
    selected?: boolean
    /** Optional counter shown after the label. */
    count?: ReactNode
  }

/** Toggleable pill used for filters and single/multi choice inputs. */
function Chip({
  children,
  selected = false,
  count,
  variant,
  shape,
  size,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(chipVariants({ variant, shape, size, selected }), className)}
      {...props}
    >
      {children}
      {count !== undefined && (
        <CountBadge
          size="sm"
          tone={selected && variant !== "soft" ? "inverse" : "amber"}
        >
          {count}
        </CountBadge>
      )}
    </button>
  )
}

type ChipGroupProps = ComponentProps<"div"> & {
  /** `md` spacing for regular chips, `sm` for compact square chips. */
  gap?: "sm" | "md"
}

function ChipGroup({ className, gap = "md", ...props }: ChipGroupProps) {
  return (
    <div
      className={cn("flex flex-wrap", gap === "md" ? "gap-2" : "gap-1.5", className)}
      {...props}
    />
  )
}

export { Chip, ChipGroup }
export type { ChipProps, ChipGroupProps }
