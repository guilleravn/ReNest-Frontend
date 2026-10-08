import type { ReactNode } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SheetHandle, backdropClasses } from "@/components/ui/sheet"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  cancelLabel?: ReactNode
  onConfirm: () => void
  /** While the confirmation is saving: both buttons are disabled and the dialog can't be dismissed. */
  pending?: boolean
  /** Extra content between the description and the actions. */
  children?: ReactNode
}

/**
 * Confirmation prompt: bottom sheet on mobile, centered card from `sm` up
 * ("¿Confirmar la entrega?").
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Ahora no",
  onConfirm,
  pending = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdropClasses} />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-sheet border border-b-0 border-border bg-background px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-sheet outline-none transition-all duration-250 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-b sm:pt-5 sm:pb-5 sm:data-[ending-style]:translate-y-[-50%] sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-[-50%] sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0"
          )}
        >
          <SheetHandle />
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-text-muted">
              {description}
            </Dialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-4 flex flex-col gap-2.5">
            <Button fullWidth onClick={onConfirm} disabled={pending} aria-busy={pending}>
              {confirmLabel}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
