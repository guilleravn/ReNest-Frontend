import { SessionHeader } from '@/components/layout/session-header'

export function FeedPage() {
  return (
    <>
      <SessionHeader />
      <main className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p>Feed with search and category filter</p>
      </main>
    </>
  )
}
