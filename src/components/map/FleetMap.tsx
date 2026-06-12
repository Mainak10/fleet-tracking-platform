import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Driver, Facility, Order, Vehicle, VehiclePosition } from '@/types/domain'
import { useUiStore } from '@/store'
import { facilityIcon, vehicleIcon } from './markers'

/** A vehicle currently on the road, joined with the entities it relates to. */
export interface ActiveVehicle {
  position: VehiclePosition
  vehicle: Vehicle
  driver?: Driver
  order?: Order
  destination?: Facility
}

/** A request to recenter the map; `token` changes per click so repeat locates fire. */
export interface FocusRequest {
  vehicleId: string
  token: number
}

export interface FleetMapProps {
  facilities: Facility[]
  vehicles: ActiveVehicle[]
  /** When set, the map recenters on this vehicle (panel "locate" action). */
  focus?: FocusRequest | null
}

/** Geographic center + zoom for the seeded San Francisco Bay Area fleet. */
const BAY_AREA_CENTER: [number, number] = [37.62, -122.13]
const DEFAULT_ZOOM = 9

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

/** Pans the map to a vehicle when the panel asks to locate it. */
function FocusController({ vehicles, focus }: Pick<FleetMapProps, 'vehicles' | 'focus'>) {
  const map = useMap()
  useEffect(() => {
    if (!focus) return
    const target = vehicles.find((v) => v.vehicle.id === focus.vehicleId)
    if (target) {
      const { lat, lng } = target.position.coordinates
      map.flyTo([lat, lng], Math.max(map.getZoom(), 11), { duration: 0.6 })
    }
    // Re-run only on an explicit focus request (token), not every position tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.token])
  return null
}

export function FleetMap({ facilities, vehicles, focus }: FleetMapProps) {
  const theme = useUiStore((s) => s.theme)

  return (
    <MapContainer
      center={BAY_AREA_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      {/* Keyed by theme so the basemap swaps cleanly on dark-mode toggle. */}
      <TileLayer key={theme} url={TILES[theme]} attribution={TILE_ATTRIBUTION} />

      {facilities.map((f) => (
        <Marker
          key={f.id}
          position={[f.coordinates.lat, f.coordinates.lng]}
          icon={facilityIcon(f.type)}
        >
          <Popup>
            <div className="space-y-0.5">
              <p className="font-semibold">{f.name}</p>
              <p className="capitalize text-slate-500">{f.type}</p>
              <p className="text-slate-500">{f.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {vehicles.map((v) => {
        const arrived = v.position.progress >= 1
        return (
          <Marker
            key={v.vehicle.id}
            position={[v.position.coordinates.lat, v.position.coordinates.lng]}
            icon={vehicleIcon(v.position.heading, arrived)}
            zIndexOffset={1000}
          >
            <Tooltip direction="top" offset={[0, -16]} opacity={1}>
              {v.vehicle.registration} · {v.driver?.name ?? 'Unassigned'}
            </Tooltip>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{v.vehicle.registration}</p>
                <p className="text-slate-500">{v.vehicle.type}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-slate-600">
                  <dt className="text-slate-400">Driver</dt>
                  <dd>{v.driver?.name ?? '—'}</dd>
                  <dt className="text-slate-400">Heading to</dt>
                  <dd>{v.destination?.name ?? '—'}</dd>
                  <dt className="text-slate-400">Status</dt>
                  <dd>{arrived ? 'Arrived' : `En route · ${Math.round(v.position.progress * 100)}%`}</dd>
                </dl>
              </div>
            </Popup>
          </Marker>
        )
      })}

      <FocusController vehicles={vehicles} focus={focus} />
    </MapContainer>
  )
}
