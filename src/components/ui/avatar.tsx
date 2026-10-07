import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-9 text-sm",
        lg: "size-10 text-base",
        xl: "size-11 text-base",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

type AvatarProps = VariantProps<typeof avatarVariants> & {
  name: string
  /** Photo URL. Falls back to the first letter of `name`. */
  src?: string
  className?: string
}

function Avatar({ name, src, size, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={name}>{name.trim().charAt(0).toUpperCase()}</span>
      )}
    </span>
  )
}

export { Avatar }
export type { AvatarProps }
