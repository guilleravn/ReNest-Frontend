import { useState } from "react"
import { cn } from "@/lib/utils"

type ImageGalleryProps = {
  images: string[]
  /** Alt text for the main photo, usually the item title. */
  alt: string
  className?: string
}

/** Large photo with clickable thumbnails underneath (item detail). */
function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const mainSrc = images[current] ?? images[0]

  return (
    <div className={className}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-sunken">
        {mainSrc && (
          <img src={mainSrc} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              aria-label={`Foto ${index + 1}`}
              aria-current={index === current}
              onClick={() => setCurrent(index)}
              className={cn(
                "relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-24",
                index === current ? "border-green-strong" : "border-transparent hover:border-border-strong"
              )}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { ImageGallery }
export type { ImageGalleryProps }
