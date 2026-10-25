import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin'],
    default: 'citizen',
  },
  department: String,
  wardNumber: String,
  avatar: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
