import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pageContainerVariants = cva("mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8", {
  variants: {
    /**
     * `narrow` (2xl): forms and single-column flows.
     * `medium` (5xl): item detail with gallery.
     * `wide` (6xl): grids and lists.
     */
    width: {
      narrow: "max-w-2xl",
      medium: "max-w-5xl",
      wide: "max-w-6xl",
    },
    /**
     * Bottom space so fixed bars don't cover content.
     * `nav`: room for the mobile BottomNav. `actions`: room for a two-button
     * StickyActionBar. `none`: page handles it.
     */
    bottomSpace: {
      default: "pb-12",
      nav: "pb-24 sm:pb-12",
      actions: "pb-44",
      none: "pb-0",
    },
  },
  defaultVariants: {
    width: "wide",
    bottomSpace: "default",
  },
})

type PageContainerProps = ComponentProps<"main"> & VariantProps<typeof pageContainerVariants>

/** The page's <main> with the app's standard widths and paddings. */
function PageContainer({ className, width, bottomSpace, ...props }: PageContainerProps) {
  return (
    <main
      className={cn(pageContainerVariants({ width, bottomSpace }), className)}
      {...props}
    />
  )
}

export { PageContainer }
export type { PageContainerProps }
