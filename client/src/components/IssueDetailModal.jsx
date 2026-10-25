import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  Building2,
  Sparkles,
  FileText,
  Send,
  Printer,
  Copy,
  Check,
  User,
  Shield,
  Phone,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';

function IssueDetailContent({ issue, onClose, onIssueUpdated }) {
  const [currentIssue, setCurrentIssue] = useState(issue);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'grievance' | 'admin'
  const [newStatus, setNewStatus] = useState(issue?.status || 'Pending Triage');
  const [officerNote, setOfficerNote] = useState('');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState(issue?.media?.resolutionPhotoUrl || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateIssueStatus(currentIssue._id || currentIssue.ticketId, {
        status: newStatus,
        note: officerNote || `Status updated to ${newStatus}`,
        updatedBy: 'Municipal Senior Inspector',
        resolutionPhotoUrl: newStatus === 'Resolved' ? (resolutionPhotoUrl || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000') : '',
      });

      if (res.success) {
        setCurrentIssue(res.data);
        if (onIssueUpdated) onIssueUpdated(res.data);
        setOfficerNote('');
      } else {
        alert(res.error || 'Failed to update status');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsAddingComment(true);
    try {
      const res = await api.addComment(currentIssue._id || currentIssue.ticketId, {
        author: commentAuthor.trim() || 'Citizen Observer',
        text: commentText.trim(),
        isOfficial: false,
      });

      if (res.success) {
        setCurrentIssue(res.data);
        if (onIssueUpdated) onIssueUpdated(res.data);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCopyGrievance = () => {
    if (currentIssue?.aiAnalysis?.grievanceDraft) {
      navigator.clipboard.writeText(currentIssue.aiAnalysis.grievanceDraft);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2500);
    }
  };

  const handlePrintGrievance = () => {
    window.print();
  };

  const hazard = currentIssue?.aiAnalysis?.hazardScore || 85;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '24px',
        border: '1px solid var(--border-accent)',
        padding: '30px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg), 0 0 35px rgba(6, 182, 212, 0.25)',
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '18px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#38bdf8',
                background: 'rgba(6, 182, 212, 0.15)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 700,
              }}>
                {currentIssue.ticketId}
              </span>

              <span className={`badge ${
                currentIssue.priority === 'Urgent' ? 'badge-urgent' :
                currentIssue.priority === 'High' ? 'badge-high' : 'badge-medium'
              }`}>
                {currentIssue.priority}
              </span>

              <span className={`badge ${
                currentIssue.status === 'Resolved' ? 'badge-resolved' :
                currentIssue.status === 'In Progress' ? 'badge-progress' : 'badge-pending'
              }`}>
                {currentIssue.status}
              </span>
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{currentIssue.title}</h2>
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
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'overview' ? '#38bdf8' : 'var(--text-muted)',
              border: activeTab === 'overview' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Case Overview & Timeline
          </button>

          <button
            onClick={() => setActiveTab('grievance')}
            style={{
              background: activeTab === 'grievance' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'grievance' ? '#38bdf8' : 'var(--text-muted)',
              border: activeTab === 'grievance' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={15} /> Official Grievance Document
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            style={{
              background: activeTab === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
              color: activeTab === 'admin' ? '#c084fc' : 'var(--text-muted)',
              border: activeTab === 'admin' ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={15} /> Municipal Officer Actions
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Left Column: Photos & Details */}
            <div>
              {/* Photo Evidence / Resolution Proof */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  {currentIssue.media?.resolutionPhotoUrl ? 'Before & After Photographic Evidence' : 'Reported Photo Evidence'}
                </span>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: currentIssue.media?.resolutionPhotoUrl ? '1fr 1fr' : '1fr',
                  gap: '10px',
                }}>
                  <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '220px' }}>
                    <img
                      src={currentIssue.media?.photoUrl}
                      alt="Initial defect"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      fontSize: '0.7rem',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}>
                      INITIAL DEFECT
                    </span>
                  </div>

                  {currentIssue.media?.resolutionPhotoUrl && (
                    <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '220px' }}>
                      <img
                        src={currentIssue.media?.resolutionPhotoUrl}
                        alt="Resolution proof"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        fontSize: '0.7rem',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}>
                        RESOLVED PROOF
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Diagnostics Box */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid var(--border-accent)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={16} color="#38bdf8" />
                  <h4 style={{ fontSize: '0.88rem', color: '#fff' }}>Multimodal AI Vision Audit</h4>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#e2e8f0', marginBottom: '10px', lineHeight: 1.4 }}>
                  <strong>Defect:</strong> {currentIssue.aiAnalysis?.identifiedProblem || currentIssue.title}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assessed Hazard Index:</span>
                  <span style={{ color: hazard >= 85 ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>{hazard} / 100</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Department:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{currentIssue.assignedDepartment}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SLA Directive:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{currentIssue.aiAnalysis?.recommendedTimeline || 'Within 24 Hours'}</span>
                </div>
              </div>

              {/* Location details */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#06b6d4', fontSize: '0.82rem', fontWeight: 600 }}>
                  <MapPin size={14} /> Geographical Telemetry
                </div>
                <p style={{ fontSize: '0.82rem', color: '#fff', marginBottom: '6px' }}>
                  {currentIssue.address?.formatted}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Coordinates: [{currentIssue.location?.coordinates[0].toFixed(6)}, {currentIssue.location?.coordinates[1].toFixed(6)}] (GeoJSON 2dsphere Indexed)
                </p>
              </div>
            </div>

            {/* Right Column: Timeline & Discussion */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#38bdf8" /> Official Resolution Timeline
              </h4>

              {/* Status Timeline Progress */}
              <div style={{
                borderLeft: '2px solid rgba(56, 189, 248, 0.3)',
                marginLeft: '10px',
                paddingLeft: '18px',
                marginBottom: '24px',
              }}>
                {currentIssue.timeline && currentIssue.timeline.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: '18px' }}>
                    {/* Timeline Node */}
                    <div style={{
                      position: 'absolute',
                      left: '-25px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: step.status === 'Resolved' ? '#10b981' : step.status === 'In Progress' ? '#0284c7' : '#f59e0b',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        {step.status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      {step.note}
                    </p>

                    <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>
                      By: {step.updatedBy}
                    </span>
                  </div>
                ))}
              </div>

              {/* Public Discussion / Comments */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '12px' }}>
                  Citizen Discussion & Updates ({currentIssue.comments?.length || 0})
                </h4>

                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  {currentIssue.comments && currentIssue.comments.length > 0 ? (
                    currentIssue.comments.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          background: c.isOfficial ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: c.isOfficial ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c.isOfficial ? '#c084fc' : '#fff' }}>
                            {c.author} {c.isOfficial && '(Official)'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {new Date(c.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '14px' }}>
                      No community comments yet. Add the first note!
                    </div>
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    style={{
                      width: '130px',
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Add observation or update..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isAddingComment}
                    style={{ padding: '8px 12px' }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Official Grievance Document */}
        {activeTab === 'grievance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', color: '#fff' }}>Official Civic Grievance Notice</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Auto-drafted by Multimodal AI for municipal filing & RTI compliance
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyGrievance}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {copiedDraft ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedDraft ? 'Copied!' : 'Copy Filing Text'}
                </button>
                <button
                  type="button"
                  onClick={handlePrintGrievance}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <Printer size={14} /> Print Notice
                </button>
              </div>
            </div>

            <div style={{
              background: '#0a0f1d',
              border: '1px solid var(--border-accent)',
              borderRadius: '12px',
              padding: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
            }}>
              {currentIssue.aiAnalysis?.grievanceDraft || 'Official grievance letter will be generated on submission.'}
            </div>
          </div>
        )}

        {/* Tab 3: Municipal Officer Actions */}
        {activeTab === 'admin' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Shield size={20} color="#c084fc" />
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Municipal Officer Governance Action</h3>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Transition Ticket Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(10, 15, 26, 0.95)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Pending Triage">Pending Triage</option>
                    <option value="Assigned">Assigned to Engineer</option>
                    <option value="In Progress">In Progress (Field Work Underway)</option>
                    <option value="Resolved">Resolved (Work Completed)</option>
                    <option value="Rejected">Rejected (Out of Municipal Scope)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Officer Inspection / Resolution Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter dispatch notes, crew assignment, or completion details..."
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(10, 15, 26, 0.95)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                {newStatus === 'Resolved' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10b981', display: 'block', marginBottom: '6px' }}>
                      Resolution Proof Photo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or paste image URL"
                      value={resolutionPhotoUrl}
                      onChange={(e) => setResolutionPhotoUrl(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(10, 15, 26, 0.95)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUpdatingStatus}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                      boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)',
                    }}
                  >
                    <ArrowRight size={16} /> Save Status & Trigger Citizen SMS Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IssueDetailModal({ issue, onClose, onIssueUpdated }) {
  if (!issue) return null;
  return (
    <IssueDetailContent
      key={issue._id || issue.ticketId}
      issue={issue}
      onClose={onClose}
      onIssueUpdated={onIssueUpdated}
    />
  );
}
