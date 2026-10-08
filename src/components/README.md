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
| `CountBadge` | Counters ("1") on nav items and chips | `tone`: green · amber · inverse; `size` |
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
| `StickyActionBar` | Fixed bottom bar with the page's main action | `width`: narrow · wide; `note` |
| `FloatingActionButton` | "+ Nuevo artículo" | `to`, `icon` |
| `Sheet` | Form panel: bottom sheet on mobile, right drawer on desktop | `open`, `onOpenChange`, `title`, `description`, `footer` |
| `ConfirmDialog` | "¿Confirmar la entrega?" | `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm` |
| `DropdownMenu*` | Menus (shadcn, base-nova style) | See shadcn docs |

## `layout/`

| Component | Used for | Key props |
| --- | --- | --- |
| `AppHeader` | Top bar: logo, "Mis compras", account menu (only "Entrar" when logged out) | `user` (omit when logged out), `loginTo`, `purchasesCount`, `backTo` (mobile back arrow), `bordered`, `menuItems`, `onLogout` |
| `DesktopNav`, `BottomNav` | Inicio / Mis artículos / Cuenta tabs (desktop) and bottom tab bar (mobile) | `activeTo`, `items` (`defaultNavItems(listingsCount)`) |
| `AuthLayout` | Login/register screen: logo + card + footer line | `children`, `footer` |
| `PageContainer` | Each page's `<main>` | `width`: narrow (2xl) · medium (5xl) · wide (6xl); `bottomSpace`: default · nav · actions (two-button `StickyActionBar`) · none |

Pages with `BottomNav` use `<AppHeader bordered={false} />` + `<DesktopNav />` + `<PageContainer bottomSpace="nav">`.
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
| `PickupSlotItem`, `PickupSlotList` | Pickup times added by the seller | `place`, `time`, `onRemove` |
| `PhotoUploader` | New listing photos | `photos`, `onAdd(files)`, `onRemove(index)`, `max` |

## Notes

- Import `cn` from `@/lib/utils` (not from `"cn"` directly). It knows that `text-button`, `text-label`, `text-badge` and `text-count` are font sizes. If you add another `--text-*` token, register it there.
- `h2`, `h3` and `h4` use the serif font (`--font-heading`) by default. Add `font-sans` when a heading should be sans (like the product title in `ProductSummary`).
- Icons: `lucide-react`.
- User-facing copy is in Spanish; code, comments and docs are in English.
