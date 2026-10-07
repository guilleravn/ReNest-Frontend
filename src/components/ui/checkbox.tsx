import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  /** Label content. Wrap links in <CheckboxLink> to get the green emphasis. */
  children: ReactNode
}

/** Inline checkbox with its label ("Acepto los Términos y la Política de privacidad."). */
function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex items-start gap-2.5 text-sm text-text-muted", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-(--size-checkbox) shrink-0 accent-green-strong"
        {...props}
      />
      <span>{children}</span>
    </label>
  )
}

/** Green emphasized link inside a Checkbox label. */
function CheckboxLink({ className, ...props }: ComponentProps<"a">) {
  return <a className={cn("font-medium text-green-strong hover:underline", className)} {...props} />
}

export { Checkbox, CheckboxLink }
export type { CheckboxProps }
