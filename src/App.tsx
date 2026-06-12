import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Placeholder } from '@/pages/Placeholder'

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
            <Route path="map" element={<Placeholder eyebrow="Admin" title="Live Fleet Map" />} />
            <Route path="orders" element={<Placeholder eyebrow="Admin" title="Orders" />} />
            <Route path="allocations" element={<Placeholder eyebrow="Admin" title="Vehicle Allocation" />} />
            <Route path="inventory" element={<Placeholder eyebrow="Admin" title="Inventory" />} />
            <Route
              path="master-data/:entity"
              element={<Placeholder eyebrow="Admin" title="Master Data" />}
            />
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
