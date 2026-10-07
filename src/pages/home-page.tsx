import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">ReNest</h1>
      <Button>Get started</Button>
    </main>
  )
}
