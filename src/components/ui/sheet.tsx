import type { ReactNode } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const backdropClasses =
  "fixed inset-0 z-50 bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"

/** Grab handle shown on mobile bottom sheets. */
function SheetHandle() {
  return <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
}

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Scrollable body. */
  children: ReactNode
  /** Sticky footer, usually Cancel + confirm Buttons. */
  footer?: ReactNode
  closeLabel?: string
}

/**
 * Form panel: bottom sheet on mobile, right-side drawer from `sm` up
 * ("Agregar horario y lugar").
 */
function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = "Cerrar",
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdropClasses} />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden border border-b-0 border-border bg-background shadow-sheet outline-none transition-transform duration-250 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            "rounded-t-sheet sm:inset-y-0 sm:right-0 sm:bottom-auto sm:left-auto sm:h-dvh sm:max-h-none sm:w-[27rem] sm:max-w-[92vw] sm:rounded-none sm:border sm:border-r-0 sm:data-[ending-style]:translate-x-full sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-x-full sm:data-[starting-style]:translate-y-0"
          )}
        >
          <div className="px-5 pt-3 sm:px-6 sm:pt-6">
            <SheetHandle />
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-text-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label={closeLabel}
                className="-m-1 hidden rounded-md p-1 text-text-muted transition-colors hover:text-foreground sm:inline-flex"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
          {footer && (
            <div className="border-t border-border px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] sm:px-6 sm:pb-5">
              <div className="flex gap-2.5">{footer}</div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Sheet, SheetHandle, backdropClasses }
export type { SheetProps }
