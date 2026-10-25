import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '../../.env');

// In-memory runtime GIS state initialized from environment variables
const gisState = {
  activeProvider: process.env.GIS_PROVIDER || 'carto-dark',
  activeStyle: process.env.GIS_STYLE || 'carto-dark',
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  googleApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  arcgisApiKey: process.env.ARCGIS_API_KEY || '',
  maptilerApiKey: process.env.MAPTILER_API_KEY || '',
  customTileUrl: process.env.CUSTOM_GIS_TILE_URL || '',
};

function maskKey(key) {
  if (!key || key.length < 8) return '';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export const getGisConfig = (req, res) => {
  res.json({
    success: true,
    activeProvider: gisState.activeProvider,
    activeStyle: gisState.activeStyle,
    customTileUrl: gisState.customTileUrl,
    providers: {
      carto: {
        id: 'carto',
        name: 'CARTO Open GIS',
        configured: true,
        styles: [
          { id: 'carto-dark', name: 'Cyber Dark Matter (High Contrast)', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
          { id: 'carto-light', name: 'Positron Daylight Vector', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
          { id: 'carto-voyager', name: 'Voyager Navigation Urban', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
        ],
      },
      esriPublic: {
        id: 'esriPublic',
        name: 'Esri ArcGIS Online (Public HD)',
        configured: true,
        styles: [
          { id: 'esri-satellite', name: 'Esri World Imagery (High-Res Satellite Aerial)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
          { id: 'esri-topo', name: 'Esri World Topographic & Contours', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
          { id: 'esri-street', name: 'Esri World Street Map (Urban Infrastructure)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
          { id: 'esri-natgeo', name: 'Esri National Geographic Cartographic', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}' },
        ],
      },
      osm: {
        id: 'osm',
        name: 'OpenStreetMap Foundation',
        configured: true,
        styles: [
          { id: 'osm-standard', name: 'OpenStreetMap Standard Live', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
          { id: 'osm-hot', name: 'Humanitarian OSM (Disaster / Civic)', url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png' },
        ],
      },
      mapbox: {
        id: 'mapbox',
        name: 'Mapbox Vector & Satellite GL',
        configured: Boolean(gisState.mapboxToken),
        keyPreview: maskKey(gisState.mapboxToken),
        styles: [
          { id: 'mapbox-satellite', name: 'Mapbox Satellite Streets HD', styleId: 'satellite-streets-v12' },
          { id: 'mapbox-streets', name: 'Mapbox Streets v12', styleId: 'streets-v12' },
          { id: 'mapbox-dark', name: 'Mapbox Dark v11', styleId: 'dark-v11' },
          { id: 'mapbox-nav', name: 'Mapbox Navigation Night', styleId: 'navigation-night-v1' },
          { id: 'mapbox-outdoors', name: 'Mapbox Outdoors & Terrain', styleId: 'outdoors-v12' },
        ],
      },
      google: {
        id: 'google',
        name: 'Google Maps GIS',
        configured: Boolean(gisState.googleApiKey),
        keyPreview: maskKey(gisState.googleApiKey),
        styles: [
          { id: 'google-roadmap', name: 'Google Maps Roadmap', lyrs: 'm' },
          { id: 'google-satellite', name: 'Google Maps Satellite HD', lyrs: 's' },
          { id: 'google-hybrid', name: 'Google Maps Hybrid (Streets + Sat)', lyrs: 'y' },
          { id: 'google-terrain', name: 'Google Maps Terrain Contours', lyrs: 'p' },
        ],
      },
      arcgis: {
        id: 'arcgis',
        name: 'Esri ArcGIS Platform (Token-authenticated)',
        configured: Boolean(gisState.arcgisApiKey),
        keyPreview: maskKey(gisState.arcgisApiKey),
      },
      maptiler: {
        id: 'maptiler',
        name: 'MapTiler Cloud Geospatial',
        configured: Boolean(gisState.maptilerApiKey),
        keyPreview: maskKey(gisState.maptilerApiKey),
        styles: [
          { id: 'maptiler-streets', name: 'MapTiler Streets v2', styleId: 'streets-v2' },
          { id: 'maptiler-satellite', name: 'MapTiler Satellite Hybrid', styleId: 'hybrid' },
          { id: 'maptiler-topo', name: 'MapTiler Topographic', styleId: 'topo-v2' },
        ],
      },
      custom: {
        id: 'custom',
        name: 'Custom Municipal GIS Tile/WMS Endpoint',
        configured: Boolean(gisState.customTileUrl),
        url: gisState.customTileUrl,
      },
    },
    // Expose keys securely for direct browser Leaflet tile requests
    clientTokens: {
      mapbox: gisState.mapboxToken,
      google: gisState.googleApiKey,
      arcgis: gisState.arcgisApiKey,
      maptiler: gisState.maptilerApiKey,
      customUrl: gisState.customTileUrl,
    },
  });
};

export const updateGisConfig = (req, res) => {
  try {
    const {
      provider,
      style,
      mapboxToken,
      googleApiKey,
      arcgisApiKey,
      maptilerApiKey,
      customTileUrl,
    } = req.body;

    if (provider !== undefined) gisState.activeProvider = provider;
    if (style !== undefined) gisState.activeStyle = style;
    if (mapboxToken !== undefined) {
      gisState.mapboxToken = mapboxToken.trim();
      process.env.MAPBOX_ACCESS_TOKEN = gisState.mapboxToken;
    }
    if (googleApiKey !== undefined) {
      gisState.googleApiKey = googleApiKey.trim();
      process.env.GOOGLE_MAPS_API_KEY = gisState.googleApiKey;
    }
    if (arcgisApiKey !== undefined) {
      gisState.arcgisApiKey = arcgisApiKey.trim();
      process.env.ARCGIS_API_KEY = gisState.arcgisApiKey;
    }
    if (maptilerApiKey !== undefined) {
      gisState.maptilerApiKey = maptilerApiKey.trim();
      process.env.MAPTILER_API_KEY = gisState.maptilerApiKey;
    }
    if (customTileUrl !== undefined) {
      gisState.customTileUrl = customTileUrl.trim();
      process.env.CUSTOM_GIS_TILE_URL = gisState.customTileUrl;
    }

    // Try persisting to server/.env if writable
    try {
      if (fs.existsSync(envFilePath)) {
        let envContent = fs.readFileSync(envFilePath, 'utf8');
        const updateEnvVar = (name, val) => {
          const regex = new RegExp(`^${name}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${name}=${val || ''}`);
          } else {
            envContent += `\n${name}=${val || ''}`;
          }
        };

        if (mapboxToken !== undefined) updateEnvVar('MAPBOX_ACCESS_TOKEN', gisState.mapboxToken);
        if (googleApiKey !== undefined) updateEnvVar('GOOGLE_MAPS_API_KEY', gisState.googleApiKey);
        if (arcgisApiKey !== undefined) updateEnvVar('ARCGIS_API_KEY', gisState.arcgisApiKey);
        if (maptilerApiKey !== undefined) updateEnvVar('MAPTILER_API_KEY', gisState.maptilerApiKey);
        if (customTileUrl !== undefined) updateEnvVar('CUSTOM_GIS_TILE_URL', gisState.customTileUrl);
        if (provider !== undefined) updateEnvVar('GIS_PROVIDER', gisState.activeProvider);
        if (style !== undefined) updateEnvVar('GIS_STYLE', gisState.activeStyle);

        fs.writeFileSync(envFilePath, envContent, 'utf8');
      }
    } catch (e) {
      console.warn('[gisController] Could not write to .env:', e.message);
    }

    res.json({
      success: true,
      message: 'GIS Map configuration updated successfully!',
      activeProvider: gisState.activeProvider,
      activeStyle: gisState.activeStyle,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
