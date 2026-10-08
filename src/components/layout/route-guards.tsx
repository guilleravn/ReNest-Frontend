import { Navigate, Outlet, useLocation } from "react-router-dom"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuth } from "@/lib/auth-context"

const DEFAULT_ROUTE = "/feed"

type ReturnState = { from?: unknown } | null

/** Only same-app paths are accepted, so a crafted state can't redirect elsewhere. */
function safeReturnPath(state: ReturnState): string {
  const from = state?.from
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/\\")
    ? from
    : DEFAULT_ROUTE
}

function SessionLoading() {
  return (
    <main
      role="status"
      className="flex min-h-svh items-center justify-center text-sm text-text-muted"
    >
      Cargando sesión…
    </main>
  )
}

function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <EmptyState
        icon={<CircleAlert aria-hidden />}
        title="No pudimos cargar tu sesión"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={
          <Button size="md" variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        }
      />
    </main>
  )
}

/**
 * Routes that need a session. Anonymous users go to login and come back after;
 * if the session cannot be loaded they can retry, and stay logged in.
 */
function RequireAuth() {
  const { status, retry } = useAuth()
  const location = useLocation()

  if (status === "loading") return <SessionLoading />
  if (status === "error") return <SessionError onRetry={retry} />
  if (status === "anonymous") {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  return <Outlet />
}

/** Login and register: a logged-in user is sent back to where they came from. */
function PublicOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "loading") return <SessionLoading />
  if (status === "authenticated") {
    return <Navigate to={safeReturnPath(location.state as ReturnState)} replace />
  }
  return <Outlet />
}

export { RequireAuth, PublicOnly }
