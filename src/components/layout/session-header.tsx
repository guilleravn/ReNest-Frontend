import { useNavigate } from "react-router-dom"
import { UserRound } from "lucide-react"
import { AppHeader, type AppHeaderProps } from "@/components/layout/app-header"
import { cityLabel } from "@/lib/cities"
import { useAuth } from "@/lib/auth-context"

type SessionHeaderProps = Omit<AppHeaderProps, "user" | "onLogout">

/**
 * `AppHeader` wired to the session: the logged-in user's menu, or "Iniciar sesión".
 * While the session loads or fails to load it shows neither.
 */
function SessionHeader({ menuItems = [], ...props }: SessionHeaderProps) {
  const { status, user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <AppHeader
      {...props}
      loading={status === "loading" || status === "error"}
      user={
        user && {
          name: user.fullName,
          email: user.email,
          location: cityLabel(user.city),
          avatarSrc: user.avatarUrl ?? undefined,
          verified: user.isVerified,
        }
      }
      menuItems={[
        { label: "Mi cuenta", icon: <UserRound aria-hidden />, onClick: () => navigate("/account") },
        ...menuItems,
      ]}
      onLogout={() => {
        signOut()
        navigate("/feed")
      }}
    />
  )
}

export { SessionHeader }
