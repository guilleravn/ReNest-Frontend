import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { BottomNav, DesktopNav } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { useAuth } from '@/lib/auth-context'
import { cityLabel } from '@/lib/cities'

/** Reached only through RequireAuth, which already shows the loading and error states of the session. */
export function AccountPage() {
  const navigate = useNavigate()
  const { user: me, signOut } = useAuth()

  if (!me) return null

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader bordered={false} />
      <DesktopNav activeTo="/account" />
      <PageContainer width="narrow" bottomSpace="nav" className="space-y-6">
        <PageHeader title="Cuenta" />

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

        <Button variant="secondary" fullWidth onClick={handleLogout}>
          <LogOut aria-hidden />
          Cerrar sesión
        </Button>
      </PageContainer>
      <BottomNav activeTo="/account" />
    </div>
  )
}
