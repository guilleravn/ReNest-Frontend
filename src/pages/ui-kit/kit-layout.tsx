import type { ReactNode } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { SegmentedControl, SegmentedItem } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

// Visual catalog of the shared components, grouped in three pages.

export const img = (name: string) => `https://renestapp.vercel.app/seed/${name}`

const pages = [
  { to: "/ui-kit/primitives", label: "Primitives" },
  { to: "/ui-kit/forms", label: "Forms & overlays" },
  { to: "/ui-kit/domain", label: "Domain & layout" },
]

export function KitLayout({
  activeTo,
  title,
  description,
  children,
}: {
  activeTo: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader user={{ name: "Tú", email: "tu@renest.app", verified: true }} purchasesCount={1} />
      <PageContainer className="space-y-12 pb-40">
        <div className="space-y-4">
          <SegmentedControl>
            {pages.map((p) => (
              <SegmentedItem key={p.to} to={p.to} active={p.to === activeTo}>
                {p.label}
              </SegmentedItem>
            ))}
          </SegmentedControl>
          <PageHeader overline="UI kit" title={title} description={description} />
        </div>
        {children}
      </PageContainer>
    </div>
  )
}

/** One component: name, what varies vs. what stays fixed, and its demos. */
export function Section({
  name,
  varies,
  fixed,
  children,
}: {
  name: string
  varies?: ReactNode
  fixed?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div>
        <h3 className="font-mono text-lg text-foreground">{`<${name} />`}</h3>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
          {varies && (
            <>
              <dt className="font-semibold text-green-strong">Varies</dt>
              <dd className="text-text-muted">{varies}</dd>
            </>
          )}
          {fixed && (
            <>
              <dt className="font-semibold text-text-subtle">Always the same</dt>
              <dd className="text-text-muted">{fixed}</dd>
            </>
          )}
        </dl>
      </div>
      {children}
    </section>
  )
}

/** Grid of demos. */
export function Demos({
  cols = 3,
  children,
}: {
  cols?: 1 | 2 | 3 | 4
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {children}
    </div>
  )
}

/** A single variant with the props that produce it. */
export function Demo({
  props,
  children,
  className,
  surface = "plain",
}: {
  props: string
  children: ReactNode
  className?: string
  /** `muted` gives a darker backdrop (for overlay badges etc). */
  surface?: "plain" | "muted"
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <code className="font-mono text-xs break-words text-text-subtle">{props}</code>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-center gap-3 rounded-xl border border-dashed border-border-strong p-4",
          surface === "muted" ? "bg-text-muted" : "bg-background",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
