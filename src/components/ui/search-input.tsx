import type { ComponentProps } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchInputProps = Omit<ComponentProps<"input">, "type"> & {
  /** When provided, a clear (×) button shows while there is a value. */
  onClear?: () => void
  clearLabel?: string
}

/** Search box with leading magnifier and optional clear button (feed). */
function SearchInput({
  className,
  value,
  onClear,
  clearLabel = "Borrar búsqueda",
  ...props
}: SearchInputProps) {
  const hasValue = value !== undefined && value !== ""

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        className="h-12 w-full rounded-xl border-(length:--border-width-field) border-border-strong bg-background pl-10 pr-10 text-base outline-none placeholder:text-text-subtle focus-visible:border-green-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {onClear && hasValue && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
