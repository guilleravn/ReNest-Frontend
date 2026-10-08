import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"

type AuthLayoutProps = {
  children: ReactNode
  /** Line under the card ("¿No tienes cuenta? Regístrate"). */
  footer?: ReactNode
}

/** Centered logo + card column shared by login and register. */
function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-auth">
        <Logo size="auth" />
        <Card className="mt-6">{children}</Card>
        {footer && <p className="mt-5 text-center text-sm text-text-muted">{footer}</p>}
      </div>
    </div>
  )
}

export { AuthLayout }
export type { AuthLayoutProps }
