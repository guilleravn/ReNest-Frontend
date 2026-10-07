import { AppHeader } from "@/components/layout/app-header"
import { AuthLayout } from "@/components/layout/auth-layout"
import { BottomNav, DesktopNav, defaultNavItems } from "@/components/layout/app-nav"
import { PageContainer } from "@/components/layout/page-container"
import { ImageGallery } from "@/components/listing/image-gallery"
import { ListingRow } from "@/components/listing/listing-row"
import { PickupSummaryCard } from "@/components/listing/pickup-summary-card"
import { ProductCard } from "@/components/listing/product-card"
import { ProductSummary } from "@/components/listing/product-summary"
import { SellerCard } from "@/components/listing/seller-card"
import { Badge } from "@/components/ui/badge"
import { TextLink } from "@/components/ui/text-link"
import { Demo, Demos, KitLayout, Section, img } from "./kit-layout"

// Sticky/fixed bars are made static inside demos so they stay in their box.
const staticHeader = "block p-0 overflow-hidden [&_header]:static"
const staticBottomNav = "block p-0 overflow-hidden [&_nav]:static! [&_nav]:block!"

export function UiKitDomainPage() {
  return (
    <KitLayout
      activeTo="/ui-kit/domain"
      title="Domain & layout"
      description="Item cards, detail, pickup and page structure."
    >
      <Section
        name="ProductCard"
        varies="title, price, imageSrc, category, condition + conditionTone (pill color), location, verified (pill on the photo)."
        fixed="4:3 photo that zooms on hover, title up to 2 lines, large bold price, shadow on hover."
      >
        <Demos cols={4}>
          <Demo props='verified · conditionTone="blue" (default)' className="block p-2">
            <ProductCard
              to="/items/i1"
              title="Aparador de teca mediados de siglo"
              price="$185"
              imageSrc={img("wooden-dresser.jpg")}
              category="Muebles"
              condition="Poco uso"
              location="Roma Norte, CDMX"
              verified
            />
          </Demo>
          <Demo props='conditionTone="green" · no verified' className="block p-2">
            <ProductCard
              to="/items/i2"
              title="Sillón de cuero"
              price="$240"
              imageSrc={img("leather-armchair.jpg")}
              category="Muebles"
              condition="Como nuevo"
              conditionTone="green"
              location="Palermo, Buenos Aires"
            />
          </Demo>
          <Demo props='conditionTone="amber" · long title' className="block p-2">
            <ProductCard
              to="/items/i3"
              title="Escritorio eléctrico regulable con memoria de altura y bandeja para cables incluida"
              price="$160"
              imageSrc={img("standing-desk.jpeg")}
              category="Electrónica"
              condition="Muy usado"
              conditionTone="amber"
              location="Providencia, Santiago"
            />
          </Demo>
          <Demo props="no category, condition or location" className="block p-2">
            <ProductCard
              to="/items/i9"
              title="Olla multiusos Instant Pot, 5,7 L"
              price="$45"
              imageSrc={img("instant-pot.jpg")}
            />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="ListingRow"
        varies="variant (active: green with pulsing status and side bar · default: white with pill and chevron · completed: gray with black-and-white photo), status, statusTone, detail, trailing."
        fixed="64px square thumbnail, single-line title truncated with '…', price below."
      >
        <Demos cols={3}>
          <Demo props='variant="active" status + detail' className="block">
            <ListingRow
              to="/purchases/pu1"
              variant="active"
              status="Recogida agendada"
              title="Tornamesa vintage por correa"
              price="$130"
              imageSrc={img("vintage-turntable.jpg")}
              detail="Metrô Faria Lima, salida 2 · los miércoles y viernes, 18:30–20:30"
            />
          </Demo>
          <Demo props='variant="active" no detail' className="block">
            <ListingRow
              to="/listings/l2"
              variant="active"
              status="Venta en proceso"
              title="Nintendo Switch con dock"
              price="$210"
              imageSrc={img("nintendo-2.jpg")}
            />
          </Demo>
          <Demo props='variant="default" (statusTone="verified")' className="block">
            <ListingRow
              to="/listings/l1"
              status="activo"
              title="Cómoda mediados de siglo, seis cajones"
              price="$90"
              imageSrc={img("wooden-dresser-2.jpg")}
            />
          </Demo>
          <Demo props='variant="default" statusTone="amber"' className="block">
            <ListingRow
              to="/listings/l1"
              status="pausado"
              statusTone="amber"
              title="Vajilla de cerámica, 8 piezas"
              price="$30"
              imageSrc={img("wooden-dresser-3.jpg")}
            />
          </Demo>
          <Demo props='variant="default" trailing="★ 4"' className="block">
            <ListingRow
              to="/listings/l1"
              status="activo"
              title="Sillón de cuero"
              price="$240"
              imageSrc={img("leather-armchair.jpg")}
              trailing="★ 4"
            />
          </Demo>
          <Demo props='variant="completed" trailing="★ 5"' className="block">
            <ListingRow
              to="/purchases/pu2"
              variant="completed"
              status="Completado"
              title="Olla multiusos Instant Pot, 5,7 L"
              price="$45"
              imageSrc={img("instant-pot.jpg")}
              trailing="★ 5"
            />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="ImageGallery"
        varies="images (with a single photo no thumbnails are shown)."
        fixed="4:3 main photo with 2xl radius; the active thumbnail has a green border."
      >
        <Demos cols={2}>
          <Demo props="images={[…3]}" className="block">
            <ImageGallery
              alt="Tornamesa"
              images={[img("vintage-turntable.jpg"), img("vintage-turntable-2.jpeg"), img("vintage-turntable-3.jpg")]}
            />
          </Demo>
          <Demo props="images={[…1]}" className="block">
            <ImageGallery alt="Sillón" images={[img("leather-armchair.jpg")]} />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="ProductSummary"
        varies="overline, meta, description, size (lg = bigger price on desktop, for the buyer item detail)."
        fixed="Bold sans title (2xl / 3xl on desktop), bold price."
      >
        <Demos cols={3}>
          <Demo props='size="lg" overline + description' className="block">
            <ProductSummary
              size="lg"
              overline="Muebles · Poco uso"
              title="Aparador de teca mediados de siglo"
              price="$185"
              description="Teca maciza, tres cajones y un mueble con puerta corrediza."
            />
          </Demo>
          <Demo props='size="md" overline + meta' className="block">
            <ProductSummary
              overline="Recogida agendada"
              title="Tornamesa vintage por correa"
              price="$130"
              meta="Electrónica · Poco uso"
            />
          </Demo>
          <Demo props="title + price only" className="block">
            <ProductSummary title="Sillón de cuero" price="$75" />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="SellerCard"
        varies="verified (check next to the name + pill), rating + reviews, location, avatarSrc, extra badges."
        fixed="Light gray box with a 40px avatar and bold name."
      >
        <Demos cols={2}>
          <Demo props="everything" className="block">
            <SellerCard
              name="Priya Mehta"
              avatarSrc={img("avatars/priya-mehta.jpg")}
              verified
              rating="4.9"
              reviews="63 reseñas"
              location="Roma Norte, CDMX"
            />
          </Demo>
          <Demo props="no verified, no photo" className="block">
            <SellerCard name="Mateo Rivas" rating="4.2" reviews="8 reseñas" location="Palermo, Buenos Aires" />
          </Demo>
          <Demo props="name only" className="block">
            <SellerCard name="Valentina Cruz" />
          </Demo>
          <Demo props="verified + badges={<Badge />}" className="block">
            <SellerCard
              name="Ana Ribeiro"
              avatarSrc={img("avatars/ana-ribeiro.jpg")}
              verified
              rating="4.95"
              location="Pinheiros, São Paulo"
              badges={<Badge tone="blue">Responde rápido</Badge>}
            />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="PickupSummaryCard"
        varies="personRole, personName, personAvatarSrc, personVerified, personDetail, pickupLabel, pickupPlace, pickupTime, whatsappHref / mapHref (each button shows only when its link is set)."
        fixed="3 blocks: person, pickup (gray background), actions."
      >
        <Demos cols={3}>
          <Demo props='personRole="Vendedor" verified + both links' className="block">
            <PickupSummaryCard
              personRole="Vendedor"
              personName="Ana Ribeiro"
              personAvatarSrc={img("avatars/ana-ribeiro.jpg")}
              personVerified
              personDetail="★ 4.95 (80) · Pinheiros, São Paulo"
              pickupPlace="Metrô Faria Lima, salida 2"
              pickupTime="los miércoles y viernes · 18:30–20:30"
              whatsappHref="https://wa.me/"
              mapHref="https://www.google.com/maps"
            />
          </Demo>
          <Demo props='personRole="Comprador" whatsappHref only' className="block">
            <PickupSummaryCard
              personRole="Comprador"
              personName="Valentina Cruz"
              personDetail="Condesa, CDMX"
              pickupPlace="Café Nin, Havre 73"
              pickupTime="los martes y jueves · 16:00–19:00"
              whatsappHref="https://wa.me/"
            />
          </Demo>
          <Demo props='no links · pickupLabel="Recogida propuesta"' className="block">
            <PickupSummaryCard
              personRole="Comprador"
              personName="Mateo Rivas"
              pickupLabel="Recogida propuesta"
              pickupPlace="Parque México"
              pickupTime="los lunes · 18:00–20:00"
            />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="AppHeader"
        varies="bordered, backTo (back arrow, mobile only), purchasesCount, user (avatarSrc, verified, email, location), menuItems, onLogout."
        fixed="Logo on the left, 'Mis compras' and avatar menu on the right, 64px tall. (Sticky to the top in the app.)"
      >
        <Demos cols={1}>
          <Demo props="bordered (default) · purchasesCount={1} · onLogout" className={staticHeader}>
            <AppHeader user={{ name: "Tú", email: "tu@renest.app", verified: true }} purchasesCount={1} onLogout={() => {}} />
          </Demo>
          <Demo props="bordered={false} · no purchasesCount · user with avatarSrc" className={staticHeader}>
            <AppHeader bordered={false} user={{ name: "Priya Mehta", avatarSrc: img("avatars/priya-mehta.jpg") }} />
          </Demo>
          <Demo props='backTo="/feed" (shrink the window to see the arrow)' className={staticHeader}>
            <AppHeader backTo="/feed" user={{ name: "Tú" }} purchasesCount={3} />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="DesktopNav / BottomNav"
        varies="activeTo (active tab), items (defaultNavItems(count) shows the counter on 'Mis artículos')."
        fixed="DesktopNav only shows from sm up; BottomNav only on mobile (forced visible here)."
      >
        <Demos cols={2}>
          <Demo props='<DesktopNav activeTo="/feed" items={defaultNavItems(1)} />' className="block p-0 pt-2">
            <DesktopNav activeTo="/feed" items={defaultNavItems(1)} />
          </Demo>
          <Demo props='<DesktopNav activeTo="/listings" />' className="block p-0 pt-2">
            <DesktopNav activeTo="/listings" />
          </Demo>
          <Demo props='<BottomNav activeTo="/feed" items={defaultNavItems(1)} />' className={staticBottomNav}>
            <BottomNav activeTo="/feed" items={defaultNavItems(1)} />
          </Demo>
          <Demo props='<BottomNav activeTo="/listings" />' className={staticBottomNav}>
            <BottomNav activeTo="/listings" />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="PageContainer"
        varies="width (narrow 672px · medium 1024px · wide 1152px), bottomSpace (default · nav: leaves room for the BottomNav · none)."
        fixed="Centered, 16px side padding (24px on desktop)."
      >
        <Demos cols={1}>
          {(["narrow", "medium", "wide"] as const).map((width) => (
            <Demo key={width} props={`width="${width}"`} className="block p-0">
              <PageContainer width={width} className="py-3 sm:py-3">
                <div className="rounded-lg bg-green-surface py-2 text-center text-sm text-green-strong">
                  {width}
                </div>
              </PageContainer>
            </Demo>
          ))}
        </Demos>
      </Section>

      <Section
        name="AuthLayout"
        varies="children (card content), footer (line under the card)."
        fixed="Gray background, centered column, auth logo on top, content inside a Card."
      >
        <Demos cols={1}>
          <Demo props="children + footer" className="block p-0 overflow-hidden [&>div]:min-h-0">
            <AuthLayout
              footer={
                <>
                  ¿No tienes cuenta? <TextLink to="/register">Regístrate</TextLink>
                </>
              }
            >
              <p className="text-sm text-text-muted">Formulario de inicio de sesión.</p>
            </AuthLayout>
          </Demo>
        </Demos>
      </Section>
    </KitLayout>
  )
}
