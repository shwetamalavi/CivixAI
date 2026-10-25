import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  headOfficer: {
    name: String,
    designation: String,
    email: String,
    phone: String,
  },
  slaHours: {
    urgent: { type: Number, default: 12 },
    high: { type: Number, default: 24 },
    medium: { type: Number, default: 48 },
    low: { type: Number, default: 96 },
  },
  activeStaffCount: { type: Number, default: 15 },
  color: { type: String, default: '#3b82f6' },
  icon: { type: String, default: 'Building2' },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
