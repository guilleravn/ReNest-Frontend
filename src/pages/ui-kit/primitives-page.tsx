import { useState } from "react"
import { Inbox, Plus, Tags, House } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Badge, VerifiedBadge } from "@/components/ui/badge"
import { Button, ButtonAnchor, ButtonLink } from "@/components/ui/button"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { CountBadge } from "@/components/ui/count-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { InfoPanel } from "@/components/ui/info-panel"
import { Eyebrow, PageHeader } from "@/components/ui/page-header"
import { SegmentedControl, SegmentedItem } from "@/components/ui/segmented-control"
import { Demo, Demos, KitLayout, Section, img } from "./kit-layout"

const tones = ["green", "blue", "amber", "verified", "error", "neutral"] as const

export function UiKitPrimitivesPage() {
  const [solid, setSolid] = useState("Hogar")
  const [soft, setSoft] = useState<string[]>(["Poco uso"])
  const [tab, setTab] = useState("agendadas")

  return (
    <KitLayout
      activeTo="/ui-kit/primitives"
      title="Primitives"
      description="Buttons, badges, chips, tabs and text blocks."
    >
      <Section
        name="Button"
        varies="variant (color/border), size (height and font size), fullWidth, disabled, content (icon + text)."
        fixed="rounded-xl radius, semibold weight, green focus ring, 60% opacity when disabled."
      >
        <Demos cols={4}>
          {(["primary", "outline", "secondary", "ghost"] as const).map((variant) => (
            <Demo key={variant} props={`variant="${variant}"`}>
              <Button variant={variant}>Agendar recogida</Button>
            </Demo>
          ))}
          {(["primary", "outline", "secondary", "ghost"] as const).map((variant) => (
            <Demo key={variant} props={`variant="${variant}" size="md"`}>
              <Button variant={variant} size="md">
                WhatsApp
              </Button>
            </Demo>
          ))}
          {(["primary", "outline", "secondary", "ghost"] as const).map((variant) => (
            <Demo key={variant} props={`variant="${variant}" disabled`}>
              <Button variant={variant} disabled>
                Confirmar
              </Button>
            </Demo>
          ))}
        </Demos>
        <Demos cols={3}>
          <Demo props="fullWidth">
            <Button fullWidth>Continuar</Button>
          </Demo>
          <Demo props="icon as children">
            <Button variant="outline" fullWidth>
              <Plus /> Agregar horario y lugar
            </Button>
          </Demo>
          <Demo props='<ButtonLink to="/feed"> / <ButtonAnchor href="…">'>
            <ButtonLink to="/feed" variant="outline" size="md">
              Internal link
            </ButtonLink>
            <ButtonAnchor href="https://wa.me/" target="_blank" variant="secondary" size="md">
              External link
            </ButtonAnchor>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Badge"
        varies="tone (background and text color), size (md: condition on cards · sm: status on rows, smaller and capitalized)."
        fixed="Pill shape (rounded-full)."
      >
        <Demos cols={2}>
          <Demo props='size="md" (default) · tone=…'>
            {tones.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Demo>
          <Demo props='size="sm" · tone=…'>
            {tones.map((tone) => (
              <Badge key={tone} tone={tone} size="sm">
                {tone}
              </Badge>
            ))}
          </Demo>
        </Demos>
      </Section>

      <Section
        name="VerifiedBadge"
        varies="variant (soft: inside cards · overlay: on top of a photo, translucent and smaller), children (text)."
        fixed="Check icon and verified green color."
      >
        <Demos cols={3}>
          <Demo props='variant="soft" (default)'>
            <VerifiedBadge />
          </Demo>
          <Demo props='variant="overlay"' surface="muted">
            <VerifiedBadge variant="overlay" />
          </Demo>
          <Demo props='children="Comprador verificado"'>
            <VerifiedBadge>Comprador verificado</VerifiedBadge>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="CountBadge"
        varies="tone (green: notification · amber: attention · inverse: inside a green chip), size (md grows with long numbers · sm is a fixed circle)."
        fixed="Circle, bold text."
      >
        <Demos cols={3}>
          <Demo props='tone="green" (default)'>
            <CountBadge>1</CountBadge>
            <CountBadge>12</CountBadge>
            <CountBadge>99+</CountBadge>
          </Demo>
          <Demo props='tone="amber" · size="md" / "sm"'>
            <CountBadge tone="amber">3</CountBadge>
            <CountBadge tone="amber" size="sm">
              3
            </CountBadge>
          </Demo>
          <Demo props='tone="inverse" (on green)'>
            <span className="rounded-full bg-green-strong p-2">
              <CountBadge tone="inverse" size="sm">
                1
              </CountBadge>
            </span>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Avatar"
        varies="size (sm 32px · md 36px · lg 40px · xl 44px), src (photo) or just name (initial)."
        fixed="Circle with gray background when there is no photo."
      >
        <Demos cols={2}>
          <Demo props='name="Tú" · size=sm/md/lg/xl'>
            {(["sm", "md", "lg", "xl"] as const).map((size) => (
              <Avatar key={size} name="Tú" size={size} />
            ))}
          </Demo>
          <Demo props='name="Priya Mehta" src="…" · size=sm/md/lg/xl'>
            {(["sm", "md", "lg", "xl"] as const).map((size) => (
              <Avatar key={size} name="Priya Mehta" src={img("avatars/priya-mehta.jpg")} size={size} />
            ))}
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Chip"
        varies="selected, variant (selected look: solid = filled green · soft = light green), size (sm/md: height), shape (pill/square), count, disabled."
        fixed="Unselected they all look the same: gray border, white background, gray text."
      >
        <Demos cols={2}>
          <Demo props='variant="solid" (default) · size="sm" — feed filters'>
            <ChipGroup>
              {["Muebles", "Electrónica", "Hogar"].map((c) => (
                <Chip key={c} selected={solid === c} onClick={() => setSolid(c)}>
                  {c}
                </Chip>
              ))}
            </ChipGroup>
          </Demo>
          <Demo props='variant="soft" · size="md" — form options (multi)'>
            <ChipGroup>
              {["Como nuevo", "Poco uso", "Muy usado"].map((c) => (
                <Chip
                  key={c}
                  variant="soft"
                  size="md"
                  selected={soft.includes(c)}
                  onClick={() =>
                    setSoft((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
                  }
                >
                  {c}
                </Chip>
              ))}
            </ChipGroup>
          </Demo>
          <Demo props='shape="square" variant="soft" — days · <ChipGroup gap="sm">'>
            <ChipGroup gap="sm">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
                <Chip key={d} shape="square" variant="soft" selected={i < 2}>
                  {d}
                </Chip>
              ))}
            </ChipGroup>
          </Demo>
          <Demo props="count={1} · selected false / true · variant solid / soft">
            <Chip count={1}>En proceso</Chip>
            <Chip count={1} selected>
              En proceso
            </Chip>
            <Chip count={1} variant="soft" selected>
              En proceso
            </Chip>
          </Demo>
          <Demo props="disabled">
            <Chip disabled>Muebles</Chip>
            <Chip disabled selected>
              Hogar
            </Chip>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="SegmentedControl + SegmentedItem"
        varies="active, icon, trailing (counter), to (link) or onClick (button), number of items."
        fixed="Rounded gray container; the active item is white with a shadow."
      >
        <Demos cols={2}>
          <Demo props="2 items with onClick" className="block">
            <SegmentedControl>
              {["agendadas", "completadas"].map((t) => (
                <SegmentedItem key={t} active={tab === t} onClick={() => setTab(t)} className="capitalize">
                  {t}
                </SegmentedItem>
              ))}
            </SegmentedControl>
          </Demo>
          <Demo props="icon + trailing={<CountBadge>}" className="block">
            <SegmentedControl>
              <SegmentedItem active icon={<House />}>
                Inicio
              </SegmentedItem>
              <SegmentedItem icon={<Tags />} trailing={<CountBadge>1</CountBadge>}>
                Mis artículos
              </SegmentedItem>
            </SegmentedControl>
          </Demo>
          <Demo props="3 items" className="block">
            <SegmentedControl>
              <SegmentedItem>Día</SegmentedItem>
              <SegmentedItem active>Semana</SegmentedItem>
              <SegmentedItem>Mes</SegmentedItem>
            </SegmentedControl>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="PageHeader / Eyebrow"
        varies="overline, description, align (left/center)."
        fixed="Serif title (text-2xl). Eyebrow: small uppercase text for cards."
      >
        <Demos cols={2}>
          <Demo props='title="Recogidas y compras"' className="block">
            <PageHeader title="Recogidas y compras" />
          </Demo>
          <Demo props="title + description" className="block">
            <PageHeader title="Encuentra algo con historia" description="10 artículos cerca de ti." />
          </Demo>
          <Demo props="overline + title + description" className="block">
            <PageHeader
              overline="Agendar recogida"
              title="Elige un horario y lugar"
              description="Opciones de Priya Mehta para “Aparador de teca”."
            />
          </Demo>
          <Demo props='align="center"' className="block">
            <PageHeader
              align="center"
              overline="Califica al vendedor"
              title="¿Cómo te fue con Ana Ribeiro?"
              description="Tu calificación ayuda a otras personas."
            />
          </Demo>
          <Demo props="<Eyebrow>Vendedor</Eyebrow>">
            <Eyebrow>Vendedor</Eyebrow>
            <Eyebrow>Recogida acordada</Eyebrow>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="InfoPanel"
        varies="title, children (secondary text)."
        fixed="Light gray box with border and xl radius."
      >
        <Demos cols={3}>
          <Demo props="title + children" className="block">
            <InfoPanel title="Vendido a Mateo Rivas">Palermo, Buenos Aires · 26 sep 2026</InfoPanel>
          </Demo>
          <Demo props="title only" className="block">
            <InfoPanel title="Pago acordado en efectivo" />
          </Demo>
          <Demo props="children only" className="block">
            <InfoPanel>Recuerda revisar el artículo antes de pagar.</InfoPanel>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="EmptyState"
        varies="icon, description, action."
        fixed="Centered, bold title, 40px gray icon."
      >
        <Demos cols={3}>
          <Demo props="title + description (default icon)" className="block">
            <EmptyState
              className="py-6"
              title="Todavía no hay coincidencias"
              description="Ningún artículo con “zzzz” en Hogar."
            />
          </Demo>
          <Demo props="icon={<Inbox />}" className="block">
            <EmptyState className="py-6" icon={<Inbox />} title="Sin compras completadas" />
          </Demo>
          <Demo props="action={<Button />}" className="block">
            <EmptyState
              className="py-6"
              title="Aún no vendes nada"
              description="Publica tu primer artículo."
              action={<Button size="md">Nuevo artículo</Button>}
            />
          </Demo>
        </Demos>
      </Section>
    </KitLayout>
  )
}
