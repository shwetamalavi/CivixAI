import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import CitizenFeed from './components/CitizenFeed.jsx';
import CivicMap from './components/CivicMap.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import CitizenLogin from './components/CitizenLogin.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import ReportIssueModal from './components/ReportIssueModal.jsx';
import IssueDetailModal from './components/IssueDetailModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import AiTestSuiteModal from './components/AiTestSuiteModal.jsx';
import { api } from './services/api.js';

export default function App() {
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'map' | 'admin' | 'citizen-login' | 'admin-login'
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportPrefill, setReportPrefill] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civix_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [issuesRes, healthRes, aiRes] = await Promise.all([
        api.getIssues(),
        api.getHealth().catch(() => ({ db: { type: 'In-Memory Civic Engine' } })),
        api.getAiStatus().catch(() => ({ configured: false })),
      ]);

      if (issuesRes.success) setIssues(issuesRes.data);
      if (healthRes.db) setDbStatus(healthRes.db);
      if (aiRes) setAiStatus(aiRes);
    } catch (err) {
      console.error('[CivixAI client load error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('civix_user', JSON.stringify(user));
      if (token) localStorage.setItem('civix_token', token);
    } catch (e) {}

    if (user.role === 'officer' || user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('feed');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('civix_user');
      localStorage.removeItem('civix_token');
    } catch (e) {}
    setActiveView('feed');
  };

  const handleIssueCreated = (newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssue(newIssue);
  };

  const handleIssueUpdated = (updated) => {
    setIssues((prev) =>
      prev.map((i) => ((i._id === updated._id || i.ticketId === updated.ticketId) ? updated : i))
    );
    setSelectedIssue(updated);
  };

  const urgentCount = issues.filter((i) => i.priority === 'Urgent').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        dbStatus={dbStatus}
        aiStatus={aiStatus}
        urgentCount={urgentCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCitizenLogin={() => setActiveView('citizen-login')}
        onOpenAdminLogin={() => setActiveView('admin-login')}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 24px 48px',
      }}>
        {/* Dedicated Citizen Login Page */}
        {activeView === 'citizen-login' && (
          <CitizenLogin
            onLoginSuccess={handleLoginSuccess}
            onSwitchToAdmin={() => setActiveView('admin-login')}
            onCancel={() => setActiveView('feed')}
          />
        )}

        {/* Dedicated Municipal Admin Login Page */}
        {activeView === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onSwitchToCitizen={() => setActiveView('citizen-login')}
            onCancel={() => setActiveView('feed')}
          />
        )}

        {/* Standard Views */}
        {isLoading && issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spinSlow 1s linear infinite',
            }} />
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '6px' }}>Loading CivixAI Telemetry...</h3>
            <p style={{ fontSize: '0.85rem' }}>Syncing with GeoJSON 2dsphere backend & multimodal vision core</p>
          </div>
        ) : (
          <>
            {activeView === 'feed' && (
              <CitizenFeed
                issues={issues}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onOpenReport={() => setIsReportOpen(true)}
                onSwitchToMap={() => setActiveView('map')}
              />
            )}

            {activeView === 'map' && (
              <CivicMap
                issues={issues}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onReportHere={(loc) => {
                  setReportPrefill({
                    coordinates: [loc.lng, loc.lat],
                    address: loc.address,
                  });
                  setIsReportOpen(true);
                }}
              />
            )}

            {activeView === 'admin' && (
              currentUser && (currentUser.role === 'officer' || currentUser.role === 'admin') ? (
                <AdminDashboard
                  issues={issues}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onRefresh={loadAllData}
                  currentUser={currentUser}
                />
              ) : (
                <AdminLogin
                  onLoginSuccess={handleLoginSuccess}
                  onSwitchToCitizen={() => setActiveView('citizen-login')}
                  onCancel={() => setActiveView('feed')}
                />
              )
            )}
          </>
        )}
      </main>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setReportPrefill(null);
        }}
        onIssueCreated={handleIssueCreated}
        currentUser={currentUser}
        initialCoordinates={reportPrefill?.coordinates}
        initialAddress={reportPrefill?.address}
      />

      {/* Inspect Issue Details Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onIssueUpdated={handleIssueUpdated}
      />

      {/* Settings & AI Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* AI Test Suite (TC-11 to TC-18) Modal */}
      <AiTestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
        onPreFillReport={(prefill) => {
          setIsReportOpen(true);
        }}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 11, 19, 0.95)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <strong style={{ color: '#e2e8f0' }}>CivixAI</strong> — Smart Civic Issue Resolver & Governance Platform
          </div>
          <div>
            MERN Stack • Google Gemini Multimodal AI • Geospatial 2dsphere Indexing • Leaflet GIS
          </div>
        </div>
      </footer>
    </div>
  );
}
