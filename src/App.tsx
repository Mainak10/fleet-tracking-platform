import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { MasterDataPage } from '@/features/master-data/MasterDataPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'
import { OrdersPage } from '@/pages/admin/OrdersPage'
import { AllocationsPage } from '@/pages/admin/AllocationsPage'
import { LiveMapPage } from '@/pages/admin/LiveMapPage'
import { ShiftPage } from '@/pages/driver/ShiftPage'
import { DriverMapPage } from '@/pages/driver/DriverMapPage'
import { HistoryPage } from '@/pages/driver/HistoryPage'

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
            <Route path="shift" element={<ShiftPage />} />
            <Route path="map" element={<DriverMapPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/map" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
