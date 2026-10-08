import type { ChangeEvent, ComponentProps } from "react"
import { cn } from "@/lib/utils"

type PhoneInputProps = Omit<ComponentProps<"input">, "type" | "prefix"> & {
  /** Fixed calling code shown before the input ("+591"). */
  prefix: string
  /** Shows the error border. Pair with FormField `error` for the message. */
  invalid?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/** Phone field with a fixed, non-editable calling-code prefix. */
function PhoneInput({ prefix, invalid, disabled, className, ...props }: PhoneInputProps) {
  return (
    <div
      className={cn(
        "flex h-(--size-field) w-full items-center rounded-md border-(length:--border-width-field) bg-background text-base text-foreground transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        invalid
          ? "border-error focus-within:border-error"
          : "border-border-strong focus-within:border-green-strong",
        disabled && "opacity-60",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-full shrink-0 items-center border-r-(length:--border-width-field) border-border-strong px-3.5 font-semibold text-text-muted"
      >
        {prefix}
      </span>
      <input
        type="tel"
        inputMode="numeric"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className="h-full min-w-0 flex-1 bg-transparent px-3.5 outline-none placeholder:text-text-subtle"
        {...props}
      />
    </div>
  )
}

export { PhoneInput }
export type { PhoneInputProps }
