import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, LogOut } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav, DesktopNav } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getMe, logout, type Me } from '@/lib/auth'
import { cityLabel } from '@/lib/cities'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; me: Me }

export function AccountPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getMe().then(
      (me) => current && setState({ status: 'ready', me }),
      () => current && setState({ status: 'error' }),
    )
    return () => {
      current = false
    }
  }, [attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const me = state.status === 'ready' ? state.me : null

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        user={{ name: me?.fullName ?? '', email: me?.email, verified: me?.isVerified }}
        bordered={false}
        onLogout={handleLogout}
      />
      <DesktopNav activeTo="/account" />
      <PageContainer width="narrow" bottomSpace="nav" className="space-y-6">
        <PageHeader title="Cuenta" />

        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando tu cuenta…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar tu cuenta"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button size="md" variant="secondary" onClick={retry}>
                Reintentar
              </Button>
            }
          />
        )}

        {me && (
          <Card>
            <section aria-labelledby="account-details">
              <div className="flex items-center gap-3">
                <Avatar name={me.fullName} size="xl" />
                <h2 id="account-details" className="text-base font-semibold text-foreground">
                  Tus datos
                </h2>
              </div>
              <dl className="mt-5 grid gap-4 text-sm">
                {[
                  ['Nombre', me.fullName],
                  ['Correo', me.email],
                  ['Teléfono', me.phoneE164],
                  ['Ciudad', cityLabel(me.city)],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-0.5">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="font-medium break-words text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </Card>
        )}

        <Button variant="secondary" fullWidth onClick={handleLogout}>
          <LogOut aria-hidden />
          Cerrar sesión
        </Button>
      </PageContainer>
      <BottomNav activeTo="/account" />
    </div>
  )
}
