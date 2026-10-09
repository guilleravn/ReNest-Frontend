# Shared components

Catalog of ReNest's reusable components (light mode), taken from the reference app at <https://renestapp.vercel.app>.
Every component and its variants can be previewed at `/ui-kit` (`src/pages/ui-kit/`): `/ui-kit/primitives`, `/ui-kit/forms` and `/ui-kit/domain`.

**Rule:** check this list before creating a new component. If something almost fits, extend the existing one (a new prop or variant) instead of creating another.
Styles only use the design tokens from `src/index.css` (`bg-surface`, `text-text-muted`, `bg-green-strong`, `shadow-card`, `rounded-xl`, …). No hard-coded colors or sizes.

Text content (price, category, condition, location, status) is passed in as already formatted text. These components hold no business logic.

## `ui/`: primitives

| Component | Used for | Key props |
| --- | --- | --- |
| `Button`, `ButtonLink`, `ButtonAnchor` | Every action. `ButtonLink` = in-app route, `ButtonAnchor` = external link | `variant`: primary · outline · secondary · ghost; `size`: lg (h-12) · md (h-11); `fullWidth` |
| `Badge` | Condition ("Poco uso"), status ("Activo") | `tone`: green · blue · amber · verified · error · neutral; `size`: md · sm |
| `VerifiedBadge` | "Vendedor verificado" | `variant`: soft · overlay (on top of a photo) |
| `CountBadge` | Counters ("1") on nav items and chips | `tone`: green · amber · inverse; `size`; `label` (accessible name, e.g. "1 venta pendiente") |
| `Chip`, `ChipGroup` | Feed filters, category/condition choices, weekdays | `selected`; `variant`: solid · soft; `shape`: pill · square; `size`: sm · md; `count` |
| `SegmentedControl`, `SegmentedItem` | Tabs like "Agendadas / Completadas" | `active`, `icon`, `trailing`, `to` (link) or `onClick` |
| `SearchInput` | Feed search box | `value`, `onChange`, `onClear` |
| `Input`, `Textarea`, `Select` | Form fields (`Select` is a native select; children are `<option>`) | `invalid`; `Select`: `placeholder` |
| `PhoneInput` | Phone field with a fixed calling-code prefix ('+591') before the input | `prefix`, `invalid`, plus native input props |
| `Checkbox`, `CheckboxLink` | Inline checkbox with label; green links inside the label | `checked`, `disabled` |
| `FormField` | Label + control + hint/error | `label`, `aside` ("Opcional"), `hint`, `error` |
| `Avatar` | User photo or initial | `name`, `src`, `size`: sm · md · lg · xl |
| `StepProgress` | "Nuevo artículo · Paso 1 de 2" | `label`, `currentStep`, `totalSteps` |
| `OptionCard`, `OptionCardGroup` | Pickup option (radio), checklist (checkbox) | `selected`, `indicator`: radio · checkbox |
| `StarRating` | Seller rating | `value`, `onChange` |
| `EmptyState` | Empty list or search | `title`, `description`, `icon`, `action` |
| `PageHeader`, `Eyebrow` | Overline + serif title + description; small label inside cards | `overline`, `title`, `description`, `align` |
| `TrustNote` | Shield + small reassurance line ("Coordinas la entrega…") | `children` |
| `Card` | White bordered container with shadow | `className` |
| `TextLink` | Inline brand link ("Regístrate") | router `to` |
| `Logo` | Horizontal ReNest logo | `size`: header · auth |
| `Toast`, `ToastViewport` | Short feedback ("Sesión cerrada") | `tone`: success · error; `onDismiss` |
| `InfoPanel` | Gray summary box ("Vendido a …") | `title`, `children` |
| `StickyActionBar` | Bottom bar with the page's main action. Last child of the page's `min-h-dvh flex-col` wrapper: sticks to the viewport bottom and never covers content; sets `--action-bar-height` for `scroll-padding-bottom` | `width`: narrow · wide; `note` |
| `FloatingActionButton` | "+ Nuevo artículo" | `to`, `icon` |
| `Sheet` | Form panel: bottom sheet on mobile, right drawer on desktop | `open`, `onOpenChange`, `title`, `description`, `footer` |
| `ConfirmDialog` | "¿Confirmar la entrega?" | `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm`, `pending` (saving: buttons disabled, not dismissable) |
| `DropdownMenu*` | Menus (shadcn, base-nova style) | See shadcn docs |

