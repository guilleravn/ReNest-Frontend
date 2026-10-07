import type { ComponentProps } from "react"
import { Link, type LinkProps } from "react-router-dom"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Main call to action ("Agendar recogida", "Continuar"). */
        primary:
          "bg-green-strong text-text-inverse hover:bg-green-hover active:bg-green-active",
        /** Secondary action in brand color ("¿Preguntas sobre este producto?"). */
        outline:
          "border-(length:--border-width-field) border-green-strong bg-transparent text-green-strong hover:bg-green-surface",
        /** Neutral bordered action ("Mapa"). */
        secondary:
          "border-(length:--border-width-field) border-border bg-card text-foreground hover:bg-muted",
        /** Low emphasis ("Cancelar", "Ahora no"). */
        ghost:
          "bg-transparent text-text-muted hover:bg-muted hover:text-foreground",
      },
      size: {
        lg: "h-12 px-5 text-button",
        md: "h-11 px-3 text-sm",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  }
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

type ButtonProps = ComponentProps<"button"> & ButtonVariantProps

function Button({
  className,
  variant,
  size,
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}

type ButtonLinkProps = LinkProps & ButtonVariantProps

/** Same look as Button, rendered as an in-app router link. */
function ButtonLink({ className, variant, size, fullWidth, ...props }: ButtonLinkProps) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}

type ButtonAnchorProps = ComponentProps<"a"> & ButtonVariantProps

/** Same look as Button, rendered as an external link (WhatsApp, Maps). */
function ButtonAnchor({ className, variant, size, fullWidth, ...props }: ButtonAnchorProps) {
  return (
    <a
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}

export { Button, ButtonLink, ButtonAnchor, buttonVariants }
export type { ButtonProps, ButtonLinkProps, ButtonAnchorProps }
