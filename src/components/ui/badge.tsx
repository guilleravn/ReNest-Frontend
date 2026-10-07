import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-full", {
  variants: {
    tone: {
      green: "bg-green-surface text-green-strong",
      blue: "bg-blue-surface text-blue-strong",
      amber: "bg-amber-surface text-amber-strong",
      verified: "bg-verified-surface text-verified",
      error: "bg-error-surface text-error",
      neutral: "bg-surface-sunken text-text-subtle",
    },
    size: {
      /** Condition pill on cards ("Poco uso"). */
      md: "gap-1.5 px-2.5 py-1 text-xs font-medium",
      /** Status pill on compact rows ("Activo", "Completado"). */
      sm: "gap-1 px-2 py-0.5 text-badge font-semibold capitalize",
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
})

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone, size }), className)}
      {...props}
    />
  )
}

type VerifiedBadgeProps = {
  /** Defaults to "Vendedor verificado". */
  children?: ReactNode
  /**
   * `soft`: green pill used inside cards.
   * `overlay`: translucent pill placed on top of an image.
   */
  variant?: "soft" | "overlay"
  className?: string
}

function VerifiedBadge({
  children = "Vendedor verificado",
  variant = "soft",
  className,
}: VerifiedBadgeProps) {
  if (variant === "overlay") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-badge font-semibold text-verified backdrop-blur-sm",
          className
        )}
      >
        <BadgeCheck className="size-3" aria-hidden />
        {children}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-verified-surface px-2.5 py-1 text-xs font-semibold text-verified",
        className
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      {children}
    </span>
  )
}

export { Badge, VerifiedBadge }
export type { BadgeProps, VerifiedBadgeProps }