## `layout/`

| Component | Used for | Key props |
| --- | --- | --- |
| `AppHeader` | Top bar: logo, "Mis compras", account menu. Without `user` it shows "Iniciar sesión" | `user` (omit for anonymous), `loading`, `loginTo`, `loginState`, `purchasesCount`, `backTo` (mobile back arrow), `bordered`, `menuItems`, `onLogout` |
| `SessionHeader` | `AppHeader` wired to `useAuth()`: logged-in menu with "Mi cuenta" and logout, or the login button. Use this in pages | `backTo`, `bordered`, `menuItems`, `loginState` |
| `DesktopNav`, `BottomNav` | Inicio / Mis artículos tabs (desktop) and bottom tab bar (mobile) | `activeTo` (optional; omit for no active tab), `items` (`defaultNavItems(pendingSales)`: Pending sales counter on "Mis artículos", from `usePendingSalesCount()`) |
| `RequireAuth`, `PublicOnly` | Route wrappers in `App.tsx`: the first sends anonymous users to login and back (and shows the loading and retry states of the session); the second redirects logged-in users away from login/register | none (layout routes) |
| `AuthLayout` | Login/register screen: logo + card + footer line | `children`, `footer` |
| `PageContainer` | Each page's `<main>` | `width`: narrow (2xl) · medium (5xl) · wide (6xl); `bottomSpace`: default · nav · actions (followed by a `StickyActionBar`) · none |

Pages with `BottomNav` use `<SessionHeader bordered={false} />` + `<DesktopNav />` + `<PageContainer bottomSpace="nav">`.
Detail and flow pages use `<AppHeader backTo="…" />` (bordered) and have no nav.

## `listing/`: domain

| Component | Used for | Key props |
| --- | --- | --- |
| `ProductCard`, `ProductGrid` | Feed card | `title`, `price`, `imageSrc`, `category`, `condition`, `conditionTone`, `location`, `verified`, `to` |
| `ListingRow`, `ListingRowGrid`, `LiveStatus` | Purchase and own-listing rows | `variant`: active · default · completed; `status`, `statusTone`, `detail`, `trailing` |
| `ImageGallery` | Large photo + thumbnails | `images`, `alt` |
| `ProductSummary` | Overline + title + price on detail pages | `title`, `price`, `overline`, `meta`, `description`, `size` |
| `SellerCard` | Seller on the item detail page | `name`, `avatarSrc`, `verified`, `rating`, `reviews`, `location` |
| `PickupSummaryCard` | Other person + agreed pickup + WhatsApp/Map actions | `personRole`, `personName`, `personDetail`, `pickupPlace`, `pickupTime`, `whatsappHref`, `mapHref` |
| `PickupSlotItem`, `PickupSlotList` | Pickup times added by the seller (new listing step 2, pickup times) | `place`, `time`, `onRemove`, `removeDisabled` (trash shown but disabled, e.g. the last pair) |
| `PickupOptionSheet` | "Agregar horario y lugar": place (with the public-place hint), day chips and time range, validated inline (new listing step 2, pickup times) | `open`, `onOpenChange`, `onAdd(option)` (valid, trimmed, days in calendar order; may return a promise: the sheet shows "Agregando…", and if it resolves to a message it stays open and shows it; a rejection shows a generic error) |
| `PhotoUploader` | New listing photos | `photos`, `onAdd(files)`, `onRemove(index)`, `max`, `uploading` (spinner tiles), `coverLabel` ("Portada" on the first), `accept` |
| `ListingDetailsForm` | Photos, title, category, condition, price and description of a listing (new listing step 1; reusable prefilled for editing) | `form` (from `useListingDetailsForm(initialValues)` in `src/lib`, which holds the state, uploads and UX validation), `categories` (loading · error with `onRetry` · ready) |

## Notes

- Import `cn` from `@/lib/utils` (not from `"cn"` directly). It knows that `text-button`, `text-label`, `text-badge` and `text-count` are font sizes. If you add another `--text-*` token, register it there.
- `h2`, `h3` and `h4` use the serif font (`--font-heading`) by default. Add `font-sans` when a heading should be sans (like the product title in `ProductSummary`).
- Icons: `lucide-react`.
- User-facing copy is in Spanish; code, comments and docs are in English.
