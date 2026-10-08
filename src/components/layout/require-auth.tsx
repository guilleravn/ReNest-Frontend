import { Navigate, Outlet, useLocation } from "react-router-dom"
import { loginPath } from "@/lib/redirect"
import { getToken } from "@/lib/session"

/** Route wrapper for actions that need a session: sends to login and back. */
function RequireAuth() {
  const location = useLocation()
  if (!getToken()) {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />
  }
  return <Outlet />
}

export { RequireAuth }
