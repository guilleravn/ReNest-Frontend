import { SearchX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/** Any URL no route matches. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader />
      <PageContainer width="narrow">
        <EmptyState
          icon={<SearchX aria-hidden />}
          title="No encontramos esta página"
          description="Puede que el enlace esté mal escrito o que la página ya no exista."
          action={
            <ButtonLink to="/feed" size="md" variant="secondary">
              Ver artículos
            </ButtonLink>
          }
        />
      </PageContainer>
    </div>
  )
}
