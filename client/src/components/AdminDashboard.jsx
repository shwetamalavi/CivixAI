import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  Trash2,
  Zap,
  Droplets,
  ShieldAlert,
  Flame,
  Search,
  Filter,
  Radio,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function AdminDashboard({ issues = [], onSelectIssue, onRefresh, currentUser }) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'audit_logs'
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalyticsAndLogs();
  }, [issues]);

  const loadAnalyticsAndLogs = async () => {
    try {
      const [analyticsRes, logsRes] = await Promise.all([
        api.getAnalytics(),
        api.getAuditLogs(),
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStatusChange = async (issueId, newStatus) => {
    try {
      await api.updateIssueStatus(issueId, {
        status: newStatus,
        note: `Quick dispatch update to: ${newStatus}`,
        updatedBy: 'Municipal Zonal Dispatcher',
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredIssues = issues.filter((item) => {
    if (selectedDept !== 'ALL' && item.assignedDepartment !== selectedDept) return false;
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.ticketId?.toLowerCase().includes(q) ||
        item.address?.formatted?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const departmentsList = [
    { code: 'ROADS', name: 'Roads & Bridges Department', icon: Truck, color: '#f97316' },
    { code: 'SANITATION', name: 'Sanitation & Solid Waste Management', icon: Trash2, color: '#10b981' },
    { code: 'ELECTRICAL', name: 'Electrical & Public Streetlighting', icon: Zap, color: '#eab308' },
    { code: 'WATER', name: 'Water Supply & Drainage Board', icon: Droplets, color: '#06b6d4' },
    { code: 'SAFETY', name: 'Urban Safety & Hazard Prevention', icon: ShieldAlert, color: '#ef4444' },
  ];

  const total = issues.length;
  const urgentCount = issues.filter((i) => i.priority === 'Urgent').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div>
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
            }}>
              MUNICIPAL GOVERNANCE CONSOLE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} className="animate-pulse" /> Live Telemetry Synced
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Municipal Operations & Triage Queue</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Real-time multi-department issue routing, SLA compliance tracking & SMS dispatch system
          </p>
          {currentUser && (
            <div style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              color: '#d8b4fe',
            }}>
              <Building2 size={14} color="#c084fc" />
              <span>
                Authorized Officer: <strong style={{ color: '#fff' }}>{currentUser.name}</strong>
                {currentUser.department ? ` (${currentUser.department})` : ''}
                {currentUser.badgeNumber ? ` • Badge: ${currentUser.badgeNumber}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* View Switcher: Triage Queue vs Audit Logs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setActiveTab('triage')}
            style={{
              background: activeTab === 'triage' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
              color: activeTab === 'triage' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Triage & Dispatch ({issues.length})
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            style={{
              background: activeTab === 'audit_logs' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
              color: activeTab === 'audit_logs' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Smartphone size={14} /> SMS / Email Dispatches ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Total Issues */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Civic Grievances</span>
            <Building2 size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{total}</div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Across all 5 Municipal Wards</span>
        </div>

        {/* Urgent Alerts */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>Urgent Hazard Alerts</span>
            <Flame size={18} color="#ef4444" className="animate-pulse-glow" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{urgentCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>SLA Cap: &lt; 12 Hours Response</span>
        </div>

        {/* In Progress */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Crew Dispatches</span>
            <Clock size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{inProgressCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Field work in progress</span>
        </div>

        {/* Resolution Rate */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolution Rate</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{resolutionRate}%</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{resolvedCount} cases closed with proof</span>
        </div>
      </div>

      {activeTab === 'triage' ? (
        <>
          {/* Department Filter Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '18px',
          }}>
            <button
              onClick={() => setSelectedDept('ALL')}
              style={{
                background: selectedDept === 'ALL' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedDept === 'ALL' ? '#fff' : 'var(--text-muted)',
                border: selectedDept === 'ALL' ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Departments ({issues.length})
            </button>

            {departmentsList.map((dept) => {
              const Icon = dept.icon;
              const count = issues.filter((i) => i.assignedDepartment === dept.name).length;
              return (
                <button
                  key={dept.code}
                  onClick={() => setSelectedDept(dept.name)}
                  style={{
                    background: selectedDept === dept.name ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedDept === dept.name ? '#c084fc' : 'var(--text-muted)',
                    border: selectedDept === dept.name ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Icon size={14} color={dept.color} />
                  {dept.name.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(10, 15, 26, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '8px 14px',
              flex: '1',
              maxWidth: '380px',
            }}>
              <Search size={16} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Search ticket #, defect, or street..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'Pending Triage', 'In Progress', 'Resolved'].map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStatus(stat)}
                  style={{
                    background: selectedStatus === stat ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedStatus === stat ? '#38bdf8' : 'var(--text-muted)',
                    border: selectedStatus === stat ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>

          {/* Triage Queue Table */}
          <div className="glass-panel" style={{ borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>TICKET & EVIDENCE</th>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>DEFECT & SEVERITY</th>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTMENT & WARD</th>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>SLA DIRECTIVE</th>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS TRANSITION</th>
                    <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((item) => (
                    <tr
                      key={item._id || item.ticketId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Ticket & Photo */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={item.media?.photoUrl}
                            alt=""
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.82rem' }}>
                              {item.ticketId}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Defect Title & Priority */}
                      <td style={{ padding: '14px 18px', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px', lineHeight: 1.3 }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${
                            item.priority === 'Urgent' ? 'badge-urgent' :
                            item.priority === 'High' ? 'badge-high' : 'badge-medium'
                          }`}>
                            {item.priority}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Hazard: {item.aiAnalysis?.hazardScore || 80}/100
                          </span>
                        </div>
                      </td>

                      {/* Department & Address */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 500, marginBottom: '2px' }}>
                          {item.assignedDepartment}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {item.address?.formatted}
                        </div>
                      </td>

                      {/* SLA Directive */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          background: item.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: item.priority === 'Urgent' ? '#fca5a5' : '#6ee7b7',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}>
                          {item.aiAnalysis?.recommendedTimeline || '< 24 Hours'}
                        </span>
                      </td>

                      {/* Quick Status Select */}
                      <td style={{ padding: '14px 18px' }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatusChange(item._id || item.ticketId, e.target.value)}
                          style={{
                            background: 'rgba(10, 15, 26, 0.9)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: item.status === 'Resolved' ? '#10b981' : item.status === 'In Progress' ? '#38bdf8' : '#f59e0b',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        >
                          <option value="Pending Triage">Pending Triage</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => onSelectIssue(item)}
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                        >
                          Inspect <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail: SMS & Email Dispatches */
        <div className="glass-panel" style={{ borderRadius: '18px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Smartphone size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Automated Dispatch & Notification Audit Log</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Real-time audit trail of SMS alerts dispatched to department Junior Engineers and SMS status updates transmitted to citizens.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: log.type === 'CITIZEN_SMS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: log.type === 'CITIZEN_SMS' ? '#38bdf8' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {log.type === 'CITIZEN_SMS' ? <Smartphone size={18} /> : log.type === 'EMAIL_DISPATCH' ? <Mail size={18} /> : <Send size={18} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        {log.type === 'CITIZEN_SMS' ? 'Citizen Status SMS Alert' : log.type === 'SMS_ALERT' ? 'Department Engineer Rapid SMS' : 'Official Email Dispatch'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', lineHeight: 1.4 }}>
                      {log.message}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Recipient: <strong style={{ color: '#fff' }}>{log.recipient}</strong></span>
                      <span>Role: <strong style={{ color: '#38bdf8' }}>{log.recipientRole}</strong></span>
                      <span>Delivery: <strong style={{ color: '#10b981' }}>{log.status}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                No notifications logged in this session yet. Submit a grievance or update a status to see live alerts!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
