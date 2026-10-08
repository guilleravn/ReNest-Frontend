import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type LogoProps = Omit<ComponentProps<"img">, "src" | "alt" | "width" | "height"> & {
  /** `header`: top bar (36px mobile, 40px desktop). `auth`: login/register screens (--size-logo). */
  size?: "header" | "auth"
}

/** Horizontal ReNest logo. */
function Logo({ size = "header", className, ...props }: LogoProps) {
  const auth = size === "auth"
  return (
    <img
      src="/brand/logo-horizontal.svg"
      alt="ReNest"
      width={auth ? 132 : 108}
      height={auth ? 48 : 40}
      className={cn("w-auto", auth ? "mx-auto h-logo" : "h-9 sm:h-10", className)}
      {...props}
    />
  )
}

export { Logo }
export type { LogoProps }
