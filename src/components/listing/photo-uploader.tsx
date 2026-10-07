import { useRef } from "react"
import { ImagePlus, X } from "lucide-react"

type PhotoUploaderProps = {
  /** URLs of the photos already added (object URLs or remote). */
  photos: string[]
  /** Called with the files the user picked. */
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  /** Hides the add tile once reached. */
  max?: number
  addLabel?: string
}

/** Photo grid with remove buttons and an "Agregar" tile that opens the file picker. */
function PhotoUploader({
  photos,
  onAdd,
  onRemove,
  max,
  addLabel = "Agregar",
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canAdd = max === undefined || photos.length < max

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-sunken"
        >
          <img src={src} alt="Foto del artículo" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Quitar foto"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-foreground/55 text-text-inverse transition-colors hover:bg-foreground/75"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-(length:--border-width-field) border-dashed border-border-strong text-xs font-medium text-text-muted transition-colors hover:border-green-strong hover:text-green-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ImagePlus className="size-5" aria-hidden />
          {addLabel}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length) onAdd(files)
          event.target.value = ""
        }}
      />
    </div>
  )
}

export { PhotoUploader }
export type { PhotoUploaderProps }
