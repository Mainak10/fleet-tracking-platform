import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Placeholder } from '@/pages/Placeholder'
import { MasterDataPage } from '@/features/master-data/MasterDataPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'
import { OrdersPage } from '@/pages/admin/OrdersPage'
import { AllocationsPage } from '@/pages/admin/AllocationsPage'
import { LiveMapPage } from '@/pages/admin/LiveMapPage'

/**
 * Application routing. A single shell hosts both personas; the persona switcher
 * navigates between the `/admin` and `/driver` route trees. Pages are filled in
 * across the implementation phases (currently placeholders).
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/admin/map" replace />} />

          {/* Admin */}
          <Route path="admin">
            <Route index element={<Navigate to="/admin/map" replace />} />
            <Route path="map" element={<LiveMapPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="master-data/:entity" element={<MasterDataPage />} />
          </Route>

          {/* Driver */}
          <Route path="driver">
            <Route index element={<Navigate to="/driver/shift" replace />} />
            <Route path="shift" element={<Placeholder eyebrow="Driver" title="My Shift" />} />
            <Route path="map" element={<Placeholder eyebrow="Driver" title="Live Map" />} />
            <Route path="history" element={<Placeholder eyebrow="Driver" title="Shift History" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/map" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
