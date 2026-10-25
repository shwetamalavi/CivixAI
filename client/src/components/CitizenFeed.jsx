import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Flame,
  Truck,
  Trash2,
  Zap,
  Droplets,
  ShieldAlert,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import IssueCard from './IssueCard.jsx';

export default function CitizenFeed({
  issues = [],
  onSelectIssue,
  onOpenReport,
  onSwitchToMap,
}) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activePriority, setActivePriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'upvotes' | 'hazard'

  const categories = [
    { id: 'ALL', label: 'All Issues', icon: null },
    { id: 'ROADS', label: 'Roads & Potholes', icon: Truck },
    { id: 'SANITATION', label: 'Garbage & Waste', icon: Trash2 },
    { id: 'ELECTRICAL', label: 'Streetlights & Wires', icon: Zap },
    { id: 'WATER', label: 'Water Mains & Leaks', icon: Droplets },
    { id: 'SAFETY', label: 'Public Hazards', icon: ShieldAlert },
  ];

  // Filtering
  let filtered = issues.filter((item) => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    if (activePriority !== 'ALL' && item.priority !== activePriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.ticketId?.toLowerCase().includes(q) ||
        item.address?.formatted?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sorting
  if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'upvotes') {
    filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else if (sortBy === 'hazard') {
    filtered.sort((a, b) => (b.aiAnalysis?.hazardScore || 0) - (a.aiAnalysis?.hazardScore || 0));
  }

  const urgentCount = issues.filter((i) => i.priority === 'Urgent').length;

  return (
    <div>
      {/* Hero Header Banner */}
      <div className="glass-panel" style={{
        borderRadius: '24px',
        padding: '36px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.9) 0%, rgba(10, 16, 30, 0.7) 100%)',
        border: '1px solid var(--border-accent)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Sparkles size={12} /> GEMINI MULTIMODAL COMPUTER VISION ACTIVE
            </span>

            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '999px',
            }}>
              2dsphere Geospatial Indexing Active
            </span>
          </div>

          <h1 style={{
            fontSize: '2.4rem',
            lineHeight: 1.15,
            marginBottom: '12px',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 40%, #bae6fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Snap Civic Defects. AI Classifies & Auto-Dispatches to Municipal Works.
          </h1>

          <p style={{
            fontSize: '1.02rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}>
            CivixAI eliminates slow government red-tape. Snap a photo of a pothole, uncollected garbage, or exposed power wire. Our multimodal vision AI detects severity, drafts a formal grievance document, and routes it directly to the engineer's queue.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <button
              id="btn-hero-report"
              onClick={onOpenReport}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <PlusCircle size={20} /> Snap & File Issue with AI
            </button>

            <button
              id="btn-hero-map"
              onClick={onSwitchToMap}
              className="btn-secondary"
              style={{ padding: '12px 22px', fontSize: '0.95rem' }}
            >
              <MapPin size={18} color="#06b6d4" /> Explore Interactive GIS Map
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* Category Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = cat.id === 'ALL' ? issues.length : issues.filter((i) => i.category === cat.id).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: isActive ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {Icon && <Icon size={14} />}
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Priority Filter (e.g. Urgent Only) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActivePriority(activePriority === 'Urgent' ? 'ALL' : 'Urgent')}
            style={{
              background: activePriority === 'Urgent' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activePriority === 'Urgent' ? '#fca5a5' : 'var(--text-muted)',
              border: activePriority === 'Urgent' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
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
            <Flame size={14} color="#ef4444" className={activePriority === 'Urgent' ? 'animate-pulse-glow' : ''} />
            Urgent Only ({urgentCount})
          </button>
        </div>
      </div>

      {/* Search and Sort Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '22px',
      }}>
        {/* Search Input */}
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
            id="input-citizen-search"
            type="text"
            placeholder="Search by ticket #, defect, or street..."
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

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={14} /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(10, 15, 26, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="newest">Recently Reported</option>
            <option value="upvotes">Most Citizen Upvotes</option>
            <option value="hazard">Highest Hazard Index</option>
          </select>
        </div>
      </div>

      {/* Issues Grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '22px',
        }}>
          {filtered.map((item) => (
            <IssueCard
              key={item._id || item.ticketId}
              issue={item}
              onSelect={onSelectIssue}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '60px 20px',
          textAlign: 'center',
          borderRadius: '20px',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-dim)',
          }}>
            <Search size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>No Civic Grievances Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Try adjusting your search criteria or filter tags.
          </p>
          <button
            onClick={() => {
              setActiveCategory('ALL');
              setActivePriority('ALL');
              setSearchQuery('');
            }}
            className="btn-secondary"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
