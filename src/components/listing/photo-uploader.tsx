import { useRef } from "react"
import { ImagePlus, LoaderCircle, X } from "lucide-react"

type PhotoUploaderProps = {
  /** URLs of the photos already added (object URLs or remote). */
  photos: string[]
  /** Called with the files the user picked. */
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  /** Hides the add tile once reached (uploading tiles count too). */
  max?: number
  addLabel?: string
  /** Number of photos still uploading; each shows a spinner tile after the photos. */
  uploading?: number
  /** Marks the first photo ("Portada"). */
  coverLabel?: string
  /** File types the picker offers. */
  accept?: string
}

/** Photo grid with remove buttons and an "Agregar" tile that opens the file picker. */
function PhotoUploader({
  photos,
  onAdd,
  onRemove,
  max,
  addLabel = "Agregar",
  uploading = 0,
  coverLabel,
  accept = "image/*",
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canAdd = max === undefined || photos.length + uploading < max

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-sunken"
        >
          <img
            src={src}
            alt={`Foto ${index + 1} del artículo`}
            className="h-full w-full object-cover"
          />
          {coverLabel && index === 0 && (
            <span className="absolute bottom-1 left-1 rounded-md bg-foreground/55 px-1.5 py-0.5 text-badge font-semibold text-text-inverse">
              {coverLabel}
            </span>
          )}
          <button
            type="button"
            aria-label={`Quitar foto ${index + 1}`}
            onClick={() => onRemove(index)}
            className="group/remove absolute top-0 right-0 inline-flex size-11 items-start justify-end rounded-lg p-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {/* 44px hit area around the 24px visible circle. */}
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-foreground/55 text-text-inverse transition-colors group-hover/remove:bg-foreground/75">
              <X className="size-3.5" aria-hidden />
            </span>
          </button>
        </div>
      ))}
      {Array.from({ length: uploading }, (_, index) => (
        <div
          key={`uploading-${index}`}
          role="status"
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface-sunken text-xs text-text-muted"
        >
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          Subiendo…
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
        accept={accept}
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
