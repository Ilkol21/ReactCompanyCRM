import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';  // исправлено

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
    latitude: number;
    longitude: number;
    markerPosition: { lat: number; lng: number } | null;
    onMapClick: (lat: number, lng: number) => void;
    zoom?: number;
}

const Map: React.FC<MapProps> = ({
                                     latitude,
                                     longitude,
                                     markerPosition,
                                     onMapClick,
                                     zoom = 13,
                                 }) => {
    const MapClickHandler = () => {
        useMapEvents({
            click(e: LeafletMouseEvent) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };

    return (
        <MapContainer
            center={[latitude, longitude]}
            zoom={zoom}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markerPosition && <Marker position={[markerPosition.lat, markerPosition.lng]} />}
            <MapClickHandler />
        </MapContainer>
    );
};

export default Map;
