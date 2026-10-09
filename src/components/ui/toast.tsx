import type { ReactNode } from "react"
import { CircleAlert, CircleCheck, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toastVariants = cva(
  "pointer-events-auto flex w-full max-w-auth items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-menu",
  {
    variants: {
      tone: {
        success: "border-success/30 bg-success-surface [&_svg:first-child]:text-success",
        error: "border-error/30 bg-error-surface [&_svg:first-child]:text-error",
      },
    },
    defaultVariants: { tone: "success" },
  }
)

type ToastProps = VariantProps<typeof toastVariants> & {
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

/** Short feedback message ("Sesión cerrada"). Place inside ToastViewport. */
function Toast({ tone = "success", children, onDismiss, className }: ToastProps) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck
  return (
    <div role="status" className={cn(toastVariants({ tone }), className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="flex-1 font-medium text-foreground">{children}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onDismiss}
          className="-m-3.5 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

/** Fixed bottom area that stacks toasts. */
function ToastViewport({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-6"
    >
      {children}
    </div>
  )
}

export { Toast, ToastViewport }
export type { ToastProps }
