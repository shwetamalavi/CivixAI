import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Filter,
  Navigation,
  Sparkles,
  Flame,
  CheckCircle,
  ExternalLink,
  Satellite,
  Compass,
  Radio,
  Sliders,
  Key,
  Globe,
  Maximize2,
  Minimize2,
  Crosshair,
  ShieldAlert,
  Info,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api.js';

// Fix Leaflet's default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG pin markers with pulse animation
const createCustomIcon = (priority, status) => {
  let color = '#3b82f6'; // Low (Blue)
  let pulse = false;

  if (status === 'Resolved') {
    color = '#10b981'; // Green
  } else if (priority === 'Urgent') {
    color = '#ef4444'; // Red
    pulse = true;
  } else if (priority === 'High') {
    color = '#f97316'; // Orange
  } else if (priority === 'Medium') {
    color = '#eab308'; // Yellow
  }

  const html = `
    <div class="custom-pin-outer">
      ${pulse ? `<div class="custom-pin-pulse" style="background: ${color}; opacity: 0.45;"></div>` : ''}
      <div style="
        background: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        transition: transform 0.2s;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Target marker for user-dropped map pin
const targetIcon = L.divIcon({
  className: 'custom-target-marker',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: 0; border: 2px dashed #06b6d4; border-radius: 50%; animation: spinSlow 6s linear infinite;"></div>
      <div style="position: absolute; width: 14px; height: 14px; background: #06b6d4; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 12px #06b6d4;"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Map Recenter Helper Component
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Map Event Listener for cursor telemetry and drop-pins
function MapEventsListener({ onMouseMove, onClick }) {
  useMapEvents({
    mousemove(e) {
      if (onMouseMove) onMouseMove(e.latlng);
    },
    click(e) {
      if (onClick) onClick(e.latlng);
    },
  });
  return null;
}

// Built-in Municipal Ward Polygons (Sample metro administrative sectors)
const MUNICIPAL_WARDS = [
  {
    id: 'ward-1',
    name: 'Ward 1 — Civic Hub & Commercial District',
    color: '#06b6d4',
    coordinates: [
      [40.765, -73.995],
      [40.768, -73.978],
      [40.758, -73.972],
      [40.752, -73.988],
    ],
  },
  {
    id: 'ward-2',
    name: 'Ward 2 — Midtown Urban & Transit Corridor',
    color: '#3b82f6',
    coordinates: [
      [40.758, -73.972],
      [40.762, -73.962],
      [40.750, -73.955],
      [40.746, -73.966],
    ],
  },
  {
    id: 'ward-3',
    name: 'Ward 3 — South Residential & Utilities Sector',
    color: '#10b981',
    coordinates: [
      [40.752, -73.988],
      [40.746, -73.966],
      [40.738, -73.974],
      [40.742, -73.998],
    ],
  },
];

export default function CivicMap({ issues = [], onSelectIssue, onReportHere }) {
  // Filter States
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [radiusFilter, setRadiusFilter] = useState(0); // 0 = all, 1000, 2000, 5000, 10000

  // Spatial Navigation State
  const [mapCenter, setMapCenter] = useState([40.7580, -73.9855]); // Metro City Center [lat, lng]
  const [mapZoom, setMapZoom] = useState(13);
  const [cursorPos, setCursorPos] = useState({ lat: 40.7580, lng: -73.9855 });
  const [droppedPin, setDroppedPin] = useState(null);
  const [droppedAddress, setDroppedAddress] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // GIS Layer & Provider State
  const [activeLayer, setActiveLayer] = useState(() => {
    return localStorage.getItem('civix_gis_layer') || 'carto-dark';
  });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWards, setShowWards] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isGisKeyModalOpen, setIsGisKeyModalOpen] = useState(false);

  // GIS Provider API Credentials State
  const [gisTokens, setGisTokens] = useState({
    mapbox: localStorage.getItem('civix_mapbox_token') || '',
    google: localStorage.getItem('civix_google_key') || '',
    arcgis: localStorage.getItem('civix_arcgis_key') || '',
    maptiler: localStorage.getItem('civix_maptiler_key') || '',
    customUrl: localStorage.getItem('civix_custom_tile_url') || '',
  });

  const [gisConfigServer, setGisConfigServer] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Load GIS configuration from backend on mount
  useEffect(() => {
    api.getGisConfig().then((res) => {
      if (res.success) {
        setGisConfigServer(res);
        if (res.clientTokens) {
          setGisTokens((prev) => ({
            mapbox: prev.mapbox || res.clientTokens.mapbox || '',
            google: prev.google || res.clientTokens.google || '',
            arcgis: prev.arcgis || res.clientTokens.arcgis || '',
            maptiler: prev.maptiler || res.clientTokens.maptiler || '',
            customUrl: prev.customUrl || res.clientTokens.customUrl || '',
          }));
        }
      }
    }).catch((e) => console.warn('[CivicMap] Error loading GIS config:', e));
  }, []);

  // Filter issues based on active selectors
  const filteredIssues = issues.filter((item) => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  // Calculate GIS Tile Layer URL and Attribution based on active selection
  const getTileConfig = () => {
    const { mapbox, google, maptiler, customUrl } = gisTokens;

    switch (activeLayer) {
      // 1. Esri World Imagery (HD Live Satellite - Free & Crisp)
      case 'esri-satellite':
        return {
          name: 'Esri World Imagery (HD Satellite)',
          type: 'Satellite',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and GIS Community',
          maxZoom: 19,
        };

      // 2. Esri World Topographic & Elevation
      case 'esri-topo':
        return {
          name: 'Esri World Topographic & Contours',
          type: 'Topography',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri, USGS, NOAA',
          maxZoom: 19,
        };

      // 3. Esri World Street Map
      case 'esri-street':
        return {
          name: 'Esri World Street Infrastructure',
          type: 'Streets',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; HERE, DeLorme, USGS',
          maxZoom: 19,
        };

      // 4. OpenStreetMap Standard
      case 'osm-standard':
        return {
          name: 'OpenStreetMap Live Streets',
          type: 'Open GIS',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };

      // 5. CARTO Positron Daylight Vector
      case 'carto-light':
        return {
          name: 'CARTO Positron Daylight',
          type: 'Vector/Light',
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO & OpenStreetMap',
          maxZoom: 20,
        };

      // 6. Mapbox Satellite Streets (With user token)
      case 'mapbox-satellite':
        if (!mapbox) {
          // Fallback to Esri Satellite with message
          return {
            name: 'Mapbox Satellite (Requires Token -> Esri HD Active)',
            type: 'Satellite',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Add Mapbox Token in GIS Settings to unlock Mapbox GL Vector Satellite',
            maxZoom: 19,
            needsKey: true,
            providerKey: 'mapbox',
          };
        }
        return {
          name: 'Mapbox Satellite Streets HD',
          type: 'Mapbox Live',
          url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapbox}`,
          attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap',
          maxZoom: 22,
        };

      // 7. Mapbox Streets v12 (With user token)
      case 'mapbox-streets':
        if (!mapbox) {
          return {
            name: 'Mapbox Streets (Requires Token -> CARTO Active)',
            type: 'Vector',
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            attribution: 'Add Mapbox Token in GIS Settings',
            maxZoom: 19,
            needsKey: true,
            providerKey: 'mapbox',
          };
        }
        return {
          name: 'Mapbox Streets v12',
          type: 'Mapbox Live',
          url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapbox}`,
          attribution: '&copy; Mapbox &copy; OpenStreetMap',
          maxZoom: 22,
        };

      // 8. Mapbox Dark Navigation v11
      case 'mapbox-dark':
        if (!mapbox) {
          return {
            name: 'Mapbox Dark (Requires Token -> CARTO Dark Active)',
            type: 'Vector/Dark',
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: 'Add Mapbox Token in GIS Settings',
            maxZoom: 19,
            needsKey: true,
            providerKey: 'mapbox',
          };
        }
        return {
          name: 'Mapbox Dark Navigation v11',
          type: 'Mapbox Live',
          url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapbox}`,
          attribution: '&copy; Mapbox &copy; OpenStreetMap',
          maxZoom: 22,
        };

      // 9. Google Maps Roadmap
      case 'google-roadmap':
        return {
          name: 'Google Maps Roadmap',
          type: 'Google GIS',
          url: google
            ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${google}`
            : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Live Tile Stream',
          maxZoom: 20,
        };

      // 10. Google Maps Satellite HD
      case 'google-satellite':
        return {
          name: 'Google Maps Satellite HD',
          type: 'Google GIS',
          url: google
            ? `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${google}`
            : 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Satellite Imagery',
          maxZoom: 20,
        };

      // 11. Google Maps Hybrid
      case 'google-hybrid':
        return {
          name: 'Google Maps Hybrid (Streets + Satellite)',
          type: 'Google GIS',
          url: google
            ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${google}`
            : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Hybrid Geospatial',
          maxZoom: 20,
        };

      // 12. Google Maps Terrain
      case 'google-terrain':
        return {
          name: 'Google Maps Terrain Contours',
          type: 'Google GIS',
          url: google
            ? `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${google}`
            : 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Physical Terrain',
          maxZoom: 20,
        };

      // 13. MapTiler Satellite / Streets
      case 'maptiler-satellite':
        if (!maptiler) {
          return {
            name: 'MapTiler Satellite (Requires Key -> Esri HD Active)',
            type: 'Satellite',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Add MapTiler API Key in GIS Settings',
            maxZoom: 19,
            needsKey: true,
            providerKey: 'maptiler',
          };
        }
        return {
          name: 'MapTiler Hybrid Satellite',
          type: 'MapTiler',
          url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptiler}`,
          attribution: '&copy; MapTiler &copy; OpenStreetMap',
          maxZoom: 20,
        };

      // 14. Custom Tile URL
      case 'custom-wms':
        return {
          name: 'Custom Municipal GIS Endpoint',
          type: 'Custom WMS/XYZ',
          url: customUrl || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: 'Custom Municipal GIS Stream',
          maxZoom: 22,
          needsKey: !customUrl,
          providerKey: 'customUrl',
        };

      // Default: CARTO Dark Matter Cyber Urban
      case 'carto-dark':
      default:
        return {
          name: 'CARTO Cyber Dark Matter',
          type: 'Vector/Dark',
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO & OpenStreetMap GIS',
          maxZoom: 20,
        };
    }
  };

  const tileConfig = getTileConfig();

  const handleSelectLayer = (layerId) => {
    setActiveLayer(layerId);
    try {
      localStorage.setItem('civix_gis_layer', layerId);
    } catch (e) {}
    setIsLayerMenuOpen(false);
  };

  const handleCenterOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(14);
          setRadiusFilter(5000);
        },
        () => {
          alert('GPS location unavailable, centering on Metro Civic Center.');
        }
      );
    }
  };

  const handleMapClick = async (latlng) => {
    setDroppedPin(latlng);
    setDroppedAddress('Resolving address from GIS spatial server...');

    try {
      const geo = await api.reverseGeocode(latlng.lat, latlng.lng);
      setDroppedAddress(geo.formattedAddress || `Lat ${latlng.lat.toFixed(5)}, Lng ${latlng.lng.toFixed(5)}`);
    } catch (e) {
      setDroppedAddress(`Lat ${latlng.lat.toFixed(5)}, Lng ${latlng.lng.toFixed(5)}`);
    }
  };

  const handleReportAtDroppedPin = () => {
    if (!droppedPin) return;
    if (onReportHere) {
      onReportHere({
        lat: droppedPin.lat,
        lng: droppedPin.lng,
        address: droppedAddress,
      });
    }
  };

  const handleSaveGisTokens = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving GIS credentials...');

    try {
      localStorage.setItem('civix_mapbox_token', gisTokens.mapbox.trim());
      localStorage.setItem('civix_google_key', gisTokens.google.trim());
      localStorage.setItem('civix_arcgis_key', gisTokens.arcgis.trim());
      localStorage.setItem('civix_maptiler_key', gisTokens.maptiler.trim());
      localStorage.setItem('civix_custom_tile_url', gisTokens.customUrl.trim());

      await api.updateGisConfig({
        mapboxToken: gisTokens.mapbox.trim(),
        googleApiKey: gisTokens.google.trim(),
        arcgisApiKey: gisTokens.arcgis.trim(),
        maptilerApiKey: gisTokens.maptiler.trim(),
        customTileUrl: gisTokens.customUrl.trim(),
        style: activeLayer,
      });

      setSaveStatus('Credentials saved! Live GIS map updated.');
      setTimeout(() => {
        setSaveStatus('');
        setIsGisKeyModalOpen(false);
      }, 1500);
    } catch (err) {
      setSaveStatus('Saved locally. Backend note: ' + err.message);
      setTimeout(() => setIsGisKeyModalOpen(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        minHeight: '620px',
        borderRadius: isFullscreen ? '0' : '20px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: '#070b13',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* 1. TOP LIVE GIS CONTROL BAR OVERLAY */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 600,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'rgba(9, 13, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Left: GIS Stream Status & Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#38bdf8',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulseGlow 2s infinite',
              }}
            />
            LIVE GIS STREAM
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['ALL', 'ROADS', 'SANITATION', 'ELECTRICAL', 'WATER', 'SAFETY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  background:
                    filterCategory === cat
                      ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: filterCategory === cat ? '#fff' : 'var(--text-muted)',
                  border: filterCategory === cat ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right: GIS Layer Switcher & Key Config Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Severity Filter Select */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              background: 'rgba(10, 15, 26, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="Urgent">Urgent Hazard (Red)</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          {/* Near Me GPS Center */}
          <button
            onClick={handleCenterOnUser}
            className="btn-secondary"
            title="Scan GPS Location"
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Navigation size={13} color="#38bdf8" /> Near Me
          </button>

          {/* GIS Basemap Layer Switcher Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isLayerMenuOpen
                  ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Satellite size={14} color="#38bdf8" />
              <span>GIS Basemap: <strong>{tileConfig.type}</strong></span>
            </button>

            {/* Layer Selection Dropdown Menu */}
            {isLayerMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '310px',
                  background: 'rgba(9, 13, 22, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '14px',
                  padding: '12px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
                  zIndex: 1000,
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 700 }}>
                  Select Live GIS Basemap
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
                  {/* Esri HD Satellite */}
                  <button
                    onClick={() => handleSelectLayer('esri-satellite')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'esri-satellite' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'esri-satellite' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🛰️ Esri World Satellite HD</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>High-res aerial imagery (Ready to use)</div>
                    </div>
                    {activeLayer === 'esri-satellite' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* CARTO Dark Matter */}
                  <button
                    onClick={() => handleSelectLayer('carto-dark')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'carto-dark' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'carto-dark' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🌌 Cyber Dark Matter (CARTO)</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>High contrast neon municipal map</div>
                    </div>
                    {activeLayer === 'carto-dark' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* OpenStreetMap Standard */}
                  <button
                    onClick={() => handleSelectLayer('osm-standard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'osm-standard' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'osm-standard' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🗺️ OpenStreetMap Standard</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Global open-source street layers</div>
                    </div>
                    {activeLayer === 'osm-standard' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Esri Topographic */}
                  <button
                    onClick={() => handleSelectLayer('esri-topo')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'esri-topo' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'esri-topo' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>⛰️ Esri World Topographic</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Terrain, contours & elevation</div>
                    </div>
                    {activeLayer === 'esri-topo' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Mapbox Satellite Streets */}
                  <button
                    onClick={() => handleSelectLayer('mapbox-satellite')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'mapbox-satellite' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'mapbox-satellite' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>
                        🌐 Mapbox Satellite Streets {gisTokens.mapbox ? '✓' : '(API)'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: gisTokens.mapbox ? '#10b981' : '#f59e0b' }}>
                        {gisTokens.mapbox ? 'Token Connected' : 'Requires Mapbox Token'}
                      </div>
                    </div>
                    {activeLayer === 'mapbox-satellite' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Mapbox Streets */}
                  <button
                    onClick={() => handleSelectLayer('mapbox-streets')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'mapbox-streets' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'mapbox-streets' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🛣️ Mapbox Streets v12</div>
                      <div style={{ fontSize: '0.68rem', color: gisTokens.mapbox ? '#10b981' : '#f59e0b' }}>
                        {gisTokens.mapbox ? 'Token Connected' : 'Requires Mapbox Token'}
                      </div>
                    </div>
                    {activeLayer === 'mapbox-streets' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Google Maps Hybrid */}
                  <button
                    onClick={() => handleSelectLayer('google-hybrid')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'google-hybrid' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'google-hybrid' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🌍 Google Maps Hybrid</div>
                      <div style={{ fontSize: '0.68rem', color: gisTokens.google ? '#10b981' : '#cbd5e1' }}>
                        Roads + HD Satellite
                      </div>
                    </div>
                    {activeLayer === 'google-hybrid' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Google Maps Roadmap */}
                  <button
                    onClick={() => handleSelectLayer('google-roadmap')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'google-roadmap' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'google-roadmap' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>📍 Google Maps Roadmap</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Standard Google City vectors</div>
                    </div>
                    {activeLayer === 'google-roadmap' && <Check size={14} color="#06b6d4" />}
                  </button>

                  {/* Custom Tile URL */}
                  <button
                    onClick={() => handleSelectLayer('custom-wms')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: activeLayer === 'custom-wms' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeLayer === 'custom-wms' ? '1px solid #06b6d4' : '1px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>📐 Custom Municipal GIS Tile/WMS</div>
                      <div style={{ fontSize: '0.68rem', color: gisTokens.customUrl ? '#10b981' : '#f59e0b' }}>
                        {gisTokens.customUrl ? 'Custom Endpoint Configured' : 'Configure Custom URL'}
                      </div>
                    </div>
                    {activeLayer === 'custom-wms' && <Check size={14} color="#06b6d4" />}
                  </button>
                </div>

                {/* Overlays Toggle */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '8px', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Spatial GIS Overlays:
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: showHeatmap ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: showHeatmap ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        color: showHeatmap ? '#fca5a5' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      🔥 {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
                    </button>
                    <button
                      onClick={() => setShowWards(!showWards)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: showWards ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: showWards ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                        color: showWards ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      🏛️ {showWards ? 'Wards: ON' : 'Wards: OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Configure GIS API Button */}
          <button
            onClick={() => setIsGisKeyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Key size={13} />
            <span>Configure GIS API</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 8px',
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. DROPPED PIN CALLOUT BANNER (WHEN USER CLICKS ON MAP) */}
      {droppedPin && (
        <div
          style={{
            position: 'absolute',
            top: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 600,
            background: 'rgba(9, 13, 22, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #06b6d4',
            borderRadius: '12px',
            padding: '10px 18px',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '680px',
            width: 'calc(100% - 32px)',
          }}
        >
          <div style={{ color: '#06b6d4' }}>
            <Crosshair size={22} className="pulse-glow" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              GPS COORDINATES: {droppedPin.lat.toFixed(6)}, {droppedPin.lng.toFixed(6)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {droppedAddress}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleReportAtDroppedPin}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🚩 Report Issue Here
            </button>
            <button
              onClick={() => setDroppedPin(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. GIS SEVERITY LEGEND OVERLAY (BOTTOM LEFT) */}
      <div
        style={{
          position: 'absolute',
          bottom: '44px',
          left: '16px',
          zIndex: 500,
          background: 'rgba(9, 13, 22, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="#38bdf8" /> Live Civic Assets ({filteredIssues.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
            <span>Urgent Hazard (&lt;12h SLA)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f97316' }} />
            <span>High Severity (&lt;24h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#eab308' }} />
            <span>Medium (&lt;48h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM LIVE GIS TELEMETRY HUD */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '16px',
          right: '16px',
          zIndex: 500,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'rgba(6, 10, 18, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '5px 14px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ color: '#38bdf8' }}>
            LAT: <strong>{cursorPos.lat.toFixed(6)}</strong>
          </span>
          <span style={{ color: '#38bdf8' }}>
            LNG: <strong>{cursorPos.lng.toFixed(6)}</strong>
          </span>
          <span style={{ color: 'var(--text-dim)' }}>
            PROJECTION: <strong>EPSG:4326 (WGS84) / Web Mercator</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: '#94a3b8' }}>
            LAYER: <strong style={{ color: '#fff' }}>{tileConfig.name}</strong>
          </span>
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            TILES ACTIVE
          </span>
        </div>
      </div>

      {/* 5. LEAFLET MAP CONTAINER */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <ChangeMapView center={mapCenter} zoom={mapZoom} />
        <MapEventsListener onMouseMove={setCursorPos} onClick={handleMapClick} />

        {/* Dynamic Basemap Tile Layer */}
        <TileLayer
          key={activeLayer + (gisTokens.mapbox || '') + (gisTokens.google || '')}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={tileConfig.maxZoom || 19}
        />

        {/* Municipal Ward Boundary Polygons */}
        {showWards &&
          MUNICIPAL_WARDS.map((ward) => (
            <Polygon
              key={ward.id}
              positions={ward.coordinates}
              pathOptions={{
                color: ward.color,
                weight: 2,
                fillColor: ward.color,
                fillOpacity: 0.12,
                dashArray: '6, 6',
              }}
            >
              <Tooltip sticky>
                <div style={{ fontWeight: 700, color: ward.color }}>{ward.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Municipal Boundary Zone</div>
              </Tooltip>
            </Polygon>
          ))}

        {/* Live Heatmap Density Rings around Urgent & High Priority Issues */}
        {showHeatmap &&
          filteredIssues
            .filter((item) => item.priority === 'Urgent' || item.priority === 'High')
            .map((item) => {
              const coordinates = item.location?.coordinates || [-73.9855, 40.7580];
              const pos = [coordinates[1], coordinates[0]];
              const isUrgent = item.priority === 'Urgent';

              return (
                <Circle
                  key={`heat-${item._id || item.ticketId}`}
                  center={pos}
                  radius={isUrgent ? 350 : 200}
                  pathOptions={{
                    color: isUrgent ? '#ef4444' : '#f97316',
                    fillColor: isUrgent ? '#ef4444' : '#f97316',
                    fillOpacity: isUrgent ? 0.22 : 0.15,
                    weight: 1,
                  }}
                />
              );
            })}

        {/* Radius Filter Circle if active */}
        {radiusFilter > 0 && (
          <Circle
            center={mapCenter}
            radius={radiusFilter}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6, 10',
            }}
          />
        )}

        {/* Render Dropped Pin Marker if user clicked */}
        {droppedPin && (
          <Marker position={[droppedPin.lat, droppedPin.lng]} icon={targetIcon}>
            <Popup autoPan={false}>
              <div style={{ padding: '6px', textAlign: 'center' }}>
                <strong style={{ color: '#06b6d4', fontSize: '0.8rem' }}>Selected Coordinate</strong>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: '4px 0 8px' }}>
                  {droppedAddress}
                </p>
                <button
                  onClick={handleReportAtDroppedPin}
                  style={{
                    background: '#06b6d4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Ticket Here
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Markers for each Civic Issue */}
        {filteredIssues.map((item) => {
          const coordinates = item.location?.coordinates || [-73.9855, 40.7580];
          // GeoJSON is [lng, lat], Leaflet takes [lat, lng]
          const pos = [coordinates[1], coordinates[0]];

          return (
            <Marker
              key={item._id || item.ticketId}
              position={pos}
              icon={createCustomIcon(item.priority, item.status)}
            >
              <Popup>
                <div style={{ width: '270px', overflow: 'hidden' }}>
                  {/* Photo Thumbnail */}
                  <div style={{ height: '125px', width: '100%', position: 'relative' }}>
                    <img
                      src={item.media?.photoUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background:
                          item.priority === 'Urgent'
                            ? 'rgba(239, 68, 68, 0.92)'
                            : item.priority === 'High'
                            ? 'rgba(249, 115, 22, 0.92)'
                            : 'rgba(59, 130, 246, 0.92)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      }}
                    >
                      {item.priority} Severity
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '12px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: '#38bdf8',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {item.ticketId} • {item.category}
                    </div>

                    <h4
                      style={{
                        fontSize: '0.88rem',
                        color: '#fff',
                        marginBottom: '6px',
                        lineHeight: 1.3,
                        fontWeight: 600,
                      }}
                    >
                      {item.title}
                    </h4>

                    <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '8px' }}>
                      {item.address?.formatted}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ color: '#cbd5e1' }}>{item.assignedDepartment}</span>
                      <span
                        style={{
                          color: item.status === 'Resolved' ? '#10b981' : '#f59e0b',
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectIssue(item)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <ExternalLink size={13} /> Inspect Full Case
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 6. CONFIGURE LIVE GIS API MODAL */}
      {isGisKeyModalOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '540px',
              width: '100%',
              borderRadius: '16px',
              border: '1px solid var(--border-accent)',
              padding: '24px',
              background: '#090d16',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Configure Live GIS Map API</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Connect your Mapbox, Google Maps, ArcGIS, or Custom Tile API
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGisKeyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGisTokens}>
              {/* Mapbox Token */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
                  Mapbox Access Token (pk.eyJ1...)
                </label>
                <input
                  type="password"
                  placeholder="Enter your Mapbox access token (pk.eyJ1...)"
                  value={gisTokens.mapbox}
                  onChange={(e) => setGisTokens({ ...gisTokens, mapbox: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Unlocks Mapbox Satellite Streets, Navigation Night, and Vector HD tiles. Get free token at mapbox.com.
                </span>
              </div>

              {/* Google Maps API Key */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
                  Google Maps API Key (AIzaSy...)
                </label>
                <input
                  type="password"
                  placeholder="Enter your Google Maps API Key (AIzaSy...)"
                  value={gisTokens.google}
                  onChange={(e) => setGisTokens({ ...gisTokens, google: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Unlocks Google Maps Satellite HD, Roadmap, Hybrid and Terrain streams.
                </span>
              </div>

              {/* Custom Tile URL Template */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
                  Custom Municipal GIS Tile / WMS URL Template
                </label>
                <input
                  type="text"
                  placeholder="https://{s}.your-gis.gov/tiles/{z}/{x}/{y}.png?token=..."
                  value={gisTokens.customUrl}
                  onChange={(e) => setGisTokens({ ...gisTokens, customUrl: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Supports any XYZ/WMS spatial tile endpoint with {'{z}/{x}/{y}'} parameters.
                </span>
              </div>

              {saveStatus && (
                <div style={{ color: '#10b981', fontSize: '0.78rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> {saveStatus}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsGisKeyModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                >
                  Save & Apply GIS Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
