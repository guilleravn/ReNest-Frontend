import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicOnly, RequireAuth } from '@/components/layout/route-guards'
import { FeedPage } from '@/pages/feed-page'
import { ItemDetailPage } from '@/pages/item-detail-page'
import { ItemSchedulePickupPage } from '@/pages/item-schedule-pickup-page'
import { ItemContactPage } from '@/pages/item-contact-page'
import { PurchasesPage } from '@/pages/purchases-page'
import { PurchaseRecapPage } from '@/pages/purchase-recap-page'
import { PurchaseChecklistPage } from '@/pages/purchase-checklist-page'
import { PurchaseRatePage } from '@/pages/purchase-rate-page'
import { PurchaseThanksPage } from '@/pages/purchase-thanks-page'
import { ListingsPage } from '@/pages/listings-page'
import { NewListingPage } from '@/pages/new-listing-page'
import { ListingDetailPage } from '@/pages/listing-detail-page'
import { ListingPickupTimesPage } from '@/pages/listing-pickup-times-page'
import { ListingSaleCompletedPage } from '@/pages/listing-sale-completed-page'
import { ListingPublishedPage } from '@/pages/listing-published-page'
import { SaleDetailPage } from '@/pages/sale-detail-page'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import { AccountPage } from '@/pages/account-page'
import { UiKitPrimitivesPage } from '@/pages/ui-kit/primitives-page'
import { UiKitFormsPage } from '@/pages/ui-kit/forms-page'
import { UiKitDomainPage } from '@/pages/ui-kit/domain-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/items/:id" element={<ItemDetailPage />} />
      {/* Every action needs a session; browsing stays public */}
      <Route element={<RequireAuth />}>
        <Route path="/items/:id/pickup" element={<ItemSchedulePickupPage />} />
        <Route path="/items/:id/contact" element={<ItemContactPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/:id" element={<PurchaseRecapPage />} />
        <Route path="/purchases/:id/checklist" element={<PurchaseChecklistPage />} />
        <Route path="/purchases/:id/rate" element={<PurchaseRatePage />} />
        <Route path="/purchases/:id/thanks" element={<PurchaseThanksPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/new" element={<NewListingPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/listings/:id/pickup-times" element={<ListingPickupTimesPage />} />
        <Route path="/listings/:id/sale-completed" element={<ListingSaleCompletedPage />} />
        <Route path="/listings/:id/published" element={<ListingPublishedPage />} />
        <Route path="/sales/:reservationId" element={<SaleDetailPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>
      {/* Shared components catalog */}
      <Route path="/ui-kit" element={<Navigate to="/ui-kit/primitives" replace />} />
      <Route path="/ui-kit/primitives" element={<UiKitPrimitivesPage />} />
      <Route path="/ui-kit/forms" element={<UiKitFormsPage />} />
      <Route path="/ui-kit/domain" element={<UiKitDomainPage />} />
    </Routes>
  )
}

export default App
