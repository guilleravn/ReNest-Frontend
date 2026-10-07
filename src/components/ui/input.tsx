import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const fieldClasses =
  "w-full rounded-md border-(length:--border-width-field) bg-background text-base text-foreground outline-none transition-colors placeholder:text-text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

function fieldStateClasses(invalid?: boolean) {
  return invalid
    ? "border-error focus-visible:border-error"
    : "border-border-strong focus-visible:border-green-strong"
}

type InputProps = ComponentProps<"input"> & {
  /** Shows the error border. Pair with FormField `error` for the message. */
  invalid?: boolean
}

function Input({ className, invalid, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(fieldClasses, "h-(--size-field) min-w-0 px-3.5", fieldStateClasses(invalid), className)}
      {...props}
    />
  )
}

type TextareaProps = ComponentProps<"textarea"> & {
  invalid?: boolean
}

function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(fieldClasses, "p-3.5", fieldStateClasses(invalid), className)}
      {...props}
    />
  )
}

type SelectProps = ComponentProps<"select"> & {
  invalid?: boolean
  /** Disabled first option shown until the user picks ("Elige tu zona"). */
  placeholder?: string
}

/** Native select styled like Input. Children are <option> elements. */
function Select({
  className,
  invalid,
  placeholder,
  value,
  defaultValue,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      value={value}
      defaultValue={value === undefined && defaultValue === undefined && placeholder ? "" : defaultValue}
      className={cn(fieldClasses, "h-(--size-field) min-w-0 px-3.5", fieldStateClasses(invalid), className)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
}

export { Input, Textarea, Select }
export type { InputProps, TextareaProps, SelectProps }
