import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  label: ReactNode
  /** Small text aligned right of the label ("Opcional", "0 agregadas · mínimo 1"). */
  aside?: ReactNode
  /** Helper text under the control. Hidden while `error` is set. */
  hint?: ReactNode
  /** Error message under the control. */
  error?: ReactNode
  /** id of the control, so the label is clickable. */
  htmlFor?: string
  children: ReactNode
  className?: string
}

/** Label + control + hint/error layout used by every form in the app. */
function FormField({
  label,
  aside,
  hint,
  error,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div
      data-invalid={error ? true : undefined}
      className={cn("scroll-mt-24 space-y-1.5", className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {aside && <span className="text-xs text-text-subtle">{aside}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
