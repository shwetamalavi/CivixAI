import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Building2,
  PlusCircle,
  Settings,
  Sparkles,
  BarChart3,
  Layers,
  Radio,
  User,
  LogOut,
  Lock,
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  onOpenReport,
  onOpenSettings,
  dbStatus,
  aiStatus,
  urgentCount = 0,
  currentUser,
  onLogout,
  onOpenCitizenLogin,
  onOpenAdminLogin,
  onOpenTestSuite,
}) {
  const isOfficerOrAdmin = currentUser && (currentUser.role === 'officer' || currentUser.role === 'admin');

  const handleAdminNavClick = () => {
    if (isOfficerOrAdmin) {
      setActiveView('admin');
    } else {
      onOpenAdminLogin();
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(9, 13, 22, 0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveView('feed')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
          }}>
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                CivixAI
              </span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Sparkles size={10} /> AI MULTIMODAL
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Smart Civic Issue Resolver & Governance Platform
            </p>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            id="nav-btn-feed"
            onClick={() => setActiveView('feed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeView === 'feed' ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'transparent',
              color: activeView === 'feed' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Layers size={16} /> Citizen Feed
          </button>

          <button
            id="nav-btn-map"
            onClick={() => setActiveView('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeView === 'map' ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'transparent',
              color: activeView === 'map' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <MapPin size={16} /> Live GIS Map
          </button>

          <button
            id="nav-btn-admin"
            onClick={handleAdminNavClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeView === 'admin' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
              color: activeView === 'admin' ? '#ffffff' : (isOfficerOrAdmin ? '#c084fc' : 'var(--text-muted)'),
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <Building2 size={16} /> Municipal Admin
            {!isOfficerOrAdmin && (
              <Lock size={12} style={{ opacity: 0.7 }} />
            )}
            {urgentCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '999px',
                fontWeight: 700,
              }}>
                {urgentCount} URGENT
              </span>
            )}
          </button>
        </nav>

        {/* Action Controls & Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* User Auth Status / Login Buttons */}
          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isOfficerOrAdmin ? 'rgba(168, 85, 247, 0.12)' : 'rgba(6, 182, 212, 0.12)',
              border: isOfficerOrAdmin ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '999px',
              padding: '4px 10px 4px 6px',
              fontSize: '0.78rem',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isOfficerOrAdmin
                  ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
                  : 'linear-gradient(135deg, #0284c7, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
              }}>
                {isOfficerOrAdmin ? <Building2 size={14} /> : (currentUser.name?.[0]?.toUpperCase() || 'C')}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>{currentUser.name}</div>
                <div style={{ color: isOfficerOrAdmin ? '#c084fc' : '#38bdf8', fontSize: '0.67rem' }}>
                  {isOfficerOrAdmin ? (currentUser.designation || 'Municipal Officer') : (currentUser.wardNumber || 'Citizen Reporter')}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  marginLeft: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                id="btn-nav-citizen-login"
                onClick={onOpenCitizenLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: activeView === 'citizen-login' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeView === 'citizen-login' ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: activeView === 'citizen-login' ? '#38bdf8' : '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <User size={14} /> Citizen Login
              </button>

              <button
                type="button"
                id="btn-nav-admin-login"
                onClick={onOpenAdminLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: activeView === 'admin-login' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.12)',
                  border: activeView === 'admin-login' ? '1px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: '#c084fc',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Building2 size={14} /> Municipal Login
              </button>
            </div>
          )}

          {/* AI Test Suite (TC-11 - TC-18) Button */}
          <button
            id="btn-open-test-suite"
            type="button"
            onClick={onOpenTestSuite}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(2, 132, 199, 0.1))',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Open Interactive AI Test Suite (TC-11 to TC-18)"
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>AI Test Suite</span>
            <span style={{
              background: 'rgba(6, 182, 212, 0.25)',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.67rem',
              color: '#fff',
            }}>
              TC-11–18
            </span>
          </button>

          {/* Report Button */}
          <button
            id="btn-report-issue-header"
            onClick={onOpenReport}
            className="btn-primary"
            style={{
              padding: '9px 16px',
              fontSize: '0.85rem',
            }}
          >
            <PlusCircle size={17} /> Report Issue
          </button>

          {/* Settings Trigger */}
          <button
            id="btn-settings-trigger"
            onClick={onOpenSettings}
            className="btn-secondary"
            title="System & AI Settings"
            style={{ padding: '9px 11px' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

