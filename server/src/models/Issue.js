import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
}, { _id: false });

const issueSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['ROADS', 'SANITATION', 'ELECTRICAL', 'WATER', 'SAFETY', 'OTHER'],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['Urgent', 'High', 'Medium', 'Low'],
    default: 'Medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['Pending Triage', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending Triage',
    index: true,
  },
  // Geospatial Indexing (2dsphere) to query issues near a given location
  location: {
    type: pointSchema,
    required: true,
    index: '2dsphere',
  },
  address: {
    street: String,
    landmark: String,
    area: String,
    city: { type: String, default: 'Metro City' },
    postalCode: String,
    formatted: { type: String, required: true },
  },
  media: {
    photoUrl: { type: String, required: true },
    resolutionPhotoUrl: { type: String, default: '' },
    thumbnailUrl: String,
  },
  aiAnalysis: {
    analyzedAt: { type: Date, default: Date.now },
    modelUsed: { type: String, default: 'Gemini 1.5 Flash' },
    identifiedProblem: String,
    category: String,
    severity: String,
    hazardScore: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 1 },
    detectedObjects: [String],
    recommendedDepartment: String,
    recommendedTimeline: String,
    grievanceDraft: String,
    rawSummary: String,
  },
  assignedDepartment: {
    type: String,
    default: 'Public Works & Civic Infrastructure',
  },
  assignedOfficer: {
    name: { type: String, default: 'Unassigned' },
    phone: String,
    email: String,
  },
  citizenInfo: {
    name: { type: String, default: 'Concerned Citizen' },
    phone: { type: String, default: '+1 (555) 234-5678' },
    email: { type: String, default: 'citizen@example.org' },
    anonymous: { type: Boolean, default: false },
  },
  timeline: [
    {
      status: String,
      note: String,
      updatedBy: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  upvotes: {
    type: Number,
    default: 1,
  },
  comments: [
    {
      author: String,
      text: String,
      isOfficial: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// Geospatial Indexing (2dsphere) on location is configured on field definition
export default mongoose.models.Issue || mongoose.model('Issue', issueSchema);
