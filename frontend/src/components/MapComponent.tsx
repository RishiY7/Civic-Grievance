import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BilingualText } from './BilingualText';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Grievance {
  latitude: number;
  longitude: number;
  severity: string;
  department: string;
  visual_issue?: string;
  translated_text?: string;
  original_text?: string;
  image_path?: string;
  image_description?: string;
  is_duplicate?: boolean;
  parent_id?: number;
}

interface MapComponentProps {
  currentLocation: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
  grievances: Grievance[];
}

const severityColors: Record<string, string> = {
  'Critical': '#ba1a1a', // error color
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#0058bc' // primary color
};

function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

export function MapComponent({ currentLocation, onLocationSelect, grievances }: MapComponentProps) {
  return (
    <div className="glass-panel rounded-[2.5rem] overflow-hidden flex flex-col h-[500px] relative z-0">
      <div className="p-6 flex items-center justify-between absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <h3 className="font-headline-md text-headline-md bg-white/80 px-4 py-1 rounded-full shadow pointer-events-auto">
          <BilingualText text="Live District Insights" />
        </h3>
      </div>
      
      <div className="flex-1 relative bg-surface-container-highest">
        <MapContainer 
          center={[currentLocation.lat, currentLocation.lng]} 
          zoom={14} 
          style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationSelector onLocationSelect={onLocationSelect} />
          <MapUpdater center={currentLocation} />

          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup><BilingualText text="Selected Location for Grievance" /></Popup>
          </Marker>

          {grievances.map((g, idx) => {
            const color = severityColors[g.severity] || '#6b7280';
            return (
              <CircleMarker 
                key={idx}
                center={[g.latitude, g.longitude]}
                radius={12}
                pathOptions={{
                  fillColor: color,
                  color: '#ffffff',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.9
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    {g.image_path && (
                      <img 
                        src={g.image_path} 
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} 
                        alt="Grievance"
                      />
                    )}
                    <span 
                      className="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2" 
                      style={{ backgroundColor: `${color}33`, color: color, border: `1px solid ${color}` }}
                    >
                      {g.severity} <BilingualText text="Severity" />
                    </span>
                    
                    {g.is_duplicate && (
                      <span className="inline-block ml-2 px-2 py-1 text-xs font-bold rounded-full mb-2 bg-error/10 text-error border border-error/30">
                        ⚠️ Duplicate of #{g.parent_id}
                      </span>
                    )}

                    <h3 className="font-bold text-lg mb-1">{g.department} <BilingualText text="Dept" /></h3>
                    <p className="text-sm font-semibold text-gray-700 mb-1"><BilingualText text="Issue:" /> {g.visual_issue || 'Unknown'}</p>
                    <p className="text-xs text-gray-800 mb-1"><strong><BilingualText text="Original:" /></strong> "{g.original_text || 'No text provided'}"</p>
                    <p className="text-xs italic text-gray-600 mb-1"><strong><BilingualText text="Translation:" /></strong> "{g.translated_text}"</p>
                    {g.image_description && <p className="text-xs text-gray-500 mt-2 border-t pt-1">{g.image_description}</p>}
                    
                    <div className="mt-3 border-t pt-2">
                      <a 
                        href={`https://maps.google.com/?q=${g.latitude},${g.longitude}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-1.5 w-full bg-[#0058bc] hover:bg-[#004799] text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors text-center"
                      >
                        <span>🧭</span>
                        <BilingualText text="Navigate in Google Maps" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
