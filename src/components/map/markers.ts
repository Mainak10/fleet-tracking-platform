import L from 'leaflet'
import type { FacilityType } from '@/types/domain'

/**
 * Leaflet marker icons built as `divIcon`s with inline SVG. Using divIcons
 * (rather than image-based `L.Icon`) keeps the markers crisp, theme-agnostic,
 * and sidesteps the well-known Leaflet + bundler issue where the default
 * marker PNG paths resolve incorrectly — so there's no `L.Icon.Default` patch.
 */

const VEHICLE_SIZE = 30

/**
 * A vehicle marker: a colored disc with a navigation arrow rotated to the
 * vehicle's heading. Amber while en route, emerald once arrived.
 */
export function vehicleIcon(headingDeg: number, arrived: boolean): L.DivIcon {
  const fill = arrived ? '#10b981' : '#f59e0b'
  const ring = arrived ? '#065f46' : '#92400e'
  const html = `
    <div class="fleet-vehicle-marker" style="transform: rotate(${headingDeg}deg);">
      <svg width="${VEHICLE_SIZE}" height="${VEHICLE_SIZE}" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="${fill}" stroke="${ring}" stroke-width="1.5"/>
        <path d="M12 5 L16.5 17 L12 14.2 L7.5 17 Z" fill="#ffffff"/>
      </svg>
    </div>`
  return L.divIcon({
    html,
    className: 'fleet-vehicle-icon',
    iconSize: [VEHICLE_SIZE, VEHICLE_SIZE],
    iconAnchor: [VEHICLE_SIZE / 2, VEHICLE_SIZE / 2],
    popupAnchor: [0, -VEHICLE_SIZE / 2],
  })
}

/** A facility marker: rounded square, distinct color for hubs vs terminals. */
export function facilityIcon(type: FacilityType): L.DivIcon {
  const isHub = type === 'hub'
  const fill = isHub ? '#0ea5e9' : '#64748b'
  const glyph = isHub ? 'H' : 'T'
  const html = `
    <div class="fleet-facility-marker">
      <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
        <text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700"
              font-family="ui-sans-serif, system-ui, sans-serif" fill="#ffffff">${glyph}</text>
      </svg>
    </div>`
  return L.divIcon({
    html,
    className: 'fleet-facility-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  })
}
