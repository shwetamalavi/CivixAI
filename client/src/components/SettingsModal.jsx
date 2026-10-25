import React, { useState, useEffect } from 'react';
import { X, Key, Database, Sparkles, CheckCircle2, Info, Phone, Globe, Satellite } from 'lucide-react';
import { api } from '../services/api.js';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [smsStatus, setSmsStatus] = useState(null);
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live GIS Configuration State
  const [gisConfig, setGisConfig] = useState(null);
  const [mapboxToken, setMapboxToken] = useState(() => localStorage.getItem('civix_mapbox_token') || '');
  const [googleKey, setGoogleKey] = useState(() => localStorage.getItem('civix_google_key') || '');
  const [arcgisKey, setArcgisKey] = useState(() => localStorage.getItem('civix_arcgis_key') || '');
  const [maptilerKey, setMaptilerKey] = useState(() => localStorage.getItem('civix_maptiler_key') || '');
  const [customTileUrl, setCustomTileUrl] = useState(() => localStorage.getItem('civix_custom_tile_url') || '');
  const [gisSaving, setGisSaving] = useState(false);
  const [gisSuccess, setGisSuccess] = useState(false);
  const [gisError, setGisError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const [aiRes, healthRes, smsRes, gisRes] = await Promise.all([
        api.getAiStatus(),
        api.getHealth(),
        api.getSmsStatus(),
        api.getGisConfig().catch(() => null),
      ]);
      setAiStatus(aiRes);
      setDbStatus(healthRes.db);
      setSmsStatus(smsRes);
      if (gisRes?.success) {
        setGisConfig(gisRes);
        if (gisRes.clientTokens) {
          if (!mapboxToken && gisRes.clientTokens.mapbox) setMapboxToken(gisRes.clientTokens.mapbox);
          if (!googleKey && gisRes.clientTokens.google) setGoogleKey(gisRes.clientTokens.google);
          if (!arcgisKey && gisRes.clientTokens.arcgis) setArcgisKey(gisRes.clientTokens.arcgis);
          if (!maptilerKey && gisRes.clientTokens.maptiler) setMaptilerKey(gisRes.clientTokens.maptiler);
          if (!customTileUrl && gisRes.clientTokens.customUrl) setCustomTileUrl(gisRes.clientTokens.customUrl);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGisKeys = async (e) => {
    e.preventDefault();
    setGisSaving(true);
    setGisError('');
    setGisSuccess(false);

    try {
      localStorage.setItem('civix_mapbox_token', mapboxToken.trim());
      localStorage.setItem('civix_google_key', googleKey.trim());
      localStorage.setItem('civix_arcgis_key', arcgisKey.trim());
      localStorage.setItem('civix_maptiler_key', maptilerKey.trim());
      localStorage.setItem('civix_custom_tile_url', customTileUrl.trim());

      const res = await api.updateGisConfig({
        mapboxToken: mapboxToken.trim(),
        googleApiKey: googleKey.trim(),
        arcgisApiKey: arcgisKey.trim(),
        maptilerApiKey: maptilerKey.trim(),
        customTileUrl: customTileUrl.trim(),
      });

      if (res.success) {
        setGisSuccess(true);
        const updated = await api.getGisConfig();
        setGisConfig(updated);
        setTimeout(() => setGisSuccess(false), 4000);
      } else {
        setGisError(res.error || 'Failed to update GIS configuration');
      }
    } catch (err) {
      setGisError(err.message);
    } finally {
      setGisSaving(false);
    }
  };

  const handleSaveSmsKey = async (e) => {
    e.preventDefault();
    if (!fast2smsKey.trim()) return;
    setSmsLoading(true);
    setSmsError('');
    setSmsSuccess(false);

    try {
      const res = await api.updateSmsKey({ fast2smsKey: fast2smsKey.trim() });
      if (res.success) {
        setSmsSuccess(true);
        setFast2smsKey('');
        const updated = await api.getSmsStatus();
        setSmsStatus(updated);
        setTimeout(() => setSmsSuccess(false), 4000);
      } else {
        setSmsError(res.error || 'Failed to update SMS key');
      }
    } catch (err) {
      setSmsError(err.message);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await api.updateAiKey(apiKey);
      if (res.success) {
        setSaveSuccess(true);
        setAiStatus(res);
        setApiKey('');
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to update key');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSimulation = async () => {
    try {
      const nextState = !aiStatus?.simulateFailure;
      const res = await api.simulateAiFailure(nextState);
      if (res.success) {
        setAiStatus((prev) => ({ ...prev, simulateFailure: res.simulateFailure }));
      }
    } catch (e) {
      setErrorMsg('Failed to toggle AI simulation: ' + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '20px',
        border: '1px solid var(--border-accent)',
        padding: '28px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Platform & AI Settings</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure Gemini Vision & verify Database Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Database Status Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Database size={16} color="#38bdf8" />
            <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Geospatial Database Engine</h4>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Mode:</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              {dbStatus?.type || 'In-Memory Civic Engine (GeoSpatial active)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginTop: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Geo Index:</span>
            <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>2dsphere (Point [lng, lat])</span>
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: '10px',
            lineHeight: 1.4,
            background: 'rgba(0,0,0,0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
          }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Supports MongoDB Atlas via <code style={{ color: '#38bdf8' }}>MONGODB_URI</code> or runs seamlessly with in-memory spherical Haversine spatial indexing.
          </div>
        </div>

        {/* Gemini API Key Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Key size={16} color="#f59e0b" />
            <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Google Gemini Multimodal Vision API</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            CivixAI automatically leverages multimodal Gemini 1.5/2.0 Flash to analyze photos. A high-fidelity civic heuristic engine is active by default. You can supply your live Gemini API Key below:
          </p>

          <form onSubmit={handleSaveKey}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="input-gemini-key"
                type="password"
                placeholder={aiStatus?.configured ? `Configured (${aiStatus.keyPreview})` : "Enter AIzaSy... API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !apiKey.trim()}
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                {loading ? 'Saving...' : 'Apply Key'}
              </button>
            </div>
          </form>

          {saveSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', marginTop: '6px' }}>
              <CheckCircle2 size={14} /> Gemini Vision key saved successfully!
            </div>
          )}

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
              {errorMsg}
            </div>
          )}

          {/* TC-16 Failure Simulation Toggle */}
          <div style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, display: 'block' }}>
                Simulate AI API Failure / Timeout (TC-16)
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Test fallback handling when cloud AI is unreachable
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSimulation}
              style={{
                background: aiStatus?.simulateFailure ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: aiStatus?.simulateFailure ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                color: aiStatus?.simulateFailure ? '#fca5a5' : '#e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {aiStatus?.simulateFailure ? 'Simulation: ACTIVE (Simulating Downtime)' : 'Simulation: OFF'}
            </button>
          </div>
        </div>

        {/* Real SMS Gateway Configuration Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#38bdf8" />
              <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Real SMS Carrier Gateway</h4>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: smsStatus?.hasRealSmsProvider ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: smsStatus?.hasRealSmsProvider ? '#10b981' : '#f59e0b',
              border: smsStatus?.hasRealSmsProvider ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            }}>
              {smsStatus?.activeProvider || 'Checking...'}
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            To deliver live SMS OTPs to real Indian mobile phone numbers (+91), enter your <strong>Fast2SMS API Key</strong> below (or set <code style={{ color: '#38bdf8' }}>FAST2SMS_API_KEY</code> in <code style={{ color: '#38bdf8' }}>server/.env</code>):
          </p>

          <form onSubmit={handleSaveSmsKey}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="input-fast2sms-key"
                type="password"
                placeholder={smsStatus?.hasRealSmsProvider ? "Live Provider Configured" : "Enter Fast2SMS API Key"}
                value={fast2smsKey}
                onChange={(e) => setFast2smsKey(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={smsLoading || !fast2smsKey.trim()}
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                {smsLoading ? 'Saving...' : 'Save SMS Key'}
              </button>
            </div>
          </form>

          {smsSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', marginTop: '6px' }}>
              <CheckCircle2 size={14} /> SMS Gateway key saved successfully! Real carrier SMS active.
            </div>
          )}

          {smsError && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
              {smsError}
            </div>
          )}

          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
            marginTop: '10px',
            lineHeight: 1.4,
            background: 'rgba(0,0,0,0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
          }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Free Fast2SMS API keys can be obtained at <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>fast2sms.com</a> with free instant credits.
          </div>
        </div>

        {/* Live GIS Map & Geospatial Services Configuration Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="#06b6d4" />
              <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Live GIS Map & Satellite Engine</h4>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}>
              Active GIS: {gisConfig?.activeProvider || 'CARTO / Esri HD'}
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            CivixAI features full multi-layer GIS mapping (Esri HD Satellite, CARTO Dark, OpenStreetMap, Mapbox GL, Google Maps, and Custom WMS). Enter your API credentials below to unlock high-resolution commercial satellite & vector layers:
          </p>

          <form onSubmit={handleSaveGisKeys}>
            {/* Mapbox Token */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                Mapbox Access Token:
              </label>
              <input
                type="password"
                placeholder={gisConfig?.providers?.mapbox?.configured ? "Mapbox Token Configured (pk.ey...)" : "Enter pk.eyJ1... token"}
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Google Maps API Key */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                Google Maps API Key:
              </label>
              <input
                type="password"
                placeholder={gisConfig?.providers?.google?.configured ? "Google Maps API Key Configured" : "Enter AIzaSy... key"}
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Custom Tile URL Template */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                Custom Municipal GIS Tile / WMS URL Template:
              </label>
              <input
                type="text"
                placeholder="https://{s}.gis.city.gov/tiles/{z}/{x}/{y}.png"
                value={customTileUrl}
                onChange={(e) => setCustomTileUrl(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={gisSaving}
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                {gisSaving ? 'Saving GIS Keys...' : 'Save GIS Configuration'}
              </button>
            </div>
          </form>

          {gisSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', marginTop: '8px' }}>
              <CheckCircle2 size={14} /> GIS API configuration saved! Multi-layer GIS engine updated.
            </div>
          )}

          {gisError && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px' }}>
              {gisError}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
