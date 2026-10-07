import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type StepProgressProps = {
  /** Left label ("Nuevo artículo"). */
  label: ReactNode
  currentStep: number
  totalSteps: number
  /** Right label. Defaults to "Paso {current} de {total}". */
  stepLabel?: ReactNode
  className?: string
}

/** Multi-step form header with a thin progress bar. */
function StepProgress({
  label,
  currentStep,
  totalSteps,
  stepLabel,
  className,
}: StepProgressProps) {
  const percent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100))

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>{label}</span>
        <span>{stepLabel ?? `Paso ${currentStep} de ${totalSteps}`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full bg-primary transition-all")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export { StepProgress }
export type { StepProgressProps }
