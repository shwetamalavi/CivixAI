import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function IssueCard({ issue, onSelect }) {
  const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (hasUpvoted || isUpvoting) return;

    setIsUpvoting(true);
    setUpvotes((prev) => prev + 1);
    setHasUpvoted(true);

    try {
      await api.upvoteIssue(issue._id || issue.ticketId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const getPriorityBadgeClass = (pri) => {
    switch (pri) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getStatusBadgeClass = (stat) => {
    switch (stat) {
      case 'Resolved': return 'badge-resolved';
      case 'In Progress': return 'badge-progress';
      case 'Assigned': return 'badge-progress';
      default: return 'badge-pending';
    }
  };

  const hazard = issue.aiAnalysis?.hazardScore || (issue.priority === 'Urgent' ? 92 : issue.priority === 'High' ? 78 : 55);

  return (
    <div
      onClick={() => onSelect(issue)}
      className="glass-panel glass-panel-interactive"
      style={{
        borderRadius: '18px',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Photo Header */}
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
        <img
          src={issue.media?.photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000'}
          alt={issue.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(7, 11, 19, 0.9) 0%, transparent 60%)',
        }} />

        {/* Top Badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span className={`badge ${getPriorityBadgeClass(issue.priority)}`}>
            {issue.priority === 'Urgent' && <Flame size={12} className="animate-pulse-glow" />}
            {issue.priority}
          </span>

          <span className={`badge ${getStatusBadgeClass(issue.status)}`}>
            {issue.status}
          </span>
        </div>

        {/* Hazard Score Pill */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '999px',
          padding: '4px 10px',
          fontSize: '0.72rem',
          color: '#fff',
        }}>
          <Sparkles size={12} color="#38bdf8" />
          <span>Hazard Score: <strong style={{ color: hazard >= 85 ? '#ef4444' : '#38bdf8' }}>{hazard}/100</strong></span>
        </div>

        {/* Ticket ID */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 8px',
          borderRadius: '6px',
        }}>
          {issue.ticketId}
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontSize: '1.05rem',
          color: '#fff',
          lineHeight: 1.35,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {issue.title}
        </h3>

        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}>
          {issue.description || issue.aiAnalysis?.rawSummary || 'Reported civic issue requiring municipal remediation.'}
        </p>

        {/* Address */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          marginBottom: '8px',
        }}>
          <MapPin size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {issue.address?.formatted || 'Metro City Central'}
          </span>
        </div>

        {/* Department */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: '14px',
        }}>
          <Building2 size={14} color="#8b5cf6" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
            {issue.assignedDepartment || 'Public Works & Civic Infrastructure'}
          </span>
        </div>

        {/* Bottom Actions Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={handleUpvote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: hasUpvoted ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: hasUpvoted ? '1px solid #0284c7' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: hasUpvoted ? '#38bdf8' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ThumbsUp size={14} />
            <span>{upvotes}</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            color: '#38bdf8',
            fontWeight: 600,
          }}>
            Inspect Case <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
