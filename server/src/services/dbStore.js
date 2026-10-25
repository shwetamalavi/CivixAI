import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Department from '../models/Department.js';
import { initialIssues, initialDepartments } from '../seed/seedData.js';

// In-Memory store fallback
let inMemoryIssues = [...initialIssues];
let inMemoryDepartments = [...initialDepartments];

// Calculate distance in meters using Haversine formula
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const dbStore = {
  isMongoActive() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  },

  async seedIfEmpty() {
    if (this.isMongoActive()) {
      try {
        const count = await Issue.countDocuments();
        if (count === 0) {
          console.log('[CivixAI] Seeding MongoDB with initial civic dataset...');
          await Issue.insertMany(initialIssues);
        }
        const deptCount = await Department.countDocuments();
        if (deptCount === 0) {
          await Department.insertMany(initialDepartments);
        }
      } catch (e) {
        console.error('[CivixAI] Seed error:', e.message);
      }
    }
  },

  async getIssues(filter = {}, sort = { createdAt: -1 }) {
    if (this.isMongoActive()) {
      const query = {};
      if (filter.category && filter.category !== 'ALL') query.category = filter.category;
      if (filter.status && filter.status !== 'ALL') query.status = filter.status;
      if (filter.priority && filter.priority !== 'ALL') query.priority = filter.priority;
      if (filter.department && filter.department !== 'ALL') query.assignedDepartment = filter.department;
      if (filter.search) {
        query.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { ticketId: { $regex: filter.search, $options: 'i' } },
          { 'address.formatted': { $regex: filter.search, $options: 'i' } },
        ];
      }
      return await Issue.find(query).sort(sort);
    }

    // In-memory filter
    let results = [...inMemoryIssues];
    if (filter.category && filter.category !== 'ALL') {
      results = results.filter((i) => i.category === filter.category);
    }
    if (filter.status && filter.status !== 'ALL') {
      results = results.filter((i) => i.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'ALL') {
      results = results.filter((i) => i.priority === filter.priority);
    }
    if (filter.department && filter.department !== 'ALL') {
      results = results.filter((i) => i.assignedDepartment === filter.department);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.ticketId?.toLowerCase().includes(q) ||
          i.address?.formatted?.toLowerCase().includes(q)
      );
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getIssueById(idOrTicket) {
    if (this.isMongoActive()) {
      return (
        (await Issue.findById(idOrTicket).catch(() => null)) ||
        (await Issue.findOne({ ticketId: idOrTicket }))
      );
    }
    return inMemoryIssues.find((i) => i._id === idOrTicket || i.ticketId === idOrTicket);
  },

  // TC-18: Check for duplicate active civic issues
  async findDuplicateIssue({ title, description, category, coordinates, thresholdMeters = 60 }) {
    const normTitle = (title || '').trim().toLowerCase();
    const normDesc = (description || '').trim().toLowerCase();
    const [targetLng, targetLat] = coordinates || [-73.985131, 40.748817];

    const allIssues = await this.getIssues({});
    const now = Date.now();
    const activeWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const issue of allIssues) {
      if (issue.status === 'Resolved') continue;
      const issueTime = new Date(issue.createdAt).getTime();
      if (now - issueTime > activeWindowMs) continue;

      const issueTitle = (issue.title || '').trim().toLowerCase();
      const issueDesc = (issue.description || '').trim().toLowerCase();

      // Text match: exact or high similarity
      const sameTitle = normTitle && issueTitle && (normTitle === issueTitle || (normTitle.length > 20 && issueTitle.includes(normTitle)));
      const sameDesc = normDesc && issueDesc && (normDesc === issueDesc || (normDesc.length > 25 && issueDesc.includes(normDesc)));

      // Geospatial proximity (< 60 meters) + same category + common defect keywords
      let nearbySameCategory = false;
      if (issue.location && Array.isArray(issue.location.coordinates) && issue.location.coordinates.length === 2) {
        const [lng, lat] = issue.location.coordinates;
        const dist = getDistanceInMeters(targetLat, targetLng, lat, lng);
        if (dist <= thresholdMeters && category && issue.category === category) {
          const words1 = `${normTitle} ${normDesc}`.split(/\W+/).filter((w) => w.length > 4);
          const words2 = `${issueTitle} ${issueDesc}`.split(/\W+/).filter((w) => w.length > 4);
          const commonWords = words1.filter((w) => words2.includes(w));
          if (commonWords.length >= 2) {
            nearbySameCategory = true;
          }
        }
      }

      if (sameTitle || sameDesc || nearbySameCategory) {
        return issue;
      }
    }
    return null;
  },

  async createIssue(issueData) {
    if (!issueData.ticketId) {
      issueData.ticketId = `CVX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (this.isMongoActive()) {
      return await Issue.create(issueData);
    }

    const created = {
      _id: `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      upvotes: 1,
      comments: [],
      timeline: [
        {
          status: issueData.status || 'Pending Triage',
          note: 'Civic grievance officially registered in CivixAI Portal.',
          updatedBy: 'CivixAI Automated System',
          timestamp: new Date(),
        },
      ],
      ...issueData,
    };
    inMemoryIssues.unshift(created);
    return created;
  },

  async updateIssue(idOrTicket, updateData) {
    if (this.isMongoActive()) {
      let updated = await Issue.findByIdAndUpdate(idOrTicket, updateData, { new: true });
      if (!updated) {
        updated = await Issue.findOneAndUpdate({ ticketId: idOrTicket }, updateData, { new: true });
      }
      return updated;
    }

    const index = inMemoryIssues.findIndex((i) => i._id === idOrTicket || i.ticketId === idOrTicket);
    if (index === -1) return null;

    inMemoryIssues[index] = {
      ...inMemoryIssues[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return inMemoryIssues[index];
  },

  async addStatusUpdate(idOrTicket, { status, note, updatedBy, resolutionPhotoUrl }) {
    const updatePayload = {
      status,
      $push: {
        timeline: {
          status,
          note: note || `Status transitioned to ${status}`,
          updatedBy: updatedBy || 'Municipal Official',
          timestamp: new Date(),
        },
      },
    };

    if (resolutionPhotoUrl) {
      updatePayload['media.resolutionPhotoUrl'] = resolutionPhotoUrl;
    }

    if (this.isMongoActive()) {
      return await Issue.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(idOrTicket) ? idOrTicket : null }, { ticketId: idOrTicket }] },
        updatePayload,
        { new: true }
      );
    }

    const issue = inMemoryIssues.find((i) => i._id === idOrTicket || i.ticketId === idOrTicket);
    if (!issue) return null;

    issue.status = status;
    if (resolutionPhotoUrl) {
      if (!issue.media) issue.media = {};
      issue.media.resolutionPhotoUrl = resolutionPhotoUrl;
    }
    if (!issue.timeline) issue.timeline = [];
    issue.timeline.push({
      status,
      note: note || `Status transitioned to ${status}`,
      updatedBy: updatedBy || 'Municipal Official',
      timestamp: new Date(),
    });
    issue.updatedAt = new Date();
    return issue;
  },

  async addUpvote(idOrTicket) {
    if (this.isMongoActive()) {
      return await Issue.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(idOrTicket) ? idOrTicket : null }, { ticketId: idOrTicket }] },
        { $inc: { upvotes: 1 } },
        { new: true }
      );
    }
    const issue = inMemoryIssues.find((i) => i._id === idOrTicket || i.ticketId === idOrTicket);
    if (issue) {
      issue.upvotes = (issue.upvotes || 0) + 1;
    }
    return issue;
  },

  async addComment(idOrTicket, commentData) {
    const newComment = {
      author: commentData.author || 'Citizen',
      text: commentData.text,
      isOfficial: commentData.isOfficial || false,
      timestamp: new Date(),
    };

    if (this.isMongoActive()) {
      return await Issue.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(idOrTicket) ? idOrTicket : null }, { ticketId: idOrTicket }] },
        { $push: { comments: newComment } },
        { new: true }
      );
    }

    const issue = inMemoryIssues.find((i) => i._id === idOrTicket || i.ticketId === idOrTicket);
    if (issue) {
      if (!issue.comments) issue.comments = [];
      issue.comments.push(newComment);
    }
    return issue;
  },

  // Geospatial Query using MongoDB 2dsphere index or Haversine distance
  async findNear(longitude, latitude, maxDistanceMeters = 5000) {
    if (this.isMongoActive()) {
      try {
        return await Issue.find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              },
              $maxDistance: parseInt(maxDistanceMeters),
            },
          },
        });
      } catch (err) {
        console.warn('[CivixAI] MongoDB $near failed, falling back to spherical calc:', err.message);
      }
    }

    // Haversine fallback for memory mode
    const targetLng = parseFloat(longitude);
    const targetLat = parseFloat(latitude);
    const maxDist = parseInt(maxDistanceMeters);

    return inMemoryIssues
      .map((item) => {
        const [lng, lat] = item.location?.coordinates || [0, 0];
        const dist = getDistanceInMeters(targetLat, targetLng, lat, lng);
        return { ...item, distanceMeters: Math.round(dist) };
      })
      .filter((item) => item.distanceMeters <= maxDist)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  },

  async getDepartments() {
    if (this.isMongoActive()) {
      return await Department.find();
    }
    return inMemoryDepartments;
  },

  async getAnalytics() {
    const all = await this.getIssues();
    const total = all.length;
    const pending = all.filter((i) => i.status === 'Pending Triage').length;
    const assigned = all.filter((i) => i.status === 'Assigned').length;
    const inProgress = all.filter((i) => i.status === 'In Progress').length;
    const resolved = all.filter((i) => i.status === 'Resolved').length;
    const urgent = all.filter((i) => i.priority === 'Urgent').length;

    const byCategory = {};
    const byDepartment = {};

    all.forEach((i) => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      const dept = i.assignedDepartment || 'General PWD';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    return {
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      urgent,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      byCategory,
      byDepartment,
    };
  },
};
